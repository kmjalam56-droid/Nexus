import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useGoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "@/contexts/google-auth-context";

function GoogleButton({ onLogin, onError, disabled }: { onLogin: (accessToken: string) => void; onError: (msg: string) => void; disabled: boolean }) {
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      onLogin(tokenResponse.access_token);
    },
    onError: (error) => {
      console.error("Google login error:", error);
      onError("Google login failed. Please try again.");
    },
    flow: 'implicit',
  });

  return (
    <button
      type="button"
      onClick={() => {
        try {
          googleLogin();
        } catch (e) {
          console.error("Google login click error:", e);
          onError("Could not open Google login. Please check popup blocker.");
        }
      }}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
      data-testid="button-google-login"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span className="text-slate-700 dark:text-slate-200 font-medium">Continue with Google</span>
    </button>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isReady: googleReady, clientId } = useGoogleAuth();
  const googleEnabled = googleReady && !!clientId;
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/login" : "/api/signup";
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      // Invalidate auth query to refetch user
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Redirect to home
      setLocation("/");
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (accessToken: string) => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Google login failed");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (err) {
      setError("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-indigo-900/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black shadow-lg mb-4">
            <span className="font-bold text-xl tracking-tighter">NX</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome to Nexus
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isLogin ? "Sign in to continue" : "Create your account"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
          {/* Toggle */}
          <div className="hidden bg-slate-100 dark:bg-slate-900 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isLogin 
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400"
              }`}
              data-testid="tab-login"
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isLogin 
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400"
              }`}
              data-testid="tab-signup"
            >
              Sign Up
            </button>
          </div>

          {googleEnabled && (
            <div className="space-y-4">
              <GoogleButton onLogin={handleGoogleLogin} onError={setError} disabled={isLoading} />
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-800 px-3 text-slate-500 uppercase tracking-widest font-bold">
                    Or
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Skip login */}
          <div className="text-center">
            <button
              onClick={() => setLocation("/")}
              className="text-sm font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              data-testid="button-skip-login"
            >
              Continue without account
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
