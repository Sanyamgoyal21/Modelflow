import { Link } from "react-router-dom";
import { FiBox, FiBarChart2 } from "react-icons/fi";

const TYPE_BADGES = {
  image: "bg-blue-50 text-blue-700",
  text: "bg-purple-50 text-purple-700",
  multi_text: "bg-purple-50 text-purple-700",
  csv: "bg-orange-50 text-orange-700",
  numeric: "bg-green-50 text-green-700",
  json: "bg-teal-50 text-teal-700",
  classification: "bg-emerald-50 text-emerald-700",
  regression: "bg-amber-50 text-amber-700",
};

export default function ModelCard({ model }) {
  const inputType = model.inputType || "numeric";
  const outputType = model.outputType || "classification";

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

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGES[inputType] || TYPE_BADGES.numeric}`}>
          {inputType}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGES[outputType] || TYPE_BADGES.classification}`}>
          {outputType}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <FiBarChart2 /> {model.usageCount || 0} predictions
        </span>
      </div>
    </Link>
  );
}
