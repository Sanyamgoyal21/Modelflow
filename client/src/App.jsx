import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import ModelDetail from "./pages/ModelDetail";
import Background3D from "./components/Background3D";

export default function App() {
  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-purple-500/30 text-white">
      
      {/* 1. 3D Model Layer */}
      <Background3D />
      
      {/* 2. Background Revert: Deep Dark Theme with subtle transparency 
          - bg-[#0b0b11]/80 ensures the background is dark enough for text 
          - but transparent enough to see the white 3D model behind it.
      */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0b0b11]/80" />
      
      {/* Optional: Vignette to focus center */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#0b0b11_100%)]" />

      {/* 3. Main Content */}
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route path="/model/:slug" element={<ModelDetail />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}