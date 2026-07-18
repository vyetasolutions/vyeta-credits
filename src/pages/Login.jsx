import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Button, Input, Card } from "../components/ui.jsx";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Login() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn({ email, password });
    setLoading(false);
    if (error) toast(error.message, "error");
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Vyeta Credits wallet">
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
          <div>
            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <div className="text-right mt-1.5">
              <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300">
                Forgot password?
              </Link>
            </div>
          </div>
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-ink-500 mt-5">
        New here?{" "}
        <Link to="/signup" className="text-mint-400 font-medium hover:text-mint-300">
          Create an account
        </Link>
      </p>
      <p className="text-center text-xs text-ink-700 mt-3">
        <Link to="/terms" className="hover:text-ink-500">Terms of Service</Link>
        {" · "}
        <Link to="/privacy" className="hover:text-ink-500">Privacy Policy</Link>
      </p>
    </AuthLayout>
  );
}
