/* Dashboard.jsx */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ModelCard from "../components/ModelCard";
import { useAuth } from "../context/AuthContext";
import { FiPlus, FiTrash2, FiLayers, FiGlobe } from "react-icons/fi";

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("mine");
  const [myModels, setMyModels] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const [mine, all] = await Promise.all([
        axios.get("/api/models/mine", { withCredentials: true }),
        axios.get("/api/models"),
      ]);
      setMyModels(mine.data);
      setAllModels(all.data);
    } catch (err) {
      toast.error("Failed to load models");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm("Are you sure you want to delete this model?")) return;
    try {
      await axios.delete(`/api/models/${slug}`, { withCredentials: true });
      toast.success("Model deleted");
      loadModels();
    } catch {
      toast.error("Failed to delete model");
    }
  };

  const models = tab === "mine" ? myModels : allModels;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back, <span className="text-purple-400">{user.name}</span></p>
        </div>
        <Link
          to="/upload"
          className="btn-primary flex items-center justify-center gap-2"
        >
          <FiPlus /> Upload Model
        </Link>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-white/5 p-1 rounded-xl border border-white/10 mb-8">
        <button
          onClick={() => setTab("mine")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "mine"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <FiLayers /> My Models ({myModels.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "all"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <FiGlobe /> All Models ({allModels.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent"></div>
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-gray-400 mb-6 text-lg">
            {tab === "mine"
              ? "You haven't uploaded any models yet."
              : "No models available."}
          </p>
          {tab === "mine" && (
            <Link
              to="/upload"
              className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-4"
            >
              Upload your first model
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <div key={model._id} className="relative group">
              <ModelCard model={model} />
              {tab === "mine" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(model.slug);
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/40 text-gray-400 hover:text-red-400 hover:bg-black/60 rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/5"
                  title="Delete model"
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}