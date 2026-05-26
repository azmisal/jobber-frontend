import { useEffect, useState } from "react";
import { LLM_MODELS } from "@/constants/llmModels";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // ✅ SSR-safe model initialization
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window === "undefined") return LLM_MODELS[0].id;
    return localStorage.getItem("llmModel") || LLM_MODELS[0].id;
  });

  // Save model to localStorage safely
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("llmModel", selectedModel);
  }, [selectedModel]);

  // No need to expose model globally; fetch logic will read from localStorage or state.

  // Load token safely on route change
  useEffect(() => {
    if (typeof window === "undefined") return;
    setToken(localStorage.getItem("token"));
  }, [location.pathname]);

  const handleLogout = (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    }
    setToken(null);
    navigate("/login");
  };

  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Profile", path: "/profile-setup" },
    { name: "Review", path: "/review" },
  ] as const;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6 lg:px-10">

        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-baseline gap-3"
        >
          <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Nexus
          </span>
          <span className="kicker !text-[0.6rem]">CV Atelier</span>
        </button>

        {/* Desktop Nav */}
        {token && (
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 text-sm tracking-wide transition-colors ${active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {link.name}
                    {active && (
                      <span className="absolute -bottom-0.5 left-1/2 h-px w-6 -translate-x-1/2 bg-[var(--color-gold)]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Model Selector */}
            <select
              className="ml-4 rounded border px-2 py-1 text-sm bg-background border-border text-foreground"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              title="Select LLM Model"
            >
              {LLM_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Auth buttons */}
        <div className="hidden items-center gap-4 md:flex">
          {token ? (
            <button type="button" onClick={handleLogout} className="btn-ghost px-5 py-2">
              Sign out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
              <Link to="/signup" className="btn-ink px-5 py-2">
                Begin
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground md:hidden"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-5">

            {token ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md px-3 py-3 text-sm text-foreground hover:bg-secondary"
                  >
                    {link.name}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="btn-ghost mt-2 w-full"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-3 text-sm text-foreground hover:bg-secondary"
                >
                  Sign in
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-ink mt-2 w-full"
                >
                  Begin
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}