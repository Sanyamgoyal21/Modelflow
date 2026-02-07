import os
import base64
import io
import csv
from pathlib import Path
from typing import Optional, Any

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image

load_dotenv()

app = FastAPI(title="ML Model Inference Service")

# In-memory model cache: stores (model_object, framework) tuples
_loaded_models: dict[str, tuple] = {}

# Lazy-load frameworks to avoid import errors if one isn't installed
_tf = None
_torch = None
_onnxruntime = None
_ultralytics_YOLO = None


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


def get_yolo_class():
    global _ultralytics_YOLO
    if _ultralytics_YOLO is None:
        from ultralytics import YOLO
        _ultralytics_YOLO = YOLO
    return _ultralytics_YOLO


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


# --------------- Model Loading ---------------

def detect_framework(model_path: str) -> str:
    """Detect which framework to use based on file extension."""
    ext = Path(model_path).suffix.lower()
    if ext in (".h5", ".keras"):
        return "keras"
    elif ext in (".pt", ".pth"):
        return "pytorch"
    elif ext == ".onnx":
        return "onnx"
    else:
        return "keras"  # default fallback


def load_model(model_path: str, model_key: str) -> tuple:
    """Load model and return (model, framework) tuple."""
    if model_key not in _loaded_models:
        print(f"Loading model from: {model_path}")
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        framework = detect_framework(model_path)

        if framework == "keras":
            tf = get_tf()
            model = tf.keras.models.load_model(model_path)
            try:
                in_shape = model.input_shape
            except AttributeError:
                in_shape = model.inputs[0].shape if model.inputs else "unknown"
            try:
                out_shape = model.output_shape
            except AttributeError:
                out_shape = model.outputs[0].shape if model.outputs else "unknown"
            print(f"  Keras model loaded")
            print(f"  Input shape:  {in_shape}")
            print(f"  Output shape: {out_shape}")

        elif framework == "pytorch":
            # Try ultralytics YOLO first (common for .pt detection models)
            try:
                YOLO = get_yolo_class()
                model = YOLO(model_path)
                framework = "yolo"
                print(f"  YOLO/Ultralytics model loaded")
            except Exception:
                # Standard PyTorch loading
                torch = get_torch()
                try:
                    model = torch.load(model_path, map_location="cpu", weights_only=False)
                    if isinstance(model, dict):
                        raise ValueError("File contains state_dict, not a full model. "
                                         "Please save with torch.save(model, path) not torch.save(model.state_dict(), path).")
                    model.eval()
                except Exception as e:
                    if "state_dict" in str(e):
                        raise ValueError(
                            "This .pt file contains only model weights (state_dict), not a full model. "
                            "Please re-save your model using: torch.save(model, 'model.pt')"
                        ) from e
                    raise
                print(f"  PyTorch model loaded")

        elif framework == "onnx":
            ort = get_onnx()
            model = ort.InferenceSession(model_path)
            input_info = model.get_inputs()
            output_info = model.get_outputs()
            print(f"  ONNX model loaded")
            for inp in input_info:
                print(f"  Input: {inp.name} shape={inp.shape} type={inp.type}")
            for out in output_info:
                print(f"  Output: {out.name} shape={out.shape}")

        _loaded_models[model_key] = (model, framework)
        print(f"  Framework: {framework}")

    return _loaded_models[model_key]


def get_input_shape(model, framework: str):
    """Get model input shape regardless of framework."""
    if framework == "keras":
        try:
            return model.input_shape
        except AttributeError:
            return model.inputs[0].shape
    elif framework == "onnx":
        return model.get_inputs()[0].shape
    else:
        # PyTorch doesn't store input shape — return None
        return None


# --------------- Input Preprocessors ---------------

