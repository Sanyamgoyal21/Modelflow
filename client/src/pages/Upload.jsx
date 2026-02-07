/* Upload.jsx */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiUploadCloud, FiCheck, FiInfo } from "react-icons/fi";

const INPUT_TYPES = [
  { value: "image", label: "Image", desc: "CNN, Image Classification" },
  { value: "numeric", label: "Numeric Array", desc: "Tabular features list" },
  { value: "text", label: "Single Text", desc: "NLP, Sentiment Analysis" },
  { value: "multi_text", label: "Multi Text", desc: "Multiple text fields" },
  { value: "csv", label: "CSV / Tabular", desc: "Raw CSV data upload" },
  { value: "json", label: "JSON Data", desc: "Arbitrary structure" },
];

const OUTPUT_TYPES = [
  { value: "classification", label: "Classification", desc: "Label + Confidence" },
  { value: "regression", label: "Regression", desc: "Numeric value(s)" },
  { value: "text", label: "Text Output", desc: "Generated string" },
  { value: "image", label: "Image Output", desc: "Processed image" },
  { value: "json", label: "Raw JSON", desc: "Any structure" },
];

function getUsageExample(baseUrl, apiUrl, apiKey, inputType) {
  // Keeping exact logic from original
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

print(response.json())`;
    case "json":
      return `import requests

response = requests.post(
    "${baseUrl}${apiUrl}",
    json={"data": [[1.0, 2.0], [3.0, 4.0]]},
    headers={"X-API-Key": "${apiKey}"}
)

print(response.json())`;
    default:
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
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="glass p-8 border-green-500/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <FiCheck className="text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Model Uploaded Successfully
            </h1>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                 <label className="text-xs text-gray-500 uppercase tracking-wider">Model Name</label>
                 <p className="text-lg font-semibold text-white mt-1">{result.name}</p>
               </div>
               <div className="bg-white/5 p-4 rounded-lgHz border border-white/10 flex items-center justify-between">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Config</label>
                    <div className="flex gap-2 mt-2">
                       <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">{result.inputType}</span>
                       <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30">{result.outputType}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div>
              <label className="label-dark">API Endpoint</label>
              <div className="bg-black/40 text-green-400 p-4 rounded-lg text-sm font-mono border border-white/5">
                POST {baseUrl}{result.apiUrl}
              </div>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-lg">
              <label className="label-dark text-yellow-200/80">API Key (Save this now!)</label>
              <div className="bg-black/40 text-yellow-400 p-4 rounded-lg text-sm font-mono mt-1 break-all border border-white/5">
                {result.apiKey}
              </div>
            </div>

            <div>
              <label className="label-dark">Usage Example (Python)</label>
              <pre className="bg-black/40 text-gray-300 p-4 rounded-lg text-sm overflow-x-auto border border-white/5 font-mono leading-relaxed">
                {example}
              </pre>
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(`/model/${result.slug}`)}
              className="btn-secondary"
            >
              View Model Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upload a Model</h1>
        <p className="text-gray-400">
          Upload your Keras .h5 model, configure your inputs, and get an instant API.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="glass p-8">
          <div className="space-y-6">
            <div>
              <label className="label-dark">Model Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Cat vs Dog Classifier"
                className="input-dark"
              />
            </div>

            <div>
              <label className="label-dark">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe what your model does..."
                rows={3}
                className="input-dark"
              />
            </div>
          </div>
        </div>

        {/* Input/Output Config */}
        <div className="glass p-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <FiInfo className="text-purple-400"/> Configuration
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Type */}
            <div>
              <label className="label-dark mb-3">Input Type *</label>
              <div className="space-y-2">
                {INPUT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, inputType: t.value })}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      form.inputType === t.value
                        ? "border-purple-500 bg-purple-500/10 text-white"
                        : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
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
              <label className="label-dark mb-3">Output Type *</label>
              <div className="space-y-2">
                {OUTPUT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, outputType: t.value })}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      form.outputType === t.value
                        ? "border-green-500 bg-green-500/10 text-white"
                        : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <div className="font-medium text-sm">{t.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Files */}
        <div className="glass p-8">
          <div className="space-y-6">
            <div>
              <label className="label-dark">Model File (.h5, .keras, .pt, .onnx) *</label>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                modelFile ? "border-green-500/50 bg-green-500/5" : "border-white/10 hover:border-purple-500/50 hover:bg-white/5"
              }`}>
                <FiUploadCloud className={`mx-auto text-4xl mb-3 ${modelFile ? "text-green-400" : "text-gray-500"}`} />
                <input
                  type="file"
                  id="model-upload"
                  accept=".h5,.pt,.pth,.keras,.onnx"
                  onChange={(e) => setModelFile(e.target.files[0])}
                  className="hidden"
                />
                <label htmlFor="model-upload" className="cursor-pointer">
                    {modelFile ? (
                        <div>
                            <p className="text-green-400 font-medium">{modelFile.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{(modelFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p className="text-xs text-purple-400 mt-2 hover:underline">Click to change</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-300 font-medium mb-1">Click to upload model file</p>
                            <p className="text-xs text-gray-500">Supported: .h5, .pt, .keras, .onnx</p>
                        </div>
                    )}
                </label>
              </div>
            </div>

            <div>
              <label className="label-dark">README (Optional)</label>
              <input
                type="file"
                accept=".md,.txt"
                onChange={(e) => setReadmeFile(e.target.files[0])}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-purple-600 file:transition-colors cursor-pointer"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            uploading 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20"
          }`}
        >
          {uploading ? (
             <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"/>
                Uploading & Deploying...
             </>
          ) : (
             <>
                <FiUploadCloud className="text-xl"/> Upload Model
             </>
          )}
        </button>
      </form>
    </div>
  );
}