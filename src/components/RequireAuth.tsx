import { tokenStore } from "@/lib/tokenStore";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = tokenStore().getToken();
    if (!token) {
      navigate("/login");
    } else {
      setReady(true);
    }
  }, [navigate]);

  if (!ready) return null;
  return <>{children}</>;
}
