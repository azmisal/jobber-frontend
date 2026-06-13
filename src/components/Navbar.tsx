import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LLM_MODELS } from "../constants/llmModels";
import { tokenStore } from "@/lib/tokenStore";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>(
    LLM_MODELS[0]?.id || ""
  );

  // Load model from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem("llmModel");

    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  // Save model
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem("llmModel", selectedModel);
    }
  }, [selectedModel]);

  // Load token
  useEffect(() => {
    const storedToken = tokenStore().getToken();
    setToken(storedToken);
  });

  const handleLogout = () => {
    try {
      logout(user);
    } catch (error) {
      console.error("Error during logout:", error);
    }
    finally {
      navigate("/login");
    }
  };

  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Profile", path: "/profile-setup" },
    { name: "Review", path: "/review" },
  ];

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

          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            CV Atelier
          </span>
        </button>

        {/* Desktop Navigation */}
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
                      <span className="absolute -bottom-0.5 left-1/2 h-px w-6 -translate-x-1/2 bg-yellow-500" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="ml-4 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              {LLM_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Auth Buttons */}
        <div className="hidden items-center gap-4 md:flex">
          {token ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-border px-5 py-2 text-sm hover:bg-secondary"
            >
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

              <Link
                to="/signup"
                className="rounded-md bg-foreground px-5 py-2 text-sm text-background"
              >
                Begin
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden"
        >
          {mobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5">

            {token ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md px-3 py-3 text-sm hover:bg-secondary"
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
                  className="mt-2 rounded-md border border-border px-4 py-2 text-sm"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-3 text-sm hover:bg-secondary"
                >
                  Sign in
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 rounded-md bg-foreground px-4 py-2 text-center text-sm text-background"
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