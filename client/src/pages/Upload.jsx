import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUploadCloud } from "react-icons/fi";

const INPUT_TYPES = [
  { value: "image", label: "Image", desc: "Model takes image input (e.g., CNN, image classifier)" },
  { value: "numeric", label: "Numeric Array", desc: "Model takes numeric features (e.g., [1.5, 2.3, 4.1])" },
  { value: "text", label: "Single Text", desc: "Model takes text input (e.g., sentiment analysis)" },
  { value: "multi_text", label: "Multiple Text Fields", desc: "Model takes multiple text inputs" },
  { value: "csv", label: "CSV / Tabular", desc: "Model takes tabular data (rows and columns)" },
  { value: "json", label: "JSON Data", desc: "Model takes arbitrary JSON structured data" },
];

const OUTPUT_TYPES = [
  { value: "classification", label: "Classification", desc: "Returns class label + confidence" },
  { value: "regression", label: "Regression", desc: "Returns numeric value(s)" },
  { value: "text", label: "Text Output", desc: "Returns generated text" },
  { value: "image", label: "Image Output", desc: "Returns generated/processed image" },
  { value: "json", label: "Raw JSON", desc: "Returns raw prediction array" },
];

// Generate usage example based on input/output type
function getUsageExample(baseUrl, apiUrl, apiKey, inputType) {
  switch (inputType) {
    case "image":
      return `import requests

# Send image file
with open("your_image.png", "rb") as f:
    response = requests.post(
        "${baseUrl}${apiUrl}",
        files={"image": ("image.png", f, "image/png")},
        headers={"X-API-Key": "${apiKey}"},
    )

result = response.json()
print(result)`;

    case "text":
      return `import requests

response = requests.post(
    "${baseUrl}${apiUrl}",
    json={"text": "Your input text here"},
    headers={"X-API-Key": "${apiKey}"}
)

print(response.json())`;

    case "multi_text":
      return `import requests

response = requests.post(
    "${baseUrl}${apiUrl}",
    json={"texts": ["first text", "second text"]},
    headers={"X-API-Key": "${apiKey}"}
)

print(response.json())`;

    case "csv":
      return `import requests

# From CSV file
with open("data.csv", "rb") as f:
    response = requests.post(
        "${baseUrl}${apiUrl}",
        files={"csv": ("data.csv", f, "text/csv")},
        headers={"X-API-Key": "${apiKey}"},
    )

# Or from string
response = requests.post(
    "${baseUrl}${apiUrl}",
    json={"csv_data": "col1,col2\\n1.0,2.0\\n3.0,4.0"},
    headers={"X-API-Key": "${apiKey}"}
)

print(response.json())`;

    case "json":
      return `import requests

response = requests.post(
    "${baseUrl}${apiUrl}",
    json={"data": [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]},
    headers={"X-API-Key": "${apiKey}"}
)

print(response.json())`;

    default: // numeric
      return `import requests

response = requests.post(
    "${baseUrl}${apiUrl}",
    json={"inputs": [1.0, 2.0, 3.0]},
    headers={"X-API-Key": "${apiKey}"}
)

print(response.json())`;
  }
}

export default function Upload() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    inputType: "image",
    outputType: "classification",
  });
  const [modelFile, setModelFile] = useState(null);
  const [readmeFile, setReadmeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modelFile) {
      toast.error("Please select a .h5 model file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("inputType", form.inputType);
      formData.append("outputType", form.outputType);
      formData.append("model", modelFile);
      if (readmeFile) formData.append("readme", readmeFile);

      const res = await axios.post("/api/models", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult({ ...res.data, inputType: form.inputType });
      toast.success("Model uploaded successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (result) {
    const baseUrl = window.location.origin;
    const example = getUsageExample(baseUrl, result.apiUrl, result.apiKey, result.inputType);

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            Model Uploaded Successfully!
          </h1>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Model Name</label>
              <p className="text-lg font-semibold">{result.name}</p>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Input Type</label>
                <p className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-block mt-1">
                  {result.inputType}
                </p>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Output Type</label>
                <p className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full inline-block mt-1">
                  {result.outputType}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">API Endpoint</label>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono mt-1">
                POST {baseUrl}{result.apiUrl}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <div className="bg-gray-900 text-yellow-400 p-4 rounded-lg text-sm font-mono mt-1 break-all">
                {result.apiKey}
              </div>
              <p className="text-xs text-red-500 mt-1">
                Save this key! It won't be shown again.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Usage Example (Python)</label>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm mt-1 overflow-x-auto">
                {example}
              </pre>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(`/model/${result.slug}`)}
              className="border border-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              View Model
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Upload a Model</h1>
      <p className="text-gray-500 mb-8">
        Upload your Keras .h5 model. Select what type of input it expects and
        what kind of output it produces.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Hand Gesture Recognizer"
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Briefly describe what your model does..."
            rows={3}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Input Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Input Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {INPUT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, inputType: t.value })}
                className={`text-left p-3 rounded-lg border-2 transition ${
                  form.inputType === t.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Output Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {OUTPUT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, outputType: t.value })}
                className={`text-left p-3 rounded-lg border-2 transition ${
                  form.outputType === t.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Model File */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model File (.h5 / .pt / .pth / .keras / .onnx) *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition">
            <FiUploadCloud className="mx-auto text-3xl text-gray-400 mb-2" />
            <input
              type="file"
              accept=".h5,.pt,.pth,.keras,.onnx"
              onChange={(e) => setModelFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
            />
            {modelFile && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {modelFile.name} (
                {(modelFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        {/* README */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            README File (.md / .txt)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Optional. Include an "Inputs" section describing each input field.
          </p>
          <input
            type="file"
            accept=".md,.txt"
            onChange={(e) => setReadmeFile(e.target.files[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-600 hover:file:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload Model"}
        </button>
      </form>
    </div>
  );
}
