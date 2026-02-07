import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiCopy,
  FiArrowLeft,
  FiCpu,
  FiBarChart2,
  FiUser,
  FiImage,
  FiType,
  FiGrid,
  FiHash,
} from "react-icons/fi";
import toast from "react-hot-toast";

const INPUT_LABELS = {
  image: { label: "Image", icon: FiImage, color: "blue" },
  text: { label: "Text", icon: FiType, color: "purple" },
  multi_text: { label: "Multi-Text", icon: FiType, color: "purple" },
  csv: { label: "CSV/Tabular", icon: FiGrid, color: "orange" },
  numeric: { label: "Numeric", icon: FiHash, color: "green" },
  json: { label: "JSON", icon: FiGrid, color: "teal" },
};

const OUTPUT_LABELS = {
  classification: "Classification",
  regression: "Regression",
  text: "Text",
  image: "Image",
  json: "JSON",
};

function getExamples(apiUrl, inputType) {
  const examples = [];

  switch (inputType) {
    case "image":
      examples.push({
        title: "Python (Image File)",
        code: `import requests

with open("your_image.png", "rb") as f:
    response = requests.post(
        "${apiUrl}",
        files={"image": ("image.png", f, "image/png")},
        headers={"X-API-Key": "YOUR_API_KEY"},
    )

result = response.json()
print(result)`,
      });
      examples.push({
        title: "Python (Base64)",
        code: `import requests, base64

with open("your_image.png", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode()

response = requests.post(
    "${apiUrl}",
    json={"image_base64": img_b64},
    headers={"X-API-Key": "YOUR_API_KEY"}
)
print(response.json())`,
      });
      examples.push({
        title: "Python (OpenCV Webcam - Realtime)",
        code: `import cv2, requests, base64, numpy as np

cap = cv2.VideoCapture(0)
API_URL = "${apiUrl}"
API_KEY = "YOUR_API_KEY"

while True:
    ret, frame = cap.read()
    if not ret:
        break

    cv2.imshow("Webcam", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord("p"):  # Press 'p' to predict
        _, buffer = cv2.imencode(".jpg", frame)
        img_b64 = base64.b64encode(buffer).decode()

        response = requests.post(
            API_URL,
            json={"image_base64": img_b64},
            headers={"X-API-Key": API_KEY}
        )
        result = response.json()
        print(f"Prediction: {result}")

    elif key == ord("q"):  # Press 'q' to quit
        break

cap.release()
cv2.destroyAllWindows()`,
      });
      examples.push({
        title: "cURL",
        code: `curl -X POST ${apiUrl} \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "image=@your_image.png"`,
      });
      examples.push({
        title: "JavaScript (Browser)",
        code: `const formData = new FormData();
formData.append("image", fileInput.files[0]);

const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: { "X-API-Key": "YOUR_API_KEY" },
  body: formData,
});

const data = await response.json();
console.log(data);`,
      });
      break;

    case "text":
      examples.push({
        title: "Python",
        code: `import requests

response = requests.post(
    "${apiUrl}",
    json={"text": "Your input text here"},
    headers={"X-API-Key": "YOUR_API_KEY"}
)
print(response.json())`,
      });
      examples.push({
        title: "cURL",
        code: `curl -X POST ${apiUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"text": "Your input text here"}'`,
      });
      examples.push({
        title: "JavaScript",
        code: `const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY",
  },
  body: JSON.stringify({ text: "Your input text here" }),
});
const data = await response.json();
console.log(data);`,
      });
      break;

    case "multi_text":
      examples.push({
        title: "Python",
        code: `import requests

response = requests.post(
    "${apiUrl}",
    json={"texts": ["first text input", "second text input"]},
    headers={"X-API-Key": "YOUR_API_KEY"}
)
print(response.json())`,
      });
      break;

    case "csv":
      examples.push({
        title: "Python (CSV File)",
        code: `import requests

with open("data.csv", "rb") as f:
    response = requests.post(
        "${apiUrl}",
        files={"csv": ("data.csv", f, "text/csv")},
        headers={"X-API-Key": "YOUR_API_KEY"},
    )
print(response.json())`,
      });
      examples.push({
        title: "Python (CSV String)",
        code: `import requests

csv_data = """feature1,feature2,feature3
1.0,2.0,3.0
4.0,5.0,6.0"""

response = requests.post(
    "${apiUrl}",
    json={"csv_data": csv_data},
    headers={"X-API-Key": "YOUR_API_KEY"}
)
print(response.json())`,
      });
      examples.push({
        title: "Python (Pandas DataFrame)",
        code: `import requests
import pandas as pd

df = pd.read_csv("data.csv")

response = requests.post(
    "${apiUrl}",
    json={"csv_data": df.to_csv(index=False)},
    headers={"X-API-Key": "YOUR_API_KEY"}
)
print(response.json())`,
      });
      break;

    case "json":
      examples.push({
        title: "Python",
        code: `import requests

response = requests.post(
    "${apiUrl}",
    json={"data": [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]},
    headers={"X-API-Key": "YOUR_API_KEY"}
)
print(response.json())`,
      });
      break;

    default: // numeric
      examples.push({
        title: "Python",
        code: `import requests

response = requests.post(
    "${apiUrl}",
    json={"inputs": [1.0, 2.0, 3.0]},
    headers={"X-API-Key": "YOUR_API_KEY"}
)
print(response.json())`,
      });
      examples.push({
        title: "cURL",
        code: `curl -X POST ${apiUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"inputs": [1.0, 2.0, 3.0]}'`,
      });
      examples.push({
        title: "JavaScript",
        code: `const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY",
  },
  body: JSON.stringify({ inputs: [1.0, 2.0, 3.0] }),
});
const data = await response.json();
console.log(data);`,
      });
      break;
  }

  return examples;
}

