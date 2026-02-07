import os
import base64
import io
import csv
from pathlib import Path
from typing import Optional, Any

import numpy as np
import tensorflow as tf
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image

load_dotenv()

app = FastAPI(title="ML Model Inference Service")

# In-memory model cache
_loaded_models: dict[str, tf.keras.Model] = {}


class PredictRequest(BaseModel):
    model_path: str
    model_key: str
    input_type: str = "numeric"
    output_type: str = "classification"
    # Different input fields depending on type
    inputs: Optional[list] = None
    image_base64: Optional[str] = None
    text: Optional[str] = None
    texts: Optional[list[str]] = None
    csv_data: Optional[str] = None
    json_data: Optional[Any] = None


# --------------- Model Loading ---------------

def load_model(model_path: str, model_key: str) -> tf.keras.Model:
    if model_key not in _loaded_models:
        print(f"Loading model from: {model_path}")
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        _loaded_models[model_key] = tf.keras.models.load_model(model_path)

        m = _loaded_models[model_key]
        try:
            in_shape = m.input_shape
        except AttributeError:
            in_shape = m.inputs[0].shape if m.inputs else "unknown"
        try:
            out_shape = m.output_shape
        except AttributeError:
            out_shape = m.outputs[0].shape if m.outputs else "unknown"

        print(f"Model loaded: {model_key}")
        print(f"  Input shape:  {in_shape}")
        print(f"  Output shape: {out_shape}")

    return _loaded_models[model_key]


def get_input_shape(model):
    try:
        return model.input_shape
    except AttributeError:
        return model.inputs[0].shape


# --------------- Input Preprocessors ---------------

def preprocess_image(image_base64: str, model: tf.keras.Model) -> np.ndarray:
    """Decode base64 image, resize to model input shape, normalize."""
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes))

    input_shape = get_input_shape(model)
    # input_shape: (batch, height, width, channels)
    target_h = input_shape[1]
    target_w = input_shape[2]
    channels = input_shape[3] if len(input_shape) == 4 else 1

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


def preprocess_numeric(inputs: list, model: tf.keras.Model) -> np.ndarray:
    """Convert numeric list to numpy array with correct shape."""
    input_data = np.array(inputs, dtype=np.float32)
    if input_data.ndim == 1:
        input_data = input_data.reshape(1, -1)
    return input_data


def preprocess_csv(csv_data: str, model: tf.keras.Model) -> np.ndarray:
    """Parse CSV string into numpy array for tabular models."""
    reader = csv.reader(io.StringIO(csv_data))
    rows = list(reader)

    # Skip header if first row contains non-numeric values
    start = 0
    try:
        [float(x) for x in rows[0]]
    except (ValueError, IndexError):
        start = 1

    data = []
    for row in rows[start:]:
        data.append([float(x) for x in row])

    input_data = np.array(data, dtype=np.float32)
    return input_data


def preprocess_text(text: str) -> np.ndarray:
    """
    Basic text preprocessing. For real NLP models, you'd want
    tokenization matching the model's training (e.g., tokenizer.json).
    This provides a basic approach that works for simple models.
    """
    # Return as-is — the model.predict will need to handle string input
    # or we can do basic character/word encoding
    return text


def preprocess_multi_text(texts: list[str]) -> list[str]:
    """Multiple text inputs for models that take multiple string fields."""
    return texts


# --------------- Output Formatters ---------------

def format_classification(prediction: np.ndarray) -> dict:
    """Format classification output with class and confidence."""
    result = {"prediction": prediction.tolist()}
    if prediction.ndim >= 2 and prediction.shape[-1] > 1:
        result["predicted_class"] = int(np.argmax(prediction, axis=-1)[0])
        result["confidence"] = round(float(np.max(prediction)), 4)
        # Top 5 classes
        if prediction.shape[-1] > 5:
            top_indices = np.argsort(prediction[0])[::-1][:5]
            result["top_5"] = [
                {"class": int(idx), "confidence": round(float(prediction[0][idx]), 4)}
                for idx in top_indices
            ]
    elif prediction.ndim >= 1:
        # Binary classification (single output neuron)
        prob = float(prediction.flat[0])
        result["predicted_class"] = 1 if prob > 0.5 else 0
        result["confidence"] = round(prob if prob > 0.5 else 1 - prob, 4)
    return result


def format_regression(prediction: np.ndarray) -> dict:
    """Format regression output as values."""
    values = prediction.flatten().tolist()
    return {
        "prediction": values,
        "value": values[0] if len(values) == 1 else values,
    }


def format_text_output(prediction: np.ndarray) -> dict:
    """Format text output (e.g., from sequence models)."""
    return {
        "prediction": prediction.tolist(),
    }


def format_image_output(prediction: np.ndarray) -> dict:
    """Format image output as base64 (e.g., from GANs, style transfer)."""
    # Denormalize if values are in [0,1]
    if prediction.max() <= 1.0:
        img_data = (prediction * 255).astype(np.uint8)
    else:
        img_data = prediction.astype(np.uint8)

    # Remove batch dimension
    if img_data.ndim == 4:
        img_data = img_data[0]

    # Handle single channel
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
    """Generic JSON output."""
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
        model = load_model(request.model_path, request.model_key)

        # Preprocess input based on type
        input_type = request.input_type

        if input_type == "image":
            if not request.image_base64:
                raise ValueError("No image_base64 provided for image input model.")
            input_data = preprocess_image(request.image_base64, model)
            print(f"Image preprocessed to shape: {input_data.shape}")

        elif input_type == "text":
            if not request.text:
                raise ValueError("No text provided for text input model.")
            # For text models, we pass text directly — model should handle tokenization
            # or we do basic encoding
            input_data = preprocess_text(request.text)
            print(f"Text input: {input_data[:100]}...")

        elif input_type == "multi_text":
            if not request.texts:
                raise ValueError("No texts provided for multi_text input model.")
            input_data = preprocess_multi_text(request.texts)
            print(f"Multi-text input: {len(input_data)} fields")

        elif input_type == "csv":
            if not request.csv_data:
                raise ValueError("No csv_data provided for CSV input model.")
            input_data = preprocess_csv(request.csv_data, model)
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
            input_data = preprocess_numeric(request.inputs, model)
            print(f"Numeric input shape: {input_data.shape}")

        # Run prediction
        # For text models, the model might need special handling
        if isinstance(input_data, (str, list)) and input_type in ("text", "multi_text"):
            # Text-based models need their own predict path
            # Try using model directly — this works for TF text models
            if isinstance(input_data, str):
                input_data = [input_data]
            prediction = model.predict(np.array(input_data), verbose=0)
        else:
            prediction = model.predict(input_data, verbose=0)

        # Format output based on output type
        formatter = OUTPUT_FORMATTERS.get(request.output_type, format_json_output)
        response = formatter(prediction)

        return response

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "cached_models": len(_loaded_models),
        "tensorflow_version": tf.__version__,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("INFERENCE_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
