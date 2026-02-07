import os
import base64
import io
from pathlib import Path
from typing import Optional

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
    inputs: Optional[list] = None
    image_base64: Optional[str] = None


def load_model(model_path: str, model_key: str) -> tf.keras.Model:
    """Load a Keras model, using in-memory cache if available."""
    if model_key not in _loaded_models:
        print(f"Loading model from: {model_path}")
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        _loaded_models[model_key] = tf.keras.models.load_model(model_path)

        m = _loaded_models[model_key]
        # Keras 3 uses .input_shape on the model or first input spec
        try:
            in_shape = m.input_shape
        except AttributeError:
            in_shape = m.inputs[0].shape if m.inputs else "unknown"
        try:
            out_shape = m.output_shape
        except AttributeError:
            out_shape = m.outputs[0].shape if m.outputs else "unknown"

        print(f"Model loaded successfully: {model_key}")
        print(f"Model input shape: {in_shape}")
        print(f"Model output shape: {out_shape}")

    return _loaded_models[model_key]


def get_input_shape(model):
    """Get model input shape, compatible with both Keras 2 and 3."""
    try:
        return model.input_shape
    except AttributeError:
        return model.inputs[0].shape


def preprocess_image(image_base64: str, model: tf.keras.Model) -> np.ndarray:
    """Decode base64 image and resize to match model's expected input shape."""
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes))

    # Get model's expected input shape: (batch, height, width, channels)
    input_shape = get_input_shape(model)
    target_h = input_shape[1]
    target_w = input_shape[2]
    channels = input_shape[3] if len(input_shape) == 4 else 1

    # Convert to RGB or grayscale based on model expectation
    if channels == 1:
        image = image.convert("L")
    else:
        image = image.convert("RGB")

    # Resize to model's expected dimensions
    if target_h and target_w:
        image = image.resize((target_w, target_h))

    # Convert to numpy array and normalize to [0, 1]
    img_array = np.array(image, dtype=np.float32) / 255.0

    # Add channel dimension if grayscale
    if channels == 1 and img_array.ndim == 2:
        img_array = np.expand_dims(img_array, axis=-1)

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    return img_array


@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        model = load_model(request.model_path, request.model_key)

        # Determine input type
        if request.image_base64:
            # Image input - decode, resize, normalize
            input_data = preprocess_image(request.image_base64, model)
            print(f"Image preprocessed to shape: {input_data.shape}")
        elif request.inputs is not None:
            # Numeric input
            input_data = np.array(request.inputs)
            if input_data.ndim == 1:
                input_data = input_data.reshape(1, -1)
        else:
            raise ValueError("No input provided. Send 'image_base64' or 'inputs'.")

        # Run prediction
        prediction = model.predict(input_data, verbose=0)
        result = prediction.tolist()

        # If classification model, also return the predicted class index
        response = {"prediction": result}
        if prediction.shape[-1] > 1:
            predicted_class = int(np.argmax(prediction, axis=-1)[0])
            confidence = float(np.max(prediction))
            response["predicted_class"] = predicted_class
            response["confidence"] = round(confidence, 4)

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
