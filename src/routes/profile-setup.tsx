import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/profile-setup")({
  component: () => (
    <RequireAuth>
      <ProfileSetupPage />
    </RequireAuth>
  ),
});

interface ResumeData {
  basics: {
    full_name: string;
    headline: string;
    emails: string[];
    phones: string[];
    location: string;
    links: {
      label: string;
      url: string;
    }[];
  };

  sections: {
    id: string;
    title: string;
    type: string;
    content: any[];
    raw_text: string;
  }[];

  metadata: {
    section_order: string[];
    parsing_confidence: number;
  };

  raw_resume_text: string;
}

function normalizeResumeData(data: any): ResumeData {
  return {
    basics: data?.basics ?? {
      full_name: "",
      headline: "",
      emails: [],
      phones: [],
      location: "",
      links: [],
    },

    sections: Array.isArray(data?.sections)
      ? data.sections.map((section: any) => ({
          id: section?.id ?? crypto.randomUUID(),
          title: section?.title ?? "Untitled Section",
          type: section?.type ?? "custom",
          content: Array.isArray(section?.content)
            ? section.content
            : typeof section?.content === "string"
            ? [section.content]
            : [],
          raw_text: section?.raw_text ?? "",
        }))
      : [],

    metadata: data?.metadata ?? {
      section_order: [],
      parsing_confidence: 0,
    },

    raw_resume_text: data?.raw_resume_text ?? "",
  };
}

function ProfileSetupPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [parsedData, setParsedData] = useState<ResumeData | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a resume.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate({ to: "/login" });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/resume/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail ?? "Resume upload failed.");
      if (!data?.profile) throw new Error("No parsed data returned.");

      setParsedData(normalizeResumeData(data.profile));
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const structuredClone = <T,>(obj: T): T =>
    JSON.parse(JSON.stringify(obj));

  const updateStringContent = (
    sectionIndex: number,
    contentIndex: number,
    value: string
  ) => {
    if (!parsedData) return;

    const updated = structuredClone(parsedData);
    updated.sections[sectionIndex].content[contentIndex] = value;
    setParsedData(updated);
  };

  const updateObjectField = (
    sectionIndex: number,
    contentIndex: number,
    key: string,
    value: any
  ) => {
    if (!parsedData) return;

    const updated = structuredClone(parsedData);
    updated.sections[sectionIndex].content[contentIndex][key] = value;
    setParsedData(updated);
  };

  const addNewSection = () => {
    if (!parsedData) return;

    const updated = structuredClone(parsedData);

    updated.sections.push({
      id: crypto.randomUUID(),
      title: "New Section",
      type: "custom",
      content: [],
      raw_text: "",
    });

    setParsedData(updated);
  };

  const addNewObject = (sectionIndex: number) => {
    if (!parsedData) return;

    const updated = structuredClone(parsedData);

    updated.sections[sectionIndex].content.push({
      title: "",
      subtitle: "",
      duration: "",
      bullets: [],
    });

    setParsedData(updated);
  };

  const handleSave = async () => {
    if (!parsedData) return;

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/resume/rectify`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(parsedData),
        }
      );

      if (!res.ok) throw new Error("Failed to save profile.");

      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message ?? "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-5xl">

        {!parsedData ? (
          <form onSubmit={handleUpload} className="paper-card p-12 text-center">
            <h1 className="font-serif text-4xl">Upload Resume</h1>

            <div className="my-10">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  setFile(e.target.files?.[0] ?? null)
                }
              />
            </div>

            {error && <p className="mb-6 text-red-500">{error}</p>}

            <button disabled={!file || loading} className="btn-ink">
              {loading ? "Parsing..." : "Upload Resume"}
            </button>
          </form>
        ) : (
          <div className="space-y-12">

            {/* BASICS */}
            <section className="paper-card p-8 space-y-5">
              <h2 className="font-serif text-3xl">Personal Information</h2>

              <input
                className="field"
                value={parsedData.basics.full_name}
                onChange={(e) =>
                  setParsedData((prev) => ({
                    ...prev!,
                    basics: { ...prev!.basics, full_name: e.target.value },
                  }))
                }
                placeholder="Full name"
              />

              <input
                className="field"
                value={parsedData.basics.headline}
                onChange={(e) =>
                  setParsedData((prev) => ({
                    ...prev!,
                    basics: { ...prev!.basics, headline: e.target.value },
                  }))
                }
                placeholder="Headline"
              />

              <input
                className="field"
                value={parsedData.basics.location}
                onChange={(e) =>
                  setParsedData((prev) => ({
                    ...prev!,
                    basics: { ...prev!.basics, location: e.target.value },
                  }))
                }
                placeholder="Location"
              />
            </section>

            {/* SECTIONS */}
            {parsedData.sections.map((section, sectionIndex) => (
              <section key={section.id} className="paper-card p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="kicker">{section.type}</p>
                    <h2 className="mt-2 font-serif text-3xl">
                      {section.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => addNewObject(sectionIndex)}
                    className="btn-ink flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-6">
                  {section.content.map((item, contentIndex) => {
                    if (typeof item === "string") {
                      return (
                        <input
                          key={contentIndex}
                          value={item}
                          onChange={(e) =>
                            updateStringContent(
                              sectionIndex,
                              contentIndex,
                              e.target.value
                            )
                          }
                          className="field"
                        />
                      );
                    }

                    if (typeof item === "object" && item) {
                      return (
                        <div
                          key={contentIndex}
                          className="rounded-2xl border border-border p-6 space-y-4"
                        >
                          {Object.entries(item).map(([key, value]) => {
                            if (Array.isArray(value)) {
                              return (
                                <textarea
                                  key={key}
                                  value={value.join("\n")}
                                  onChange={(e) =>
                                    updateObjectField(
                                      sectionIndex,
                                      contentIndex,
                                      key,
                                      e.target.value
                                        .split("\n")
                                        .filter(Boolean)
                                    )
                                  }
                                  className="field min-h-[120px]"
                                />
                              );
                            }

                            return (
                              <input
                                key={key}
                                value={String(value ?? "")}
                                onChange={(e) =>
                                  updateObjectField(
                                    sectionIndex,
                                    contentIndex,
                                    key,
                                    e.target.value
                                  )
                                }
                                className="field"
                              />
                            );
                          })}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </section>
            ))}

            <button onClick={addNewSection} className="btn-ink flex items-center gap-2">
              <Plus size={18} />
              Add New Section
            </button>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-red-700">
                {error}
              </div>
            )}

            <button onClick={handleSave} disabled={saving} className="btn-ink w-full">
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default ProfileSetupPage;