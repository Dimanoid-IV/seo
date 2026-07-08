"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  authFetch,
  clearAccessToken,
} from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  locale: string;
  emailVerified: boolean;
  role: string;
};

export type SessionOrganization = {
  id: string;
  name: string;
};

export type SessionSubscription = {
  id: string;
  plan: string;
  planLabel?: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
};

type AuthSessionContextValue = {
  user: SessionUser | null;
  organization: SessionOrganization | null;
  subscription: SessionSubscription | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}

type MeResponse = {
  user: SessionUser;
  organization: SessionOrganization | null;
  subscription: SessionSubscription | null;
  onboardingCompleted: boolean;
};

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { dict } = useSaasTranslations();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [organization, setOrganization] =
    useState<SessionOrganization | null>(null);
  const [subscription, setSubscription] =
    useState<SessionSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async (): Promise<boolean> => {
    const response = await authFetch("/api/auth/me");

    if (!response.ok) {
      setUser(null);
      setOrganization(null);
      setSubscription(null);
      return false;
    }

    const data = (await response.json()) as MeResponse;
    setUser(data.user);
    setOrganization(data.organization);
    setSubscription(data.subscription);
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      const ok = await loadSession();
      if (!cancelled) {
        if (!ok) {
          router.replace("/login");
        }
        setLoading(false);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadSession, router]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    clearAccessToken();
    setUser(null);
    setOrganization(null);
    setSubscription(null);
    router.replace("/login");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      organization,
      subscription,
      loading,
      logout,
    }),
    [user, organization, subscription, loading, logout]
  );

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#050816]">
        <Loader2 className="size-8 animate-spin text-blue-400" />
        <p className="text-sm text-slate-400">{dict.auth.loadingDashboard}</p>
      </div>
    );
  }

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}
