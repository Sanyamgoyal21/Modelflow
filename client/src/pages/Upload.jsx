import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUploadCloud } from "react-icons/fi";

export default function Upload() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "" });
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
      formData.append("model", modelFile);
      if (readmeFile) formData.append("readme", readmeFile);

      const res = await axios.post("/api/models", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data);
      toast.success("Model uploaded successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (result) {
    const baseUrl = window.location.origin;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            Model Uploaded Successfully!
          </h1>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Model Name
              </label>
              <p className="text-lg font-semibold">{result.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                API Endpoint
              </label>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono mt-1">
                POST {baseUrl}{result.apiUrl}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="bg-gray-900 text-yellow-400 p-4 rounded-lg text-sm font-mono mt-1 break-all">
                {result.apiKey}
              </div>
              <p className="text-xs text-red-500 mt-1">
                Save this key! It won't be shown again.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Usage Example (Python)
              </label>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm mt-1 overflow-x-auto">
{`import requests

response = requests.post(
    "${baseUrl}${result.apiUrl}",
    json={"inputs": [${result.inputSchema?.map(() => "0.0").join(", ") || "1.0, 2.0, 3.0"}]},
    headers={"X-API-Key": "${result.apiKey}"}
)

print(response.json())
# {"model": "${result.name}", "prediction": [[...]]}`}
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
        Upload your Keras .h5 model and an optional README with input
        descriptions.
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
            placeholder="e.g. House Price Predictor"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model File (.h5) *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition">
            <FiUploadCloud className="mx-auto text-3xl text-gray-400 mb-2" />
            <input
              type="file"
              accept=".h5"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            README File (.md / .txt)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Include an "Inputs" section describing each input field your model
            expects. This helps generate API documentation.
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
