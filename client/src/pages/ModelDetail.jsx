import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiCopy, FiArrowLeft, FiCpu, FiBarChart2, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";

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

  // Image-based example
  const pythonImageExample = `import requests

# Send an image file for prediction
with open("your_image.png", "rb") as f:
    response = requests.post(
        "${apiUrl}",
        files={"image": ("image.png", f, "image/png")},
        headers={"X-API-Key": "YOUR_API_KEY"},
    )

result = response.json()
print(f"Predicted class: {result['predicted_class']}")
print(f"Confidence: {result['confidence']}")`;

  // Numeric input example
  const pythonNumericExample = `import requests

response = requests.post(
    "${apiUrl}",
    json={"inputs": [${model.inputSchema?.map(() => "0.0").join(", ") || "1.0, 2.0, 3.0"}]},
    headers={"X-API-Key": "YOUR_API_KEY"}
)

print(response.json())`;

  // Base64 image example
  const pythonBase64Example = `import requests
import base64

with open("your_image.png", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode()

response = requests.post(
    "${apiUrl}",
    json={"image_base64": img_b64},
    headers={"X-API-Key": "YOUR_API_KEY"}
)

print(response.json())`;

  const curlExample = `# With image file:
curl -X POST ${apiUrl} \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "image=@your_image.png"

# With JSON inputs:
curl -X POST ${apiUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"inputs": [${model.inputSchema?.map(() => "0.0").join(", ") || "1.0, 2.0, 3.0"}]}'`;

  const jsExample = `// With image file (browser)
const formData = new FormData();
formData.append("image", fileInput.files[0]);

const response = await fetch("${apiUrl}", {
  method: "POST",
  headers: { "X-API-Key": "YOUR_API_KEY" },
  body: formData,
});

const data = await response.json();
console.log(data.predicted_class, data.confidence);`;

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

        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          {model.userId && (
            <span className="flex items-center gap-1">
              <FiUser /> {model.userId.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FiCpu /> {model.inputCount || 0} inputs
          </span>
          <span className="flex items-center gap-1">
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
                  <td className="py-2 font-mono text-indigo-600">
                    {field.name}
                  </td>
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
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Python (Image Upload)</h3>
              <button
                onClick={() => copyToClipboard(pythonImageExample)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <FiCopy /> Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              {pythonImageExample}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Python (Base64)</h3>
              <button
                onClick={() => copyToClipboard(pythonBase64Example)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <FiCopy /> Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              {pythonBase64Example}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">
                JavaScript
              </h3>
              <button
                onClick={() => copyToClipboard(jsExample)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <FiCopy /> Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              {jsExample}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">cURL</h3>
              <button
                onClick={() => copyToClipboard(curlExample)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <FiCopy /> Copy
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              {curlExample}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