def preprocess_image(image_base64: str, model, framework: str) -> np.ndarray:
    """Decode base64 image, resize to model input shape, normalize."""
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes))

    input_shape = get_input_shape(model, framework)

    if framework == "pytorch":
        # PyTorch: (batch, channels, height, width) — default to 224x224 if unknown
        if input_shape and len(input_shape) == 4:
            channels, target_h, target_w = input_shape[1], input_shape[2], input_shape[3]
        else:
            channels, target_h, target_w = 3, 224, 224

        if channels == 1:
            image = image.convert("L")
        else:
            image = image.convert("RGB")

        if target_h and target_w:
            image = image.resize((target_w, target_h))

        img_array = np.array(image, dtype=np.float32) / 255.0

        if channels == 1 and img_array.ndim == 2:
            img_array = np.expand_dims(img_array, axis=0)  # (1, H, W)
        elif img_array.ndim == 3:
            img_array = np.transpose(img_array, (2, 0, 1))  # (C, H, W)

        img_array = np.expand_dims(img_array, axis=0)  # (1, C, H, W)

    else:
        # Keras/ONNX: (batch, height, width, channels)
        if input_shape and len(input_shape) >= 4:
            target_h = input_shape[1]
            target_w = input_shape[2]
            channels = input_shape[3] if len(input_shape) == 4 else 1
        else:
            target_h, target_w, channels = 224, 224, 3

        if channels == 1:
            image = image.convert("L")
        else:
            image = image.convert("RGB")

        if target_h and target_w:
            image = image.resize((target_w, target_h))

        img_array = np.array(image, dtype=np.float32) / 255.0

        if channels == 1 and img_array.ndim == 2:
            img_array = np.expand_dims(img_array, axis=-1)

        img_array = np.expand_dims(img_array, axis=0)

    return img_array


def preprocess_numeric(inputs: list) -> np.ndarray:
    input_data = np.array(inputs, dtype=np.float32)
    if input_data.ndim == 1:
        input_data = input_data.reshape(1, -1)
    return input_data


def preprocess_csv(csv_data: str) -> np.ndarray:
    reader = csv.reader(io.StringIO(csv_data))
    rows = list(reader)
    start = 0
    try:
        [float(x) for x in rows[0]]
    except (ValueError, IndexError):
        start = 1
    data = [[float(x) for x in row] for row in rows[start:]]
    return np.array(data, dtype=np.float32)


# --------------- Run Prediction ---------------

def run_prediction(model, framework: str, input_data, output_type: str = "classification"):
    """Run prediction on any framework."""
    if framework == "keras":
        return model.predict(input_data, verbose=0)

    elif framework == "yolo":
        # YOLO models: input_data is a PIL Image or numpy HWC array
        results = model(input_data)
        result = results[0]

        if output_type == "image":
            # Return annotated image with bounding boxes drawn
            annotated = result.plot()  # numpy BGR image
            annotated_rgb = annotated[:, :, ::-1]  # BGR -> RGB
            return annotated_rgb
        else:
            # Return detection data as structured dict
            boxes = result.boxes
            detections = []
            for i in range(len(boxes)):
                det = {
                    "box": boxes.xyxy[i].cpu().numpy().tolist(),
                    "confidence": float(boxes.conf[i].cpu().numpy()),
                    "class_id": int(boxes.cls[i].cpu().numpy()),
                }
                if result.names:
                    det["class_name"] = result.names[det["class_id"]]
                detections.append(det)
            return {"detections": detections, "count": len(detections)}

    elif framework == "pytorch":
        torch = get_torch()
        with torch.no_grad():
            tensor = torch.tensor(input_data, dtype=torch.float32)
            output = model(tensor)
            if isinstance(output, (tuple, list)):
                output = output[0]
            return output.cpu().numpy()

    elif framework == "onnx":
        input_name = model.get_inputs()[0].name
        result = model.run(None, {input_name: input_data})
        return np.array(result[0])

    else:
        raise ValueError(f"Unknown framework: {framework}")


# --------------- Output Formatters ---------------

def format_classification(prediction: np.ndarray) -> dict:
    result = {"prediction": prediction.tolist()}
    if prediction.ndim >= 2 and prediction.shape[-1] > 1:
        result["predicted_class"] = int(np.argmax(prediction, axis=-1)[0])
        result["confidence"] = round(float(np.max(prediction)), 4)
        if prediction.shape[-1] > 5:
            top_indices = np.argsort(prediction[0])[::-1][:5]
            result["top_5"] = [
                {"class": int(idx), "confidence": round(float(prediction[0][idx]), 4)}
                for idx in top_indices
            ]
    elif prediction.ndim >= 1:
        prob = float(prediction.flat[0])
        result["predicted_class"] = 1 if prob > 0.5 else 0
        result["confidence"] = round(prob if prob > 0.5 else 1 - prob, 4)
    return result


