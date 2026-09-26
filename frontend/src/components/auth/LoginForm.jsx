import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-[#131B2E] border border-[#1F293D] rounded-2xl shadow-2xl text-slate-100">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
          <Cpu size={26} />
        </div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight font-mono">DocIQ Workspace</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Authenticate to access document intelligence corpus
        </p>
      </div>

      <div className={`mb-4 min-h-[46px] rounded-xl flex items-center transition-all ${error ? "p-3 bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono gap-2" : ""}`}>
        {error && <><AlertCircle size={16} /> {error}</>}
      </div>

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
            placeholder="Enter username"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-[#0F172A] border border-[#1F293D] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 transition-colors font-mono"
            placeholder="Enter password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
        >
          <LogIn size={18} />
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400 font-mono">
        Need an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-cyan-400 hover:underline"
        >
          Create account
        </Link>
      </div>
    </div>
  );
};
