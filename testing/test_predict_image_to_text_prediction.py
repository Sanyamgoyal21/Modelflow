"""
Test script - simulates User B calling the prediction API with an image
and maps prediction probabilities to class labels.

Usage:
    python test_predict_handgesture_with_labels.py <path_to_image>
"""

import sys
import base64
import requests
import numpy as np

# ---------------- CONFIGURATION ----------------
BASE_URL = "https://unsubdivided-yuriko-valval.ngrok-free.dev"
MODEL_SLUG = "handgesture-dhairya-69bc2472"
API_KEY = "mlh_08851354c388ec860391d56c6ac13a5038bd822d5646af90"
API_URL = f"{BASE_URL}/api/predict/{MODEL_SLUG}"

# 👇 CLASS LABELS
class_names = ['blank', 'fist', 'five', 'ok', 'thumbsdown', 'thumbsup']
# ------------------------------------------------


def display_prediction(prediction):
    """
    Convert raw prediction probabilities into readable labels.
    """
    probs = np.array(prediction)

    # Get best prediction
    best_index = np.argmax(probs)
    best_label = class_names[best_index]
    best_confidence = probs[best_index] * 100

    print("\n✅ PREDICTION RESULT")
    print(f"Predicted Gesture : {best_label}")
    print(f"Confidence        : {best_confidence:.2f}%")

    print("\n📊 All Class Probabilities:")
    for label, prob in zip(class_names, probs):
        print(f"  {label:<12}: {prob*100:.2f}%")


def predict_with_image_file(image_path):
    print(f"\n--- Method 1: File Upload ---")
    print(f"Sending image: {image_path}")
    print(f"API URL: {API_URL}")

    with open(image_path, "rb") as f:
        response = requests.post(
            API_URL,
            files={"image": ("image.jpg", f, "image/jpeg")},
            headers={"X-API-Key": API_KEY},
            timeout=60,
        )

    print(f"Status: {response.status_code}")
    result = response.json()

    if "prediction" in result:
        display_prediction(result["prediction"][0])
    else:
        print("❌ Prediction not found in response")
        print(result)


def predict_with_base64(image_path):
    print(f"\n--- Method 2: Base64 JSON ---")
    print(f"Encoding image: {image_path}")

    with open(image_path, "rb") as f:
        image_base64 = base64.b64encode(f.read()).decode("utf-8")

    response = requests.post(
        API_URL,
        json={"image_base64": image_base64},
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json",
        },
        timeout=60,
    )

    print(f"Status: {response.status_code}")
    result = response.json()

    if "prediction" in result:
        display_prediction(result["prediction"][0])
    else:
        print("❌ Prediction not found in response")
        print(result)


# ---------------- MAIN ----------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_predict_handgesture_with_labels.py <path_to_image>")
        sys.exit(1)

    image_path = " ".join(sys.argv[1:])

    predict_with_image_file(image_path)
    predict_with_base64(image_path)
