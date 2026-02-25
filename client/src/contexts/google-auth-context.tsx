import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface GoogleAuthContextType {
  isReady: boolean;
  clientId: string | null;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  isReady: false,
  clientId: null,
});

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReady) {
        console.log("Google auth check timed out, proceeding...");
        setIsReady(true);
      }
    }, 2000);

    fetch("/api/auth/google-client-id")
      .then(res => res.json())
      .then(data => {
        setClientId(data.clientId || null);
        setIsReady(true);
      })
      .catch(() => {
        setClientId(null);
        setIsReady(true);
      })
      .finally(() => clearTimeout(timer));
  }, []);

  return (
    <GoogleAuthContext.Provider value={{ isReady, clientId }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}
