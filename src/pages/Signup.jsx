import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Input, Card } from "../components/ui.jsx";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signUp({ email, password, fullName });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <Card className="max-w-sm text-center">
          <h2 className="font-display text-lg font-semibold text-ink-100 mb-2">Check your email</h2>
          <p className="text-sm text-ink-500 mb-5">
            We sent a confirmation link to <span className="text-ink-300">{email}</span>. Confirm it,
            then sign in below.
          </p>
          <Button onClick={() => navigate("/login")}>Go to sign in</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-semibold text-ink-100">Create your wallet</h1>
          <p className="text-sm text-ink-500 mt-1.5">Start with 1,000 free credits</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Suwilanji Mwale"
            />
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
            {error && <p className="text-xs text-flame-400">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-ink-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-mint-400 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
