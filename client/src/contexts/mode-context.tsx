import { createContext, useContext, useState, ReactNode } from "react";
import { ThinkingMode } from "@/lib/types";

interface ModeContextType {
  currentMode: ThinkingMode;
  setMode: (mode: ThinkingMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [currentMode, setCurrentMode] = useState<ThinkingMode>(null);

  const setMode = (mode: ThinkingMode) => {
    setCurrentMode(mode);
  };

  return (
    <ModeContext.Provider value={{ currentMode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
