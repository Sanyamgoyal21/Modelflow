import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ModelCard from "../components/ModelCard";
import { useAuth } from "../context/AuthContext";
import { FiPlus, FiTrash2 } from "react-icons/fi";

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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user.name}</p>
        </div>
        <Link
          to="/upload"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
        >
          <FiPlus /> Upload Model
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-8">
        <button
          onClick={() => setTab("mine")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === "mine"
              ? "bg-white shadow text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          My Models ({myModels.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            tab === "all"
              ? "bg-white shadow text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All Models ({allModels.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">
            {tab === "mine"
              ? "You haven't uploaded any models yet."
              : "No models available."}
          </p>
          {tab === "mine" && (
            <Link
              to="/upload"
              className="text-indigo-600 font-medium hover:underline"
            >
              Upload your first model
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <div key={model._id} className="relative">
              <ModelCard model={model} />
              {tab === "mine" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(model.slug);
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition"
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
