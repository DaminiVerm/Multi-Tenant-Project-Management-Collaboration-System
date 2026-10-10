
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [role, setRole] = useState("USER");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (isRegister) {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password, role);
      }

      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (user?.role !== role && !isRegister) {
        setError("Your account does not have the selected role.");
        return;
      }

      navigate("/");
    } catch (e) {
      setError(
        e.response?.data?.message || "Could not connect to the server"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand">ProjectHub</div>

        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>

        <p className="muted">
          {isRegister
            ? "Start organizing your team's work."
            : "Sign in to manage your projects."}
        </p>

        {error && <div className="error">{error}</div>}

        {!isRegister && (
          <label>
            Login as
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        )}

        {isRegister && (
          <label>
            Full name
            <input
              name="name"
              value={form.name}
              onChange={change}
              minLength="2"
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={change}
            minLength="8"
            required
          />
        </label>

        <button disabled={busy}>
          {busy
            ? "Please wait..."
            : isRegister
            ? "Create account"
            : "Sign in"}
        </button>

        <p className="switch">
          {isRegister
            ? "Already have an account?"
            : "New to ProjectHub?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Sign in" : "Create account"}
          </Link>
        </p>
      </form>
    </main>
  );
}
