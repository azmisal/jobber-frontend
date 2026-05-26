import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Plus, Pencil, Upload, X } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";

// ---------------- TYPES (UNCHANGED) ----------------
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
    links: { label: string; url: string }[];
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
  };

  raw_resume_text: string;
}

// ---------------- HELPERS (UNCHANGED) ----------------
function isPrimitive(value: ResumeValue): value is string | number | boolean | null {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function emptyValueFor(label: string): ResumeValue {
  if (label.toLowerCase().includes("link")) return { label: "", url: "" };
  return "";
}

// ---------------- VALUE EDITOR (UNCHANGED LOGIC) ----------------
function ValueEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ResumeValue;
  onChange: (v: ResumeValue) => void;
}) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        <span className="kicker">{label}</span>
        <textarea
          className="field min-h-[100px]"
          value={value.map(String).join("\n")}
          onChange={(e) =>
            onChange(e.target.value.split("\n").filter(Boolean))
          }
        />
      </div>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div className="space-y-2 border p-3 rounded-lg">
        <span className="kicker">{label}</span>
        {Object.entries(value as ResumeObject).map(([k, v]) => (
          <ValueEditor
            key={k}
            label={k}
            value={v}
            onChange={(next) =>
              onChange({ ...(value as ResumeObject), [k]: next })
            }
          />
        ))}
      </div>
    );
  }

  return (
    <input
      className="field"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ---------------- MAIN COMPONENT ----------------
function ProfileSetupPage() {
  const navigate = useNavigate();
  const { profile, hasProfile } = useProfile();

  const [file, setFile] = useState<File | null>(null);

  const [parsedData, setParsedData] = useState<ResumeData | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // SAFE INIT (FIXED BUG)
  useEffect(() => {
    if (hasProfile && profile && !parsedData) {
      setParsedData(profile as ResumeData);
    }
  }, [hasProfile, profile]);

  const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

  // ---------------- UPLOAD ----------------
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/resume/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Upload failed");

      setParsedData(data.profile);
      setUploadMode(false);
      setViewOpen(true);
      setEditMode(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SAVE ----------------
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

      if (!res.ok) throw new Error("Save failed");

      setEditMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------- PROFILE CARD VIEW ----------------
  if (!parsedData && !uploadMode) {
    return (
      <main className="p-10">
        <div className="max-w-2xl mx-auto space-y-6">

          <div className="paper-card p-6">
            <h2 className="text-2xl font-bold">No Profile Found</h2>
            <p className="text-gray-500 mt-2">
              Upload a resume or create a new profile.
            </p>

            <button
              onClick={() => setUploadMode(true)}
              className="btn-ink mt-4 flex items-center gap-2"
            >
              <Upload size={16} />
              New Profile
            </button>
          </div>

        </div>
      </main>
    );
  }

  // ---------------- UPLOAD SCREEN ----------------
  if (uploadMode) {
    return (
      <main className="p-10">
        <form onSubmit={handleUpload} className="paper-card p-8 space-y-4">
          <h2 className="text-2xl">Upload Resume</h2>

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          {error && <p className="text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button className="btn-ink" disabled={loading}>
              Upload
            </button>

            <button
              type="button"
              onClick={() => setUploadMode(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    );
  }

  // ---------------- PROFILE CARD ----------------
  return (
    <main className="p-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* TOP ACTIONS */}
        <div className="flex justify-between">
          <button
            onClick={() => setUploadMode(true)}
            className="btn-ink flex items-center gap-2"
          >
            <Upload size={16} />
            New Profile
          </button>

          {parsedData && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="btn-ghost flex items-center gap-2"
            >
              <Pencil size={16} />
              {editMode ? "Stop Editing" : "Edit Profile"}
            </button>
          )}
        </div>

        {/* PROFILE CARD */}
        <div className="paper-card p-6">
          <div
            className="cursor-pointer"
            onClick={() => setViewOpen(!viewOpen)}
          >
            <h2 className="text-xl font-bold">
              {parsedData?.basics?.full_name || "My Profile"}
            </h2>
            <p className="text-gray-500">
              {parsedData?.basics?.headline}
            </p>
          </div>

          {/* EXPANDED VIEW */}
          {viewOpen && parsedData && (
            <div className="mt-6 space-y-6">

              {/* BASICS */}
              <section className="space-y-3">
                <h3 className="font-bold">Basics</h3>

                {Object.entries(parsedData.basics).map(([k, v]) => (
                  <ValueEditor
                    key={k}
                    label={k}
                    value={v}
                    onChange={(val) => {
                      if (!editMode) return;
                      setParsedData({
                        ...parsedData,
                        basics: { ...parsedData.basics, [k]: val },
                      });
                    }}
                  />
                ))}
              </section>

              {/* SECTIONS (HIDE "model") */}
              {parsedData.sections
                .filter((s) => s.type !== "model")
                .map((section, i) => (
                  <section key={section.id} className="space-y-3">
                    <h3 className="font-bold">{section.title}</h3>

                    {section.content.map((item, idx) => (
                      <ValueEditor
                        key={idx}
                        label={`${section.title}-${idx}`}
                        value={item}
                        onChange={(val) => {
                          if (!editMode) return;

                          const updated = clone(parsedData);
                          updated.sections[i].content[idx] = val;
                          setParsedData(updated);
                        }}
                      />
                    ))}

                    {editMode && (
                      <button
                        onClick={() => {
                          const updated = clone(parsedData);
                          updated.sections[i].content.push("");
                          setParsedData(updated);
                        }}
                        className="btn-ghost"
                      >
                        <Plus size={14} /> Add
                      </button>
                    )}
                  </section>
                ))}

              {/* SAVE */}
              {editMode && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-ink w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}

            </div>
          )}
        </div>

      </div>
    </main>
  );
}

export default ProfileSetupPage;