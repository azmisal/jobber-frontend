import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function SignupPage() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed");
      navigate("/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during verification.";
      setError(message);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] px-6 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1fr] lg:gap-24">
        <section className="paper-card order-2 p-10 lg:order-1 lg:p-12">
          <div className="mb-10">
            <span className="kicker">Begin</span>
            <h2 className="mt-4 font-serif text-3xl font-medium text-foreground">
              Open an account.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A single profile, refined for every role you pursue.
            </p>
          </div>

          {error && (
            <div className="mb-6 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-7">
            <div>
              <label htmlFor="username" className="kicker mb-3 block">Name</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="How you'd like to be addressed"
                className="field"
              />
            </div>

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
                placeholder="At least eight characters"
                className="field"
              />
            </div>

            <button type="submit" className="btn-ink w-full">
              Create account
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/login" className="text-foreground underline decoration-[var(--color-gold)] underline-offset-4 hover:text-[var(--color-gold)]">
              Sign in
            </Link>
          </p>
        </section>

        <section className="order-1 flex flex-col justify-between lg:order-2">
          <div className="space-y-8">
            <span className="kicker">Volume 01 · Membership</span>
            <h1 className="font-serif text-5xl font-medium leading-[1.05] text-foreground">
              Considered résumés,<br />
              <em className="not-italic text-[var(--color-gold)]">for considered careers.</em>
            </h1>
            <div className="rule max-w-xs" />
            <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Upload your story once. Nexus reads the brief of any role you target and proposes
              line-level revisions — never wholesale rewrites — so the voice that earned your
              experience remains unmistakably yours.
            </p>
          </div>

          <ol className="mt-16 space-y-6 text-sm">
            {[
              { n: "I.", t: "Upload your master résumé." },
              { n: "II.", t: "Paste the role you want." },
              { n: "III.", t: "Approve each suggested revision." },
            ].map((s) => (
              <li key={s.n} className="grid grid-cols-[3rem_1fr] items-baseline gap-4">
                <span className="font-serif text-2xl text-[var(--color-gold)]">{s.n}</span>
                <span className="text-foreground">{s.t}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

export default SignupPage;
