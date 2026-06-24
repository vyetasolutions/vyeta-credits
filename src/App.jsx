import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Send from "./pages/Send.jsx";
import History from "./pages/History.jsx";
import Contacts from "./pages/Contacts.jsx";
import Analytics from "./pages/Analytics.jsx";
import Admin from "./pages/Admin.jsx";
import Shell from "./components/Shell.jsx";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role !== "admin") return <Navigate to="/" replace />;
  return <Shell>{children}</Shell>;
}

export function FullScreenLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-base-950">
      <div className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={loading ? <FullScreenLoader /> : session ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={loading ? <FullScreenLoader /> : session ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/send" element={<ProtectedRoute><Send /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
