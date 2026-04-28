import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface HelpContextType {
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  reopenOnboarding: () => void;
}

const HelpContext = createContext<HelpContextType>({
  showOnboarding: false,
  setShowOnboarding: () => {},
  onboardingComplete: false,
  completeOnboarding: () => {},
  reopenOnboarding: () => {},
});

export function HelpProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

  useEffect(() => {
    if (!user) return;
    const key = `brix_onboarding_complete_${user.id}`;
    const done = localStorage.getItem(key) === "true";
    setOnboardingComplete(done);
    if (!done) setShowOnboarding(true);
  }, [user]);

  const completeOnboarding = useCallback(() => {
    if (!user) return;
    localStorage.setItem(`brix_onboarding_complete_${user.id}`, "true");
    setOnboardingComplete(true);
    setShowOnboarding(false);
  }, [user]);

  const reopenOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  return (
    <HelpContext.Provider value={{ showOnboarding, setShowOnboarding, onboardingComplete, completeOnboarding, reopenOnboarding }}>
      {children}
    </HelpContext.Provider>
  );
}

export const useHelp = () => useContext(HelpContext);
