import { useState, useEffect } from "react";
import axios from "axios";
import ModelCard from "../components/ModelCard";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const { login, user } = useAuth();

  useEffect(() => {
    axios
      .get("/api/models")
      .then((res) => setModels(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Host & Share ML Models
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-8">
            Upload your Keras .h5 models, get an instant API link, and let
            anyone run predictions with a single HTTP request.
          </p>
          {!user && (
            <button
              onClick={login}
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
            >
              Get Started - Sign in with Google
            </button>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">1</span>
            </div>
            <h3 className="font-semibold mb-2">Upload Your Model</h3>
            <p className="text-gray-600 text-sm">
              Upload your .h5 model file along with a README describing the
              inputs your model expects.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">2</span>
            </div>
            <h3 className="font-semibold mb-2">Get Your API Link</h3>
            <p className="text-gray-600 text-sm">
              We generate a unique API endpoint and key for your model. Share
              it with anyone who needs predictions.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600">3</span>
            </div>
            <h3 className="font-semibold mb-2">Run Predictions</h3>
            <p className="text-gray-600 text-sm">
              Others use the API link in their code, send inputs via POST
              request, and get predictions back instantly.
            </p>
          </div>
        </div>
      </section>

      {/* All Models */}
      <section className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6">Explore Models</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : models.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No models uploaded yet. Be the first to share one!
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <ModelCard key={model._id} model={model} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
