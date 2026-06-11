import { createContext, useContext, useEffect, useState } from "react";
import type { ResumeData, GetProfileResponse } from "@/types";
import { tokenStore } from "@/lib/tokenStore";

interface ProfileContextType {
  profile: ResumeData | null;
  hasProfile: boolean | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ResumeData | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = tokenStore().getToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/resume/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: GetProfileResponse = await res.json();

      setHasProfile(data.has_profile);
      setProfile(data.data ?? null);
    } catch (err) {
      console.error(err);
      setHasProfile(false);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        hasProfile,
        loading,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}