export default function ModelDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/models/${slug}`, { withCredentials: true })
      .then((res) => setModel(res.data))
      .catch(() => toast.error("Model not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Model not found.</p>
      </div>
    );
  }

  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/predict/${model.slug}`;
  const inputType = model.inputType || "numeric";
  const outputType = model.outputType || "classification";
  const inputInfo = INPUT_LABELS[inputType] || INPUT_LABELS.numeric;
  const examples = getExamples(apiUrl, inputType);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 text-sm"
      >
        <FiArrowLeft /> Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">{model.name}</h1>
        {model.description && (
          <p className="text-gray-600 mb-4">{model.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          {model.userId && (
            <span className="flex items-center gap-1 text-gray-500">
              <FiUser /> {model.userId.name}
            </span>
          )}
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            Input: {inputInfo.label}
          </span>
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full">
            Output: {OUTPUT_LABELS[outputType]}
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <FiBarChart2 /> {model.usageCount || 0} predictions
          </span>
        </div>
      </div>

      {/* API Endpoint */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Endpoint</h2>

        <div className="flex items-center gap-2 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <span className="flex-1">POST {apiUrl}</span>
          <button
            onClick={() => copyToClipboard(apiUrl)}
            className="text-gray-400 hover:text-white"
          >
            <FiCopy />
          </button>
        </div>

        {model.apiKey && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">
              Your API Key
            </label>
            <div className="flex items-center gap-2 bg-gray-900 text-yellow-400 p-4 rounded-lg font-mono text-sm mt-1">
              <span className="flex-1 break-all">{model.apiKey}</span>
              <button
                onClick={() => copyToClipboard(model.apiKey)}
                className="text-gray-400 hover:text-white"
              >
                <FiCopy />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Schema */}
      {model.inputSchema && model.inputSchema.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
          <h2 className="text-xl font-semibold mb-4">Input Schema</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-gray-500">#</th>
                <th className="text-left py-2 text-gray-500">Name</th>
                <th className="text-left py-2 text-gray-500">Type</th>
                <th className="text-left py-2 text-gray-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {model.inputSchema.map((field, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 font-mono text-indigo-600">{field.name}</td>
                  <td className="py-2 text-gray-600">{field.type}</td>
                  <td className="py-2 text-gray-600">{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Code Examples */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>

        <div className="space-y-6">
          {examples.map((ex, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">{ex.title}</h3>
                <button
                  onClick={() => copyToClipboard(ex.code)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <FiCopy /> Copy
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {ex.code}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
