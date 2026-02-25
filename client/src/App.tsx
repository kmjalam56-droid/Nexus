import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { ModeProvider } from "@/contexts/mode-context";
import { LanguageProvider } from "@/contexts/language-context";
import { ConversationProvider } from "@/contexts/conversation-context";
import { GoogleAuthProvider, useGoogleAuth } from "@/contexts/google-auth-context";
import { OnboardingTutorial } from "@/components/tutorial/onboarding-tutorial";
import Home from "@/pages/Home";
import AccountPage from "@/pages/account";
import SettingsPage from "@/pages/settings";
import TrainingPage from "@/pages/training";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/account" component={AccountPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/training" component={TrainingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithGoogleAuth({ children }: { children: React.ReactNode }) {
  const { clientId, isReady } = useGoogleAuth();

  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse text-slate-400 font-medium">Loading Nexus...</div>
      </div>
    );
  }

  if (clientId) {
    return (
      <GoogleOAuthProvider clientId={clientId}>
        {children}
      </GoogleOAuthProvider>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ModeProvider>
          <ConversationProvider>
            <QueryClientProvider client={queryClient}>
              <GoogleAuthProvider>
                <AppWithGoogleAuth>
                  <TooltipProvider>
                    <Toaster />
                    <Router />
                  </TooltipProvider>
                </AppWithGoogleAuth>
              </GoogleAuthProvider>
            </QueryClientProvider>
          </ConversationProvider>
        </ModeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
