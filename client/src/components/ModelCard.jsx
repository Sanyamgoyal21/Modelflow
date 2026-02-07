import { Link } from "react-router-dom";
import { FiBox, FiCpu, FiBarChart2 } from "react-icons/fi";

export default function ModelCard({ model }) {
  return (
    <Link
      to={`/model/${model.slug}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <FiBox className="text-indigo-600 text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{model.name}</h3>
            {model.userId && (
              <p className="text-sm text-gray-500">
                by {model.userId.name || "Unknown"}
              </p>
            )}
          </div>
        </div>
      </div>

      {model.description && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {model.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FiCpu /> {model.inputCount || 0} inputs
        </span>
        <span className="flex items-center gap-1">
          <FiBarChart2 /> {model.usageCount || 0} predictions
        </span>
      </div>
    </Link>
  );
}
