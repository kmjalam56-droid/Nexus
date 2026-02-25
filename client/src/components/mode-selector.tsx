import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThinkingMode } from "@/lib/types";
import { Cpu, Activity, GitBranch, Sparkles, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMode } from "@/contexts/mode-context";

export function ModeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentMode, setMode } = useMode();

  const modes: { id: ThinkingMode; label: string; icon: any; desc: string }[] = [
    { id: 'WHAT_IF', label: 'What If', icon: Cpu, desc: 'Explore hypotheses' },
    { id: 'CHAIN_REACTION', label: 'Chain Reaction', icon: Activity, desc: 'Analyze consequences' },
    { id: 'PARALLEL_TIMELINES', label: 'Parallel Timelines', icon: GitBranch, desc: 'Compare outcomes' },
  ];

  const currentModeData = modes.find(m => m.id === currentMode) || modes[0];
  const CurrentIcon = currentModeData.icon;

  return (
    <div className="w-full">
      {/* Collapsed State - Mode Indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        data-testid="mode-selector-toggle"
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <CurrentIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{currentModeData.label}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">• {currentModeData.desc}</span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-slate-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Expanded State - Mode Options */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              {modes.map((mode) => {
                const isActive = currentMode === mode.id;
                const Icon = mode.icon;
                
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setMode(mode.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-200",
                      isActive 
                        ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900" 
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                    data-testid={`mode-option-${mode.id.toLowerCase()}`}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                      isActive 
                        ? "bg-white/20 dark:bg-black/20" 
                        : "bg-slate-100 dark:bg-slate-700"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-semibold">{mode.label}</span>
                      <span className={cn(
                        "text-[11px]",
                        isActive ? "text-white/70 dark:text-slate-900/70" : "text-slate-400 dark:text-slate-500"
                      )}>
                        {mode.desc}
                      </span>
                    </div>

                    {isActive && (
                      <Sparkles className="h-4 w-4 text-amber-400 dark:text-amber-500 fill-amber-400 dark:fill-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
