import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Send from "./pages/Send.jsx";
import History from "./pages/History.jsx";
import Contacts from "./pages/Contacts.jsx";
import Analytics from "./pages/Analytics.jsx";
import Services from "./pages/Services.jsx";
import Admin from "./pages/Admin.jsx";
import AdminServices from "./pages/AdminServices.jsx";
import AdminPayments from "./pages/AdminPayments.jsx";
import Shell from "./components/Shell.jsx";
function Loader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-base-950">
      <div className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );
}
function Protected({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <Loader />;
  if (!session) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}
function AdminOnly({ children }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <Loader />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role !== "admin") return <Navigate to="/" replace />;
  return <Shell>{children}</Shell>;
}
function AuthGate({ children }) {
  const { session, loading, recoveryMode } = useAuth();
  if (loading) return <Loader />;
  if (recoveryMode) return children;
  if (session) return <Navigate to="/" replace />;
  return children;
}
export default function App() {
  const { recoveryMode } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<AuthGate><Login /></AuthGate>} />
      <Route path="/signup" element={<AuthGate><Signup /></AuthGate>} />
      <Route path="/forgot-password" element={<AuthGate><ForgotPassword /></AuthGate>} />
      <Route path="/reset-password" element={
        recoveryMode ? <ResetPassword /> : <Navigate to="/login" replace />
      } />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/send" element={<Protected><Send /></Protected>} />
      <Route path="/history" element={<Protected><History /></Protected>} />
      <Route path="/contacts" element={<Protected><Contacts /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="/services" element={<Protected><Services /></Protected>} />
      <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
      <Route path="/admin/services" element={<AdminOnly><AdminServices /></AdminOnly>} />
      <Route path="/admin/payments" element={<AdminOnly><AdminPayments /></AdminOnly>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

