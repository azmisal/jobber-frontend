import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userId", data.user_id);
      navigate({ to: "/" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during login.";
      setError(message);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] px-6 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1fr] lg:gap-24">
        {/* Editorial column */}
        <section className="hidden flex-col justify-between lg:flex">
          <div className="space-y-8">
            <span className="kicker">Volume 01 · Sign in</span>
            <h1 className="font-serif text-5xl font-medium leading-[1.05] text-foreground">
              Return to your<br />
              <em className="not-italic text-[var(--color-gold)]">writing desk.</em>
            </h1>
            <div className="rule max-w-xs" />
            <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Resume tailoring is craft, not template. Step back into your studio and continue
              the work — your master profile, every keyword you've shortlisted, every draft.
            </p>
          </div>
          <figure className="mt-16 border-l-2 border-[var(--color-gold)] pl-6">
            <blockquote className="font-serif text-xl italic leading-relaxed text-foreground">
              "A résumé is the shortest piece of autobiography you'll ever write. Make it count."
            </blockquote>
            <figcaption className="mt-3 kicker">— The Editorial</figcaption>
          </figure>
        </section>

        {/* Form column */}
        <section className="paper-card p-10 lg:p-12">
          <div className="mb-10">
            <span className="kicker">Sign in</span>
            <h2 className="mt-4 font-serif text-3xl font-medium text-foreground">
              Welcome back.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Enter your credentials to continue.
            </p>
          </div>

          {error && (
            <div className="mb-6 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-7">
            <div>
              <label htmlFor="email" className="kicker mb-3 block">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@studio.com"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="password" className="kicker mb-3 block">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="field"
              />
            </div>

            <button type="submit" className="btn-ink w-full">
              Sign in
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            New to the atelier?{" "}
            <Link to="/signup" className="text-foreground underline decoration-[var(--color-gold)] underline-offset-4 hover:text-[var(--color-gold)]">
              Request an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
