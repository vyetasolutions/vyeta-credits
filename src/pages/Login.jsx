import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Input, Card } from "../components/ui.jsx";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-mint-500/15 mx-auto mb-4 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-mint-400" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-100">Welcome back</h1>
          <p className="text-sm text-ink-500 mt-1.5">Sign in to your Vyeta Credits wallet</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && <p className="text-xs text-flame-400">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-ink-500 mt-6">
          New here?{" "}
          <Link to="/signup" className="text-mint-400 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
