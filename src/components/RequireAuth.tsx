import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate({ to: "/login" });
    } else {
      setReady(true);
    }
  }, [navigate]);

  if (!ready) return null;
  return <>{children}</>;
}
