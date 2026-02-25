import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lock, Send, Trash2, Brain, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";

interface TrainingMessage {
  id: number;
  instruction: string;
  createdAt: string;
}

export default function TrainingPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [trainingMessages, setTrainingMessages] = useState<TrainingMessage[]>([]);
  const [newInstruction, setNewInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if already unlocked in session
  useEffect(() => {
    const savedPassword = sessionStorage.getItem("trainingPassword");
    if (savedPassword) {
      setStoredPassword(savedPassword);
      setIsUnlocked(true);
      // Fetch with the saved password
      fetch("/api/training/messages/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: savedPassword }),
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setTrainingMessages(data))
        .catch(err => console.error("Error fetching training messages:", err));
    }
  }, []);

  const fetchTrainingMessages = async (pass?: string) => {
    const passwordToUse = pass || storedPassword;
    if (!passwordToUse) return;
    
    try {
      const response = await fetch("/api/training/messages/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordToUse }),
      });
      if (response.ok) {
        const data = await response.json();
        setTrainingMessages(data);
      }
    } catch (error) {
      console.error("Error fetching training messages:", error);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/training/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setStoredPassword(password);
        sessionStorage.setItem("trainingPassword", password);
        setIsUnlocked(true);
        fetchTrainingMessages(password);
      } else {
        setPasswordError("Wrong password! Access denied.");
      }
    } catch (error) {
      setPasswordError("Connection error. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstruction.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/training/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: newInstruction, password: storedPassword }),
      });

      if (response.ok) {
        setNewInstruction("");
        fetchTrainingMessages();
      }
    } catch (error) {
      console.error("Error adding instruction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInstruction = async (id: number) => {
    try {
      await fetch(`/api/training/messages/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: storedPassword }),
      });
      fetchTrainingMessages();
    } catch (error) {
      console.error("Error deleting instruction:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-indigo-900/10">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="h-8 w-8"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
              Train The AI
            </h1>
          </div>
          {isUnlocked && (
            <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <Shield className="h-3 w-3" />
              <span className="text-[10px] font-medium">Unlocked</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!isUnlocked ? (
            /* Password Gate */
            <motion.div
              key="password-gate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex flex-col items-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Secret Training Zone
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
                    Enter the master password to access AI training controls
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <Input
                      ref={inputRef}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter secret password..."
                      className="w-full text-center text-lg tracking-widest"
                      data-testid="input-training-password"
                      autoFocus
                    />
                    {passwordError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-500 text-center"
                      >
                        {passwordError}
                      </motion.p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !password}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                    data-testid="button-unlock"
                  >
                    {isLoading ? "Verifying..." : "Unlock Training"}
                  </Button>
                </form>
              </motion.div>
            </motion.div>
          ) : (
            /* Training Interface */
            <motion.div
              key="training-interface"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Info Card */}
              <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      How Training Works
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Every instruction you add here becomes part of the AI's core personality. 
                      The AI will follow these guidelines in ALL conversations. Good or bad - 
                      whatever you teach, the AI will learn and apply.
                    </p>
                  </div>
                </div>
              </div>

              {/* Training Messages List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-1">
                  Active Training Instructions ({trainingMessages.length})
                </h3>

                {trainingMessages.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                    <Brain className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">
                      No training instructions yet. Start teaching your AI!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trainingMessages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                              {index + 1}
                            </span>
                          </div>
                          <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {msg.instruction}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInstruction(msg.id)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            data-testid={`delete-instruction-${msg.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Instruction */}
              <form onSubmit={handleAddInstruction} className="sticky bottom-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex gap-3">
                    <textarea
                      value={newInstruction}
                      onChange={(e) => setNewInstruction(e.target.value)}
                      placeholder="Enter a new training instruction... (e.g., 'Always respond in a friendly manner' or 'When asked about coding, provide detailed examples')"
                      className="flex-1 min-h-[80px] resize-none bg-slate-50 dark:bg-slate-900 rounded-lg border-0 p-3 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20"
                      data-testid="input-new-instruction"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !newInstruction.trim()}
                      className="self-end bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      data-testid="button-add-instruction"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
