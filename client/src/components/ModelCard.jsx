import { Link } from "react-router-dom";
import { FiBox, FiBarChart2 } from "react-icons/fi";

const TYPE_BADGES = {
  image: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  text: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  multi_text: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  csv: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  numeric: "bg-green-500/10 text-green-400 border-green-500/20",
  json: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  classification: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  regression: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function ModelCard({ model }) {
  const inputType = model.inputType || "numeric";
  const outputType = model.outputType || "classification";

  return (
    <Link
      to={`/model/${model.slug}`}
      className="group relative block glass p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-900/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 p-3 rounded-lg border border-purple-500/20 text-purple-400 group-hover:text-white group-hover:border-purple-400/50 transition-colors">
            <FiBox className="text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-purple-300 transition-colors">
              {model.name}
            </h3>
            {model.userId && (
              <p className="text-sm text-gray-500 mt-0.5">
                by <span className="text-gray-400 group-hover:text-white transition-colors">{model.userId.name || "Unknown"}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {model.description && (
        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-5 h-10">
          {model.description}
        </p>
      )}

      {/* Tags / Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
            TYPE_BADGES[inputType] || TYPE_BADGES.numeric
          }`}
        >
          {inputType}
        </span>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
            TYPE_BADGES[outputType] || TYPE_BADGES.classification
          }`}
        >
          {outputType}
        </span>
      </div>

      {/* Footer / Stats */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
          <FiBarChart2 className="text-sm" />
          <span>{model.usageCount || 0} predictions</span>
        </div>
        
        <span className="text-xs font-medium text-purple-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          View Model →
        </span>
      </div>
    </Link>
  );
}