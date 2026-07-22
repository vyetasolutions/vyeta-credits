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
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-ink-500 hover:text-ink-300 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.274 4.057 5.065 7 9.964 7 4.899 0 8.69-2.943 9.964-7-1.274-4.057-5.065-7-9.964-7-4.899 0-8.69 2.943-9.964 7z" />
                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
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
