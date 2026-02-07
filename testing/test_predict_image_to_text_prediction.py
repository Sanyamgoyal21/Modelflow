"""
Test script - simulates User B calling the prediction API with an image.

Usage:
    python test_predict.py <path_to_image>

Example:
    python test_predict.py hand_gesture.jpg
"""

import sys
import base64
import requests

# ---- CONFIGURATION ----
# Change BASE_URL to the ngrok URL or server IP when running from another machine
# Local:   http://localhost:5000
# Network: http://10.3.0.132:5000
# Ngrok:   https://xxxx-xxxx.ngrok-free.app
BASE_URL = "https://7c05-59-89-50-211.ngrok-free.app"

MODEL_SLUG = "hand-gesture-predictor-a8b9421b"
API_KEY = "mlh_61bbd50c66b089f27e4623960209a39e13cd9ed8b48fc9ed"
API_URL = f"{BASE_URL}/api/predict/{MODEL_SLUG}"
# -------------------------------------------------------

def predict_with_image_file(image_path):
    """Method 1: Send image as multipart file upload"""
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
    print(f"Response: {response.json()}")
    return response.json()


def predict_with_base64(image_path):
    """Method 2: Send image as base64 in JSON body"""
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
    print(f"Response: {response.json()}")
    return response.json()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_predict.py <path_to_image>")
        print("Example: python test_predict.py hand_gesture.jpg")
        sys.exit(1)

    # Join all args in case path has spaces and wasn't quoted
    image_path = " ".join(sys.argv[1:])

    # Test both methods
    predict_with_image_file(image_path)
    predict_with_base64(image_path)