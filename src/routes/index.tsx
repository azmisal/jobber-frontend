import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";

export const Route = createFileRoute("/")({
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function DashboardPage() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [jd, setJd] = useState<string>("");
  const [outputFileName, setOutputFileName] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfileStatus = async (): Promise<void> => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.has_profile) {
        setHasProfile(true);
      } else {
        setHasProfile(false);
        navigate({ to: "/profile-setup" });
      }
    } catch (err) {
      console.error(err);
      navigate({ to: "/profile-setup" });
    }
  };

  const handleJDSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!jd.trim()) return;
    setLoading(true);
    try {

      const token = localStorage.getItem("token");
      const model = localStorage.getItem("llmModel") || "groq";

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/optimize/keywords`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_description: jd, model: model }),
      });
      const data = await res.json();
      if (!res.ok && (data?.detail?.toLowerCase().includes("token") || data?.detail?.toLowerCase().includes("free tier"))) {
        alert("The free tier for this model has ended or tokens are exhausted. Please change the model in the navbar to continue.");
        return;
      }
      const extractedKws: string[] = data.keywords || [];
      setKeywords(extractedKws);
      setSelectedKeywords(extractedKws);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyword = (kw: string): void => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== kw));
    } else {
      setSelectedKeywords([...selectedKeywords, kw]);
    }
  };

  const proceedToProposals = async (): Promise<void> => {
    if (!outputFileName.trim()) {
      alert("Please provide an output filename before submitting.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const model = localStorage.getItem("llmModel") || "groq";
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/optimize/proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selected_keywords: selectedKeywords,
          model: model,
        }),
      });
      const data = await res.json();
      if (!res.ok && (data?.detail?.toLowerCase().includes("token") || data?.detail?.toLowerCase().includes("free tier"))) {
        alert("The free tier for this model has ended or tokens are exhausted. Please change the model in the navbar to continue.");
        return;
      }
      // Preserve original behavior: pass proposals + filename to /review.
      sessionStorage.setItem(
        "nexus:review",
        JSON.stringify({ proposals: data.proposals, outputFileName }),
      );
      navigate({ to: "/review" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (hasProfile === null) {
    return (
      <div className="mt-32 text-center kicker justify-center">
        Loading your profile…
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] px-6 py-16 lg:py-20">
      <div className="mx-auto max-w-5xl space-y-20">
        {/* Header */}
        <header>
          <span className="kicker">The Atelier · Issue {String(keywords.length || 1).padStart(3, "0")}</span>
          <h1 className="mt-5 font-serif text-4xl font-medium leading-[1.1] text-foreground lg:text-6xl">
            Read the brief.<br />
            <em className="not-italic text-[var(--color-gold)]">Shape the reply.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Paste a job description below. Nexus will surface the language the hiring team
            cares about — you decide which threads to weave into your résumé.
          </p>

          <dl className="mt-12 grid max-w-md grid-cols-2 gap-10">
            <div>
              <dt className="kicker">Keywords surfaced</dt>
              <dd className="mt-3 font-serif text-3xl text-foreground">{keywords.length}</dd>
            </div>
            <div>
              <dt className="kicker">Master profile</dt>
              <dd className="mt-3 font-serif text-3xl text-foreground">Active</dd>
            </div>
          </dl>
        </header>

        <div className="rule" />

        {/* JD Analyzer */}
        <section className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
          <div>
            <span className="kicker">§ I · The brief</span>
            <h2 className="mt-4 font-serif text-2xl font-medium text-foreground">
              Job description
            </h2>
            <form onSubmit={handleJDSubmit} className="mt-6 space-y-6">
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description here, including responsibilities and qualifications…"
                rows={10}
                className="field"
                required
              />
              <button type="submit" disabled={loading} className="btn-ink">
                {loading ? "Reading the brief…" : "Extract keywords"}
              </button>
            </form>
          </div>

          <aside className="border-l border-border pl-8">
            <span className="kicker">House notes</span>
            <h3 className="mt-4 font-serif text-xl text-foreground">How this works</h3>
            <ol className="mt-6 space-y-5 text-sm">
              {[
                "Paste the role's full description.",
                "Curate the keywords that fit your story.",
                "Approve line-level revisions before export.",
              ].map((t, i) => (
                <li key={i} className="grid grid-cols-[2rem_1fr] items-baseline gap-3">
                  <span className="font-serif text-lg text-[var(--color-gold)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-relaxed text-muted-foreground">{t}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        {keywords.length > 0 && (
          <>
            <div className="rule" />
            <section>
              <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="kicker">§ II · The shortlist</span>
                  <h2 className="mt-4 font-serif text-2xl font-medium text-foreground">
                    Extracted keywords
                  </h2>
                  <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                    Tap to include or exclude. Only selected terms inform the proposed revisions.
                  </p>
                </div>
                <div className="w-full md:max-w-xs">
                  <label className="kicker mb-3 block">Export filename</label>
                  <input
                    type="text"
                    placeholder="e.g. Software_Engineer_Acme"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    className="field"
                  />
                </div>
              </div>

              <div className="mb-12 flex flex-wrap gap-2.5">
                {keywords.map((kw) => {
                  const active = selectedKeywords.includes(kw);
                  return (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => toggleKeyword(kw)}
                      className={`chip ${active ? "chip-active" : ""}`}
                    >
                      {kw}
                    </button>
                  );
                })}
              </div>

              <button onClick={proceedToProposals} disabled={loading} className="btn-ink w-full md:w-auto">
                {loading ? "Composing revisions…" : "Draft optimized résumé →"}
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
