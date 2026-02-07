import { useState, useEffect } from "react";
import axios from "axios";
import ModelCard from "../components/ModelCard";
import { useAuth } from "../context/AuthContext";
import { Link, useSearchParams } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";

export default function Home() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const { login, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    axios
      .get("/api/models")
      .then((res) => setModels(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter models based on search query
  const filteredModels = models.filter((model) => {
    const term = searchQuery.toLowerCase();
    return (
      model.name.toLowerCase().includes(term) ||
      (model.description && model.description.toLowerCase().includes(term))
    );
  });

  const clearSearch = () => {
    setSearchParams({});
  };

  return (
    <div>
      {/* Hero Section - Only show if NOT searching */}
      {!searchQuery && (
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Host & Share <br/>
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                ML Models
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your Keras .h5 models, get an instant API link, and let
              anyone run predictions with a single HTTP request.
            </p>
            {!user && (
              <button
                onClick={login}
                className="btn-primary text-lg px-8 py-3"
              >
                Get Started with Google
              </button>
            )}
          </div>
        </section>
      )}

      {/* Search Results Header */}
      {searchQuery && (
        <section className="pt-12 pb-4">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 text-white">
                <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                  <FiSearch className="text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Search Results</h2>
                  <p className="text-gray-400">
                    Found {filteredModels.length} result{filteredModels.length !== 1 && 's'} for "{searchQuery}"
                  </p>
                </div>
                <button 
                  onClick={clearSearch}
                  className="ml-auto flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition"
                >
                  <FiX /> Clear Search
                </button>
              </div>
           </div>
        </section>
      )}

      {/* How it works - Hide when searching to reduce noise */}
      {!searchQuery && (
        <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
             <p className="text-gray-400">Zero devops required.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 text-center relative hover:bg-white/10 transition">
              <div className="w-14 h-14 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-purple-400">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Upload Model</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Upload your .h5 model file along with a README describing the
                inputs your model expects.
              </p>
            </div>

            <div className="glass p-8 text-center relative hover:bg-white/10 transition">
              <div className="w-14 h-14 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-indigo-400">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Get API Link</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We generate a unique API endpoint and key for your model. Share
                it with anyone who needs predictions.
              </p>
            </div>

            <div className="glass p-8 text-center relative hover:bg-white/10 transition">
              <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-blue-400">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Run Predictions</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Others use the API link in their code, send inputs via POST
                request, and get predictions back instantly.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Models Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-24 sm:px-6 lg:px-8">
        {!searchQuery && (
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Explore Models</h2>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent"></div>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-16 glass">
            <p className="text-gray-400 mb-6">
              {searchQuery ? "No matching models found." : "No models uploaded yet. Be the first to share one!"}
            </p>
            {user && !searchQuery && (
              <Link to="/upload" className="btn-primary">Upload Model</Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <ModelCard key={model._id} model={model} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}