import os
import base64
import io
import csv
import logging
from pathlib import Path
from typing import Optional, Any

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image

load_dotenv()

# ---------------- Logging ----------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger("inference")

# ---------------- App ----------------
app = FastAPI(title="ModelFlow Inference Service")

# In-memory model cache
_loaded_models: dict[str, tuple] = {}

_tf = None
_torch = None
_onnxruntime = None
_ultralytics_YOLO = None


# ---------------- Lazy loaders ----------------
def get_tf():
    global _tf
    if _tf is None:
        import tensorflow as tf
        _tf = tf
    return _tf


def get_torch():
    global _torch
    if _torch is None:
        import torch
        _torch = torch
    return _torch


def get_onnx():
    global _onnxruntime
    if _onnxruntime is None:
        import onnxruntime
        _onnxruntime = onnxruntime
    return _onnxruntime


def get_yolo():
    global _ultralytics_YOLO
    if _ultralytics_YOLO is None:
        from ultralytics import YOLO
        _ultralytics_YOLO = YOLO
    return _ultralytics_YOLO


# ---------------- Request Schema ----------------
class PredictRequest(BaseModel):
    model_path: str
    model_key: str
    input_type: str = "numeric"
    output_type: str = "classification"

    inputs: Optional[list] = None
    image_base64: Optional[str] = None
    text: Optional[str] = None
    texts: Optional[list[str]] = None
    csv_data: Optional[str] = None
    json_data: Optional[Any] = None


# ---------------- Model Loading ----------------
def detect_framework(model_path: str) -> str:
    ext = Path(model_path).suffix.lower()
    if ext in (".h5", ".keras"):
        return "keras"
    if ext in (".pt", ".pth"):
        return "pytorch"
    if ext == ".onnx":
        return "onnx"
    return "keras"


def load_model(model_path: str, model_key: str):
    if model_key in _loaded_models:
        return _loaded_models[model_key]

    if not Path(model_path).exists():
        raise FileNotFoundError("Model file not found")

    framework = detect_framework(model_path)

    if framework == "keras":
        tf = get_tf()
        model = tf.keras.models.load_model(model_path)

    elif framework == "pytorch":
        try:
            YOLO = get_yolo()
            model = YOLO(model_path)
            framework = "yolo"
        except Exception:
            torch = get_torch()
            model = torch.load(model_path, map_location="cpu")
            model.eval()

    elif framework == "onnx":
        ort = get_onnx()
        model = ort.InferenceSession(model_path)

    _loaded_models[model_key] = (model, framework)
    logger.info(f"Model loaded | key={model_key} | framework={framework}")

    return model, framework


def get_input_shape(model, framework: str):
    if framework == "keras":
        return model.input_shape
    if framework == "onnx":
        return model.get_inputs()[0].shape
    return None


# ---------------- Preprocessing ----------------
def preprocess_image(image_base64: str, model, framework: str) -> np.ndarray:
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    input_shape = get_input_shape(model, framework)

    # Default fallback
    height, width, channels = 224, 224, 3

    if input_shape and len(input_shape) == 4:
        _, height, width, channels = input_shape

    image = image.resize((width, height))
    img = np.array(image, dtype=np.float32) / 255.0
    img = np.expand_dims(img, axis=0)

    return img


def preprocess_numeric(inputs: list) -> np.ndarray:
    arr = np.array(inputs, dtype=np.float32)
    return arr.reshape(1, -1) if arr.ndim == 1 else arr


def preprocess_csv(csv_data: str) -> np.ndarray:
    reader = csv.reader(io.StringIO(csv_data))
    rows = [[float(x) for x in row] for row in reader if row]
    return np.array(rows, dtype=np.float32)


# ---------------- Prediction ----------------
def run_prediction(model, framework: str, input_data):
    if framework == "keras":
        return model.predict(input_data, verbose=0)

    if framework == "yolo":
        results = model(input_data)
        detections = []
        for r in results:
            for i in range(len(r.boxes)):
                detections.append({
                    "box": r.boxes.xyxy[i].cpu().numpy().tolist(),
                    "confidence": float(r.boxes.conf[i]),
                    "class_id": int(r.boxes.cls[i]),
                })
        return {"detections": detections}

    if framework == "pytorch":
        torch = get_torch()
        with torch.no_grad():
            return model(torch.tensor(input_data)).cpu().numpy()

    if framework == "onnx":
        input_name = model.get_inputs()[0].name
        return model.run(None, {input_name: input_data})[0]

    raise ValueError("Unsupported framework")


def format_output(prediction):
    if isinstance(prediction, dict):
        return prediction
    return {"prediction": prediction.tolist()}


# ---------------- API ----------------
@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        model, framework = load_model(request.model_path, request.model_key)

        if request.input_type == "image":
            if not request.image_base64:
                raise ValueError("image_base64 missing")
            input_data = preprocess_image(request.image_base64, model, framework)

        elif request.input_type == "csv":
            input_data = preprocess_csv(request.csv_data)

        elif request.input_type == "json":
            input_data = np.array(request.json_data, dtype=np.float32)

        elif request.input_type == "text":
            input_data = np.array([request.text])

        else:
            input_data = preprocess_numeric(request.inputs)

        prediction = run_prediction(model, framework, input_data)
        response = format_output(prediction)
        response["framework"] = framework

        return response

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not found")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed")


@app.get("/health")
async def health():
    return {"status": "ok", "cached_models": len(_loaded_models)}


# ---------------- Run ----------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=int(os.getenv("INFERENCE_PORT", 8050)),
        workers=1,
        log_level="info",
    )