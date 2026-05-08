"use client";
import { useState } from "react";
import { signIn }   from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./LoginForm.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [form,    setForm]    = useState({ username: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      username: form.username,
      password: form.password,
    });
    setLoading(false);
    if (res?.ok) router.push("/admin/dashboard");
    else setError("Invalid username or password");
  }

  return (
    <div className={styles.card}>
      <div className={styles.logo}>
        <span className={styles.logoDay}>Day</span>
        <span className={styles.logoDot} />
        <span className={styles.logoDeck}>Deck</span>
      </div>
      <p className={styles.sub}>Admin Panel</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Username</label>
          <input
            className={styles.input}
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
