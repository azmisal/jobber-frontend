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

type ResumeValue =
  | string
  | number
  | boolean
  | null
  | ResumeValue[]
  | { [key: string]: ResumeValue };

type ResumeObject = { [key: string]: ResumeValue };

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
    [key: string]: ResumeValue;
  };

  sections: {
    id: string;
    title: string;
    type: string;
    content: ResumeValue[];
    raw_text: string;
  }[];

  metadata: {
    section_order: string[];
    parsing_confidence: number;
    embedded_links?: {
      label: string;
      url: string;
    }[];
    plain_resume_text?: string;
  };

  raw_resume_text: string;
}

function normalizeDynamicValue(value: unknown): ResumeValue {
  if (value === null || value === undefined) return "";

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeDynamicValue);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        normalizeDynamicValue(child),
      ])
    );
  }

  return String(value);
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "")).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) return [value.trim()];

  return [];
}

function normalizeLinks(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((link) => {
      if (typeof link === "string") return { label: "", url: link };
      if (!link || typeof link !== "object") return { label: "", url: "" };

      const item = link as Record<string, unknown>;
      return {
        label: String(item.label ?? item.name ?? item.title ?? ""),
        url: String(item.url ?? item.href ?? item.link ?? item.value ?? ""),
      };
    })
    .filter((link) => link.label || link.url);
}

function normalizeResumeData(data: unknown): ResumeData {
  const source =
    data && typeof data === "object" ? (data as Record<string, any>) : {};
  const basics =
    source?.basics && typeof source.basics === "object"
      ? (source.basics as Record<string, unknown>)
      : {};

  return {
    basics: {
      ...Object.fromEntries(
        Object.entries(basics).map(([key, value]) => [
          key,
          normalizeDynamicValue(value),
        ])
      ),
      full_name: String(
        basics.full_name ?? basics.fullName ?? basics.name ?? ""
      ),
      headline: String(basics.headline ?? basics.title ?? basics.role ?? ""),
      emails: normalizeStringList(basics.emails ?? basics.email),
      phones: normalizeStringList(basics.phones ?? basics.phone),
      location: String(basics.location ?? basics.address ?? ""),
      links: normalizeLinks(basics.links ?? basics.urls ?? basics.profiles),
    },

    sections: Array.isArray(source?.sections)
      ? source.sections.map((section: any) => ({
        id: section?.id ?? crypto.randomUUID(),
        title: section?.title ?? "Untitled Section",
        type: section?.type ?? "custom",
        content: Array.isArray(section?.content)
          ? section.content.map(normalizeDynamicValue)
          : typeof section?.content === "string"
            ? [section.content]
            : section?.content && typeof section.content === "object"
              ? [normalizeDynamicValue(section.content)]
            : [],
        raw_text: section?.raw_text ?? "",
      }))
      : [],

    metadata: source?.metadata ?? {
      section_order: [],
      parsing_confidence: 0,
      embedded_links: [],
      plain_resume_text: "",
    },

    raw_resume_text: source?.raw_resume_text ?? "",
  };
}

function isPrimitive(value: ResumeValue): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function emptyValueFor(label: string): ResumeValue {
  const lower = label.toLowerCase();

  if (lower.includes("link")) return { label: "", url: "" };

  return "";
}

function ValueEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ResumeValue;
  onChange: (value: ResumeValue) => void;
}) {
  if (Array.isArray(value)) {
    const primitiveOnly = value.every(isPrimitive);

    if (primitiveOnly) {
      return (
        <label className="block space-y-2">
          <span className="kicker">{label}</span>
          <textarea
            value={value.map((item) => String(item ?? "")).join("\n")}
            onChange={(e) =>
              onChange(e.target.value.split("\n").filter(Boolean))
            }
            className="field min-h-[110px]"
          />
        </label>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="kicker">{label}</span>
          <button
            type="button"
            className="btn-ghost !px-3 !py-2 !text-xs"
            onClick={() => onChange([...value, emptyValueFor(label)])}
          >
            Add
          </button>
        </div>
        {value.map((item, index) => (
          <div key={index} className="rounded-xl border border-border p-4">
            <ValueEditor
              label={`${label} ${index + 1}`}
              value={item}
              onChange={(next) => {
                const updated = [...value];
                updated[index] = next;
                onChange(updated);
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (value && typeof value === "object") {
    const objectValue = value as ResumeObject;

    return (
      <div className="space-y-3">
        <span className="kicker">{label}</span>
        <div className="space-y-4 rounded-xl border border-border p-4">
          {Object.entries(objectValue).map(([key, child]) => (
            <ValueEditor
              key={key}
              label={key}
              value={child}
              onChange={(next) =>
                onChange({
                  ...objectValue,
                  [key]: next,
                })
              }
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <label className="block space-y-2">
      <span className="kicker">{label}</span>
      <input
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </label>
  );
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

      const model = localStorage.getItem("llmModel") || "groq";
      const formDataWithModel = new FormData();
      formDataWithModel.append("file", file);
      formDataWithModel.append("model", model);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/resume/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataWithModel,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data?.detail?.toLowerCase().includes("token") || data?.detail?.toLowerCase().includes("free tier")) {
          alert("The free tier for this model has ended or tokens are exhausted. Please change the model in the navbar to continue.");
        }
        throw new Error(data?.detail ?? "Resume upload failed.");
      }
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

  const updateContentValue = (
    sectionIndex: number,
    contentIndex: number,
    value: ResumeValue
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
    value: ResumeValue
  ) => {
    if (!parsedData) return;

    const updated = structuredClone(parsedData);
    const item = updated.sections[sectionIndex].content[contentIndex];

    if (!item || typeof item !== "object" || Array.isArray(item)) return;

    (item as ResumeObject)[key] = value;
    setParsedData(updated);
  };

  const updateBasicsField = (key: string, value: ResumeValue) => {
    if (!parsedData) return;

    const updated = structuredClone(parsedData);
    updated.basics[key] = value;
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


      const model = localStorage.getItem("llmModel") || "groq";
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/resume/rectify`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...parsedData, model }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.detail?.toLowerCase().includes("token") || data?.detail?.toLowerCase().includes("free tier")) {
          alert("The free tier for this model has ended or tokens are exhausted. Please change the model in the navbar to continue.");
        }
        throw new Error("Failed to save profile.");
      }

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

            <div className="my-8">
              <input
                type="file"
                accept=".pdf"
                className="
                file:bg-gray-300 
                file:rounded-lg
                file:border-0
                file:px-2
                file:py-2
                file:mr-4
                file:cursor-pointer
                "
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

              {Object.entries(parsedData.basics).map(([key, value]) => (
                <ValueEditor
                  key={key}
                  label={key}
                  value={value}
                  onChange={(next) => updateBasicsField(key, next)}
                />
              ))}
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

                    if (isPrimitive(item)) {
                      return (
                        <ValueEditor
                          key={contentIndex}
                          label={`${section.title} ${contentIndex + 1}`}
                          value={item}
                          onChange={(next) =>
                            updateContentValue(
                              sectionIndex,
                              contentIndex,
                              next
                            )
                          }
                        />
                      );
                    }

                    if (Array.isArray(item)) {
                      return (
                        <div
                          key={contentIndex}
                          className="rounded-2xl border border-border p-6"
                        >
                          <ValueEditor
                            label={`${section.title} ${contentIndex + 1}`}
                            value={item}
                            onChange={(next) =>
                              updateContentValue(
                                sectionIndex,
                                contentIndex,
                                next
                              )
                            }
                          />
                        </div>
                      );
                    }

                    if (typeof item === "object" && item) {
                      return (
                        <div
                          key={contentIndex}
                          className="rounded-2xl border border-border p-6 space-y-4"
                        >
                          {Object.entries(item).map(([key, value]) => (
                            <ValueEditor
                              key={key}
                              label={key}
                              value={value as ResumeValue}
                              onChange={(next) =>
                                updateObjectField(
                                  sectionIndex,
                                  contentIndex,
                                  key,
                                  next
                                )
                              }
                            />
                          ))}
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
