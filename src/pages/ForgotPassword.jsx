import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Button, Input, Card } from "../components/ui.jsx";
import AuthLayout from "../components/AuthLayout.jsx";

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await sendPasswordReset(email);
    setLoading(false);
    if (error) { toast(error.message, "error"); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout>
        <Card className="text-center">
          <div className="h-14 w-14 rounded-full bg-violet-500/15 mx-auto flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 stroke-violet-400" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-100">Reset link sent</h2>
          <p className="text-sm text-ink-500 mt-2 mb-5">
            Check <span className="text-ink-300 font-medium">{email}</span> for a password reset link. It expires in 1 hour.
          </p>
          <Link to="/login">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll send a reset link to your email">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </Card>
      <p className="text-center text-sm text-ink-500 mt-5">
        Remember it?{" "}
        <Link to="/login" className="text-mint-400 font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
