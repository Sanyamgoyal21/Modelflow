/* Login.jsx */
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const { user, login } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass p-8 md:p-12 max-w-md w-full text-center border-t border-white/10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
            <span className="text-2xl">🔐</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Welcome Back</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Sign in to upload and manage your machine learning models securely.
        </p>

        <button
          onClick={login}
          className="flex items-center justify-center gap-3 w-full bg-white text-gray-900 rounded-lg px-6 py-4 font-semibold hover:bg-gray-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-xl"
        >
          <FcGoogle className="text-2xl" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}