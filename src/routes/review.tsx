import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import RequireAuth from "@/components/RequireAuth";
import type { LocationState, OptimizationProposal, OptimizationResult } from "@/types";

export const Route = createFileRoute("/review")({
  component: () => (
    <RequireAuth>
      <ReviewChangesPage />
    </RequireAuth>
  ),
});

function ReviewChangesPage() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<OptimizationProposal[]>([]);
  const [outputFileName, setOutputFileName] = useState<string>("Tailored_Resume");
  const [approvedIds, setApprovedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("nexus:review");
    if (raw) {
      try {
        const state = JSON.parse(raw) as LocationState;
        const list = state.proposals || [];
        setProposals(list);
        setOutputFileName(state.outputFileName || "Tailored_Resume");
        setApprovedIds(list.map((p) => p.id));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const toggleApproval = (id: number): void => {
    if (approvedIds.includes(id)) {
      setApprovedIds(approvedIds.filter((i) => i !== id));
    } else {
      setApprovedIds([...approvedIds, id]);
    }
  };

  const handleFinalSubmit = async (): Promise<void> => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post<OptimizationResult>(

        `${import.meta.env.VITE_API_BASE_URL}/api/optimize/apply`,
        {
          approved_ids: approvedIds,
          proposals: proposals,
          output_file_name: outputFileName,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setResult(res.data);
      console.log("Optimization result: ", result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (): Promise<void> => {
    try {
      const response = await axios.get(result?.download_url || "", {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = blobUrl;

      // IMPORTANT
      link.setAttribute(
        'download',
        result?.file_name.endsWith('.pdf')
          ? result.file_name
          : `resume.pdf`
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error('Download failed:', error);
    }
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] px-6 py-16 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="mb-14">
          <span className="kicker">§ III · The galley proof</span>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-foreground lg:text-5xl">
            Review each revision.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Every proposed line is shown beside the original. Authorise the ones that ring true,
            reject the rest. Nothing is published until you say so.
          </p>
          <div className="rule mt-10" />
        </header>

        {!result ? (
          <div className="space-y-8">
            {proposals.length === 0 ? (
              <div className="paper-card p-12 text-center">
                <p className="kicker justify-center">No revisions yet</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Return to the atelier to submit a job description and generate proposals.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="kicker">{proposals.length} proposed revisions</span>
                  <span className="kicker">{approvedIds.length} authorised</span>
                </div>

                {proposals.map((prop, idx) => {
                  const isApproved = approvedIds.includes(prop.id);
                  return (
                    <article
                      key={prop.id}
                      className={`paper-card p-8 transition-colors ${isApproved ? "" : "opacity-60"
                        }`}
                    >
                      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                        <div className="flex items-baseline gap-4">
                          <span className="font-serif text-xl text-[var(--color-gold)]">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="kicker">
                            Keyword · <span className="ml-1 normal-case tracking-normal text-foreground">{prop.keyword_added}</span>
                          </span>
                        </div>
                        <button
                          onClick={() => toggleApproval(prop.id)}
                          className={isApproved ? "btn-ink !py-2 !px-4 !text-xs" : "btn-ghost !py-2 !px-4 !text-xs"}
                        >
                          {isApproved ? "✓ Authorised" : "Reject"}
                        </button>
                      </div>

                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="border-l border-destructive/40 pl-5">
                          <span className="kicker !text-destructive/80">Before</span>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-through">
                            {prop.original_line}
                          </p>
                        </div>
                        <div className="border-l-2 border-[var(--color-gold)] pl-5">
                          <span className="kicker">After</span>
                          <p className="mt-3 text-sm leading-relaxed text-foreground">
                            {prop.proposed_line}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}

                <div className="rule" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Exporting as{" "}
                    <span className="font-serif italic text-foreground">{outputFileName}</span>
                  </p>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="btn-ink"
                  >
                    {loading ? "Compiling the volume…" : "Authorise & generate CV"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <span className="kicker">The cover letter</span>
              <h3 className="mt-4 font-serif text-2xl font-medium text-foreground">
                A note to the editor
              </h3>
              <div className="rule my-6 max-w-xs" />
              <pre className="whitespace-pre-wrap font-serif text-[15px] leading-[1.8] text-foreground">
                {result.cover_letter}
              </pre>
            </div>

            <aside className="paper-card h-fit p-8">
              <span className="kicker">Ready</span>
              <h3 className="mt-3 font-serif text-xl font-medium text-foreground">
                Your tailored CV is set
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Your résumé variant has been compiled and is ready for download.
              </p>

              <button
                onClick={handleDownload}
                rel="noreferrer"
                className="btn-ink mt-6 w-full"
              >
                Download resume PDF
              </button>
              <button onClick={() => navigate({ to: "/" })} className="btn-ghost mt-3 w-full">
                Return to atelier
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
