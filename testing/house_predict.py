import requests

API_URL = "https://unsubdivided-yuriko-valval.ngrok-free.dev/api/predict/house-price-prediction-f39356bd"
API_KEY = "mlh_5db6242eb38a403f4df0bcc5b5e6531bd396ee77ce1f8f21"

inputs = [8.32, 41, 6.98, 1.02, 322, 2.55, 37.88, -122.23]

response = requests.post(
    API_URL,
    json={"inputs": inputs},
    headers={"X-API-Key": API_KEY},
    timeout=30,
)

print(f"Status: {response.status_code}")
print(response.json())
