import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const { user, login } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg border max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome to ML Model Hub</h1>
        <p className="text-gray-600 mb-8">
          Sign in to upload and manage your machine learning models.
        </p>

        <button
          onClick={login}
          className="flex items-center justify-center gap-3 w-full border-2 border-gray-200 rounded-lg px-6 py-3 font-medium hover:bg-gray-50 transition"
        >
          <FcGoogle className="text-xl" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
