import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err) {
      console.error("Register error:", err);
      const msg =
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        "Registration failed. Please check inputs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#131B2E] border border-[#1F293D] rounded-2xl shadow-2xl text-slate-100 font-sans">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
          <Cpu size={26} />
        </div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight font-mono">Create Account</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Join DocIQ workspace for technical document intelligence
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Username
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-[#0F172A] border border-[#1F293D] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 transition-colors font-mono"
            placeholder="Choose username"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Email (Optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#0F172A] border border-[#1F293D] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 transition-colors font-mono"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#0F172A] border border-[#1F293D] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 transition-colors font-mono"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
        >
          <UserPlus size={18} />
          {loading ? "Registering..." : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400 font-mono">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-cyan-400 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};
