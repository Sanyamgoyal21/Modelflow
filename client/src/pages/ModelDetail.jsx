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
  image: { label: "Image", icon: FiImage },
  text: { label: "Text", icon: FiType },
  multi_text: { label: "Multi-Text", icon: FiType },
  csv: { label: "CSV/Tabular", icon: FiGrid },
  numeric: { label: "Numeric", icon: FiHash },
  json: { label: "JSON", icon: FiGrid },
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
        title: "Python (requests)",
        code: `import requests\n\nwith open("image.jpg", "rb") as f:\n    response = requests.post(\n        "${apiUrl}",\n        files={"image": ("image.jpg", f, "image/jpeg")},\n        headers={"X-API-Key": "YOUR_API_KEY"}\n    )\n\nprint(response.json())`
      });
      examples.push({
        title: "JavaScript (fetch)",
        code: `const formData = new FormData();\nformData.append("image", fileInput.files[0]);\n\nfetch("${apiUrl}", {\n  method: "POST",\n  headers: { "X-API-Key": "YOUR_API_KEY" },\n  body: formData\n})\n.then(response => response.json())\n.then(data => console.log(data));`
      });
      examples.push({
        title: "cURL",
        code: `curl -X POST "${apiUrl}" \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -F "image=@image.jpg"`
      });
      break;

    case "text":
      examples.push({
        title: "Python (requests)",
        code: `import requests\n\nresponse = requests.post(\n    "${apiUrl}",\n    json={"text": "Your input text"},\n    headers={"X-API-Key": "YOUR_API_KEY"}\n)\n\nprint(response.json())`
      });
      examples.push({
        title: "JavaScript (fetch)",
        code: `fetch("${apiUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "YOUR_API_KEY"\n  },\n  body: JSON.stringify({ text: "Your input text" })\n})\n.then(response => response.json())\n.then(data => console.log(data));`
      });
      break;

    case "multi_text":
      examples.push({
        title: "Python (requests)",
        code: `import requests\n\nresponse = requests.post(\n    "${apiUrl}",\n    json={"texts": ["Text one", "Text two"]},\n    headers={"X-API-Key": "YOUR_API_KEY"}\n)\n\nprint(response.json())`
      });
      examples.push({
        title: "JavaScript (fetch)",
        code: `fetch("${apiUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "YOUR_API_KEY"\n  },\n  body: JSON.stringify({ texts: ["Text one", "Text two"] })\n})\n.then(response => response.json())\n.then(data => console.log(data));`
      });
      break;

    case "csv":
      examples.push({
        title: "Python (requests)",
        code: `import requests\n\nwith open("data.csv", "rb") as f:\n    response = requests.post(\n        "${apiUrl}",\n        files={"csv": ("data.csv", f, "text/csv")},\n        headers={"X-API-Key": "YOUR_API_KEY"}\n    )\n\nprint(response.json())`
      });
      examples.push({
        title: "JavaScript (fetch)",
        code: `const formData = new FormData();\nformData.append("csv", fileInput.files[0]);\n\nfetch("${apiUrl}", {\n  method: "POST",\n  headers: { "X-API-Key": "YOUR_API_KEY" },\n  body: formData\n})\n.then(response => response.json())\n.then(data => console.log(data));`
      });
      break;

    case "json":
      examples.push({
        title: "Python (requests)",
        code: `import requests\n\ndata = {"key": "value", "items": [1, 2, 3]}\n\nresponse = requests.post(\n    "${apiUrl}",\n    json={"data": data},\n    headers={"X-API-Key": "YOUR_API_KEY"}\n)\n\nprint(response.json())`
      });
      examples.push({
        title: "JavaScript (fetch)",
        code: `fetch("${apiUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "YOUR_API_KEY"\n  },\n  body: JSON.stringify({ data: { key: "value", items: [1, 2, 3] } })\n})\n.then(response => response.json())\n.then(data => console.log(data));`
      });
      break;

    default: // Numeric / Classification
      examples.push({
        title: "Python (requests)",
        code: `import requests\n\n# Example inputs: [feature1, feature2, feature3]\ninputs = [0.5, 1.2, -0.3]\n\nresponse = requests.post(\n    "${apiUrl}",\n    json={"inputs": inputs},\n    headers={"X-API-Key": "YOUR_API_KEY"}\n)\n\nprint(response.json())`
      });
      examples.push({
        title: "JavaScript (fetch)",
        code: `// Example inputs: [feature1, feature2, feature3]\nconst inputs = [0.5, 1.2, -0.3];\n\nfetch("${apiUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "X-API-Key": "YOUR_API_KEY"\n  },\n  body: JSON.stringify({ inputs: inputs })\n})\n.then(response => response.json())\n.then(data => console.log(data));`
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
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="text-center py-20 text-gray-500">Model not found.</div>
    );
  }

  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/predict/${model.slug}`;
  const inputType = model.inputType || "numeric";
  const outputType = model.outputType || "classification";
  const inputInfo = INPUT_LABELS[inputType] || INPUT_LABELS.numeric;
  const examples = getExamples(apiUrl, inputType);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <FiArrowLeft /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="glass p-8 mb-8 relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <FiCpu className="text-9xl text-white"/>
        </div>

        <h1 className="text-5xl font-bold text-white mb-6">{model.name}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
          {model.userId && (
            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 text-gray-300">
              <FiUser className="text-purple-400" /> {model.userId.name}
            </span>
          )}
          <span className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20 text-blue-300">
             Input: {inputInfo.label}
          </span>
          <span className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20 text-green-300">
             Output: {OUTPUT_LABELS[outputType]}
          </span>
          <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 text-gray-300">
            <FiBarChart2 className="text-purple-400"/> {model.usageCount || 0} predictions
          </span>
        </div>

        {model.description && (
          <p className="text-gray-400 text-lg max-w-3xl leading-relaxed">{model.description}</p>
        )}
      </div>

      {/* Main Content - Vertical Stack for Full Width Boxes */}
      <div className="flex flex-col gap-8">
        
        {/* 1. API Endpoint Section - Full Width */}
        <div className="glass p-8 bg-white/5 border border-white/10 rounded-2xl w-full">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-purple-500 rounded-full"/> API Endpoint
            </h2>
            
            <div className="bg-black/40 border border-white/10 p-6 rounded-xl font-mono text-sm text-green-400 relative group mb-8">
                {/* break-all ensures long URLs wrap properly */}
                <div className="break-all whitespace-pre-wrap pr-12">
                    POST {apiUrl}
                </div>
                <button
                    onClick={() => copyToClipboard(apiUrl)}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 hover:text-white transition"
                    title="Copy Endpoint"
                >
                    <FiCopy />
                </button>
            </div>

            {model.apiKey && (
            <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Your API Key</h3>
                <div className="bg-black/40 border border-white/10 p-6 rounded-xl font-mono text-sm text-yellow-400/90 relative group">
                    <div className="break-all whitespace-pre-wrap pr-12 blur-[4px] group-hover:blur-none transition-all duration-300">
                        {model.apiKey}
                    </div>
                    <button
                        onClick={() => copyToClipboard(model.apiKey)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 hover:text-white transition"
                        title="Copy Key"
                    >
                        <FiCopy />
                    </button>
                </div>
            </div>
            )}
        </div>

        {/* 2. Integration Code Section - Full Width */}
        <div className="glass p-8 bg-white/5 border border-white/10 rounded-2xl w-full">
            <h2 className="text-xl font-bold text-white mb-6">Integration Code</h2>
            <div className="space-y-8">
                {examples.map((ex, i) => (
                    <div key={i} className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                        <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-300">{ex.title}</span>
                            <button 
                                onClick={() => copyToClipboard(ex.code)}
                                className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1.5 bg-purple-500/10 px-2 py-1 rounded transition-colors"
                            >
                                <FiCopy /> Copy
                            </button>
                        </div>
                        <div className="p-6 bg-black/40">
                            {/* whitespace-pre-wrap ensures code lines wrap if too long */}
                            <pre className="text-sm text-gray-400 font-mono break-all whitespace-pre-wrap leading-relaxed">
                                {ex.code}
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}