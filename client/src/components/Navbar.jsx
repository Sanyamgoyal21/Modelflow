import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            ML Model Hub
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Explore
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Upload Model
                </Link>
                <div className="flex items-center gap-2">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={logout}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={login}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
