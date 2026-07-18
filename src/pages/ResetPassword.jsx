import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Button, Input, Card } from "../components/ui.jsx";
import AuthLayout from "../components/AuthLayout.jsx";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { toast("Passwords do not match.", "error"); return; }
    if (password.length < 6) { toast("Password must be at least 6 characters.", "error"); return; }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Password updated successfully. Welcome back.", "success");
    navigate("/");
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Make it something you'll remember">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Same as above"
            error={confirm && password !== confirm ? "Passwords don't match" : ""}
          />
          <Button type="submit" disabled={loading || !password || !confirm} size="lg">
            {loading ? "Updating…" : "Set new password"}
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
