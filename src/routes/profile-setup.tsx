import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import type { ResumeData } from "@/types";

export const Route = createFileRoute("/profile-setup")({
  component: () => (
    <RequireAuth>
      <ProfileSetupPage />
    </RequireAuth>
  ),
});

function ProfileSetupPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ResumeData | null>(null);
  const navigate = useNavigate();

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setParsedData(data.profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVerifiedProfile = async (): Promise<void> => {
    if (!parsedData) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/rectify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsedData),
      });
      if (res.ok) {
        navigate({ to: "/" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] px-6 py-16 lg:py-20">
      <div className="mx-auto max-w-4xl">
        <header className="mb-14">
          <span className="kicker">Chapter I · Master profile</span>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-foreground lg:text-5xl">
            Establish the canonical you.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Upload a single résumé. Nexus will read it carefully and present its understanding
            for your review — nothing is saved until you confirm.
          </p>
          <div className="rule mt-10 max-w-xs" />
        </header>

        {!parsedData ? (
          <form onSubmit={handleUpload} className="paper-card p-12 text-center">
            <p className="kicker justify-center">Accepted format · PDF</p>
            <h2 className="mt-6 font-serif text-2xl font-medium text-foreground">
              Choose your résumé
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              A single document, in its current form.
            </p>

            <div className="my-10 flex justify-center">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="text-sm text-muted-foreground file:mr-4 file:rounded-md file:border file:border-border file:bg-secondary file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
              />
            </div>

            <button type="submit" disabled={loading || !file} className="btn-ink min-w-[14rem]">
              {loading ? "Reading manuscript…" : "Upload & parse"}
            </button>
          </form>
        ) : (
          <div className="paper-card p-10 lg:p-12">
            <div className="mb-10">
              <span className="kicker">Chapter II · Verification</span>
              <h2 className="mt-4 font-serif text-3xl font-medium text-foreground">
                Review the reading.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Adjust anything that doesn't ring true. Your edits become the source of record.
              </p>
            </div>

            <div className="space-y-10">
              <div>
                <label className="kicker mb-3 block">Professional summary</label>
                <textarea
                  value={parsedData.summary}
                  onChange={(e) => setParsedData({ ...parsedData, summary: e.target.value })}
                  rows={6}
                  className="field"
                />
              </div>

              <div>
                <label className="kicker mb-3 block">Core technical skills</label>
                <input
                  type="text"
                  value={parsedData.skills.join(", ")}
                  onChange={(e) =>
                    setParsedData({ ...parsedData, skills: e.target.value.split(", ") })
                  }
                  className="field"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Separate each skill with a comma and a space.
                </p>
              </div>
            </div>

            <div className="rule my-10" />

            <button onClick={handleSaveVerifiedProfile} className="btn-ink w-full">
              Confirm & lock master profile
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
