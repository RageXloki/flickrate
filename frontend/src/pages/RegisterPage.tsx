import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(username, email, password, password2);
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      const data = err?.response?.data;
      const firstError = data ? (Object.values(data)[0] as string[] | undefined)?.[0] : null;
      setError(firstError || "Unable to create your account. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-extrabold text-white">
            <Film className="h-7 w-7 text-marquee" /> FLICK<span className="text-marquee">RATE</span>
          </Link>
          <p className="text-sm text-mist">Discover. Rate. Watch.</p>
        </div>

        <form onSubmit={submit} className="card-surface space-y-4 p-6">
          <h1 className="font-display text-xl font-bold text-white">Create Account</h1>
          <div>
            <label className="mb-1 block text-xs font-medium text-mist">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-mist">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-mist">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-mist">Confirm Password</label>
            <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required className="input-field" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60">
            {submitting ? "Creating account..." : "Register"}
          </button>
          <p className="text-center text-sm text-mist">
            Already have an account? <Link to="/login" className="text-marquee hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