def format_regression(prediction: np.ndarray) -> dict:
    values = prediction.flatten().tolist()
    return {"prediction": values, "value": values[0] if len(values) == 1 else values}


def format_text_output(prediction: np.ndarray) -> dict:
    return {"prediction": prediction.tolist()}


def format_image_output(prediction: np.ndarray) -> dict:
    if prediction.max() <= 1.0:
        img_data = (prediction * 255).astype(np.uint8)
    else:
        img_data = prediction.astype(np.uint8)
    if img_data.ndim == 4:
        img_data = img_data[0]
    if img_data.ndim == 3 and img_data.shape[-1] == 1:
        img_data = img_data.squeeze(-1)
    image = Image.fromarray(img_data)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return {
        "prediction": "image",
        "image_base64": img_base64,
        "image_size": {"width": image.width, "height": image.height},
    }


def format_json_output(prediction: np.ndarray) -> dict:
    return {"prediction": prediction.tolist()}


OUTPUT_FORMATTERS = {
    "classification": format_classification,
    "regression": format_regression,
    "text": format_text_output,
    "image": format_image_output,
    "json": format_json_output,
}


# --------------- Prediction Endpoint ---------------

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        model, framework = load_model(request.model_path, request.model_key)
        input_type = request.input_type

        # Preprocess input based on type
        if input_type == "image":
            if not request.image_base64:
                raise ValueError("No image_base64 provided for image input model.")

            if framework == "yolo":
                # YOLO handles its own preprocessing — pass raw PIL image
                image_bytes = base64.b64decode(request.image_base64)
                input_data = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                print(f"YOLO image input: {input_data.size}")
            else:
                input_data = preprocess_image(request.image_base64, model, framework)
                print(f"Image preprocessed to shape: {input_data.shape}")

        elif input_type == "text":
            if not request.text:
                raise ValueError("No text provided for text input model.")
            input_data = np.array([request.text])
            print(f"Text input length: {len(request.text)}")

        elif input_type == "multi_text":
            if not request.texts:
                raise ValueError("No texts provided for multi_text input model.")
            input_data = np.array(request.texts)
            print(f"Multi-text input: {len(request.texts)} fields")

        elif input_type == "csv":
            if not request.csv_data:
                raise ValueError("No csv_data provided for CSV input model.")
            input_data = preprocess_csv(request.csv_data)
            print(f"CSV preprocessed to shape: {input_data.shape}")

        elif input_type == "json":
            if request.json_data is None:
                raise ValueError("No json_data provided for JSON input model.")
            input_data = np.array(request.json_data, dtype=np.float32)
            if input_data.ndim == 1:
                input_data = input_data.reshape(1, -1)
            print(f"JSON preprocessed to shape: {input_data.shape}")

        else:  # numeric
            if request.inputs is None:
                raise ValueError("No inputs provided for numeric input model.")
            input_data = preprocess_numeric(request.inputs)
            print(f"Numeric input shape: {input_data.shape}")

        # Run prediction
        prediction = run_prediction(model, framework, input_data, request.output_type)

        # YOLO returns dict for non-image output, numpy for image output
        if framework == "yolo" and isinstance(prediction, dict):
            prediction["framework"] = framework
            return prediction

        # Format output
        formatter = OUTPUT_FORMATTERS.get(request.output_type, format_json_output)
        response = formatter(prediction)
        response["framework"] = framework

        return response

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/health")
async def health():
    frameworks = []
    try:
        get_tf()
        frameworks.append(f"tensorflow={_tf.__version__}")
    except Exception:
        pass
    try:
        get_torch()
        frameworks.append(f"pytorch={_torch.__version__}")
    except Exception:
        pass
    try:
        get_onnx()
        frameworks.append(f"onnxruntime={_onnxruntime.__version__}")
    except Exception:
        pass

    try:
        get_yolo_class()
        import ultralytics
        frameworks.append(f"ultralytics={ultralytics.__version__}")
    except Exception:
        pass

    return {
        "status": "ok",
        "cached_models": len(_loaded_models),
        "frameworks": frameworks,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("INFERENCE_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
