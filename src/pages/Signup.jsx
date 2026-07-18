import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Button, Input, Card } from "../components/ui.jsx";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Signup() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agreed) { toast("Please accept the Terms of Service to continue.", "warning"); return; }
    setLoading(true);
    const { error } = await signUp({ email, password, fullName });
    setLoading(false);
    if (error) { toast(error.message, "error"); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout>
        <Card className="text-center">
          <div className="h-14 w-14 rounded-full bg-mint-500/15 mx-auto flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 stroke-mint-400" strokeWidth="2">
              <path d="M3 8l7.5 5.5L21 6M3 8v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-ink-100">Check your inbox</h2>
          <p className="text-sm text-ink-500 mt-2 mb-5">
            We sent a confirmation link to <span className="text-ink-300 font-medium">{email}</span>. Click it to activate your account, then sign in.
          </p>
          <Button onClick={() => navigate("/login")}>Go to sign in</Button>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your wallet" subtitle="Start with 1,000 free Vyeta Credits">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Suwilanji Mwale"
          />
          <Input
            label="Email address"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-base-600 bg-base-800 text-mint-500 focus:ring-mint-500/50 cursor-pointer"
            />
            <span className="text-xs text-ink-500 leading-relaxed">
              I agree to the{" "}
              <Link to="/terms" target="_blank" className="text-violet-400 hover:text-violet-300 underline">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" target="_blank" className="text-violet-400 hover:text-violet-300 underline">Privacy Policy</Link>.
              I understand that Vyeta Credits are not real money.
            </span>
          </label>

          <Button type="submit" disabled={loading || !agreed} size="lg">
            {loading ? "Creating account…" : "Create account & get 1,000 CR"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-ink-500 mt-5">
        Already have an account?{" "}
        <Link to="/login" className="text-mint-400 font-medium hover:text-mint-300">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
