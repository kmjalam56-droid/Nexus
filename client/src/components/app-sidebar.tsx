import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  ChevronDown, 
  Search, 
  Pin, 
  PinOff, 
  Trash2, 
  Brain, 
  Sparkles, 
  Zap, 
  GitBranch, 
  Clock, 
  X,
  Menu,
  Settings,
  User,
  HelpCircle,
  Info,
  Cpu,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/contexts/conversation-context";
import { useMode } from "@/contexts/mode-context";
import { ThinkingMode as Mode } from "@/lib/types";
import { useLanguage } from "@/contexts/language-context";
import { useLocation } from "wouter";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="h-10 w-10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
    >
      <div className="flex flex-col gap-1 items-center justify-center">
        <span className="w-5 h-0.5 bg-current rounded-full transition-all group-hover:w-6" />
        <span className="w-5 h-0.5 bg-current rounded-full transition-all" />
        <span className="w-5 h-0.5 bg-current rounded-full transition-all group-hover:w-4" />
      </div>
    </Button>
  );
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { 
    conversations, 
    currentConversationId, 
    selectConversation, 
    startNewConversation,
    deleteConversation,
    isLoading
  } = useConversation();
  const { currentMode, setMode } = useMode();
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [chatsExpanded, setChatsExpanded] = useState(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModeChange = (mode: Mode) => {
    setMode(mode);
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    if (onClose) onClose();
  };

  const modes: { id: Mode; labelKey: string; icon: any }[] = [
    { id: "NORMAL" as Mode, labelKey: "mode.DEFAULT.label", icon: Sparkles },
    { id: "WHAT_IF" as Mode, labelKey: "mode.WHAT_IF.label", icon: Zap },
    { id: "CHAIN_REACTION" as Mode, labelKey: "mode.CHAIN_REACTION.label", icon: GitBranch },
    { id: "PARALLEL_TIMELINES" as Mode, labelKey: "mode.PARALLEL_TIMELINES.label", icon: Clock },
  ];

  const personas = [
    { id: "default", name: "Default", icon: Sparkles, desc: "Standard AI behavior" },
    { id: "analytical", name: "Analytical", icon: Brain, desc: "Logic & data focused" },
    { id: "creative", name: "Creative", icon: Zap, desc: "Imaginative & expressive" },
    { id: "practical", name: "Practical", icon: Cpu, desc: "Efficient & actionable" },
    { id: "critical", name: "Critical", icon: Info, desc: "Evaluative & rigorous" },
  ];

  const spaces = [
    { id: "personal", name: "Personal Space", icon: User },
    { id: "team-alpha", name: "Team Alpha", icon: MessageSquare },
  ];

  const [currentPersona, setCurrentPersona] = useState("default");
  const [spacesExpanded, setSpacesExpanded] = useState(false);
  const [personasExpanded, setPersonasExpanded] = useState(false);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden border-r border-slate-200/50 dark:border-slate-800/50">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto pt-20 pb-4 scrollbar-hide">
        {/* Your Chats - Collapsible */}
        <div className="px-3 mb-4">
          <button
            onClick={() => setChatsExpanded(!chatsExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
              chatsExpanded 
                ? "bg-white dark:bg-slate-800 shadow-md text-blue-600 dark:text-blue-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                chatsExpanded ? "bg-blue-50 dark:bg-blue-900/20" : "bg-slate-50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-700"
              )}>
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">{t("sidebar.yourChats")}</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300 opacity-50",
              chatsExpanded && "rotate-180 opacity-100"
            )} />
          </button>

          <AnimatePresence>
            {chatsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mt-2 space-y-1 px-1"
              >
                {/* Search in sidebar */}
                <div className="px-1 mb-3">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search Chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* All Chats */}
                {isLoading ? (
                  <div className="space-y-2 px-1 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 w-full bg-white dark:bg-slate-800 rounded-xl" />
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <p className="px-4 py-3 text-[11px] text-slate-400 italic text-center bg-white/50 dark:bg-slate-800/30 rounded-xl">
                    No conversations yet
                  </p>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all cursor-pointer border border-transparent",
                        currentConversationId === conversation.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50 shadow-sm"
                          : "hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-sm"
                      )}
                    >
                      <button
                        onClick={() => {
                          selectConversation(conversation.id);
                          handleNavigation("/");
                        }}
                        className={cn(
                          "flex-1 text-left truncate text-xs font-semibold transition-colors",
                          currentConversationId === conversation.id
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                        )}
                      >
                        {conversation.title}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conversation.id); }} 
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collaborative Spaces */}
        <div className="px-3 mb-4">
          <button
            onClick={() => setSpacesExpanded(!spacesExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
              spacesExpanded 
                ? "bg-white dark:bg-slate-800 shadow-md text-emerald-600 dark:text-emerald-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                spacesExpanded ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-slate-50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-700"
              )}>
                <Layers className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Collab Spaces</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300 opacity-50",
              spacesExpanded && "rotate-180 opacity-100"
            )} />
          </button>

          <AnimatePresence>
            {spacesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 space-y-1 px-1"
              >
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 group"
                  >
                    <space.icon className="h-4 w-4 opacity-70 group-hover:opacity-100" />
                    <span className="text-xs font-bold">{space.name}</span>
                  </button>
                ))}
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold uppercase">New Space</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expert Personas as Mode */}
        <div className="px-3 mb-4">
          <button
            onClick={() => setPersonasExpanded(!personasExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group",
              personasExpanded 
                ? "bg-white dark:bg-slate-800 shadow-md text-indigo-600 dark:text-indigo-400" 
                : "text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                personasExpanded ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-slate-50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-700"
              )}>
                <Zap className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Modes</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300 opacity-50",
              personasExpanded && "rotate-180 opacity-100"
            )} />
          </button>

          <AnimatePresence>
            {personasExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 space-y-1 px-1"
              >
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => setCurrentPersona(persona.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border",
                      currentPersona === persona.id
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                    )}
                  >
                    <persona.icon className="h-3.5 w-3.5 shrink-0" />
                    <div className="text-left">
                      <div className="text-[11px] font-bold leading-none">{persona.name}</div>
                      <div className="text-[9px] opacity-70 truncate">{persona.desc}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Section - About, Settings, Account */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-900/30">
        <div className="space-y-1">
          {/* About Section - Collapsible in Footer */}
          <button
            onClick={() => setAboutExpanded(!aboutExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300",
              aboutExpanded 
                ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm" 
                : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Info className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">About</span>
            </div>
            <ChevronDown className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              aboutExpanded && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {aboutExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="mt-1 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {/* Conversation Info */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Conversation Info</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Conversation Name</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{currentConversation?.title || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Conversation ID</span>
                        <span className="text-[10px] font-mono text-slate-500">{String(currentConversationId || "N/A").slice(0, 8)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Created By</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">You</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Status</span>
                        <span className="text-[10px] font-bold text-green-500">Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Priority</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Normal</span>
                      </div>
                      <div className="pt-1">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Tags / Labels</span>
                        <div className="flex gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-bold">AI</span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[9px] font-bold">Chat</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-700" />

                  {/* AI Information */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-wider">AI Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">AI Model</span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block">Nexus AI</span>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Powered By</span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block">Apsa AI</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Model Version</span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block">2.1.0</span>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Response Time</span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 block">~1.2s</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-700" />

                  {/* Statistics */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Statistics</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">AI Response</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{(currentConversation as any)?.messages?.filter((m: any) => m.role === 'assistant').length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Your Message</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{(currentConversation as any)?.messages?.filter((m: any) => m.role === 'user').length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Image Generate</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Video Generate</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400">Total Element</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-1 mt-2">
            <button
              onClick={() => {
                if (onClose) onClose();
                window.dispatchEvent(new CustomEvent('nexus-open-settings'));
              }}
              className="flex items-center gap-2 justify-center px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/50 dark:border-slate-700/50 transition-all shadow-sm"
            >
              <Settings className="h-3 w-3" />
              <span className="text-[10px] font-semibold">Settings</span>
            </button>
            <button
              onClick={() => {
                if (onClose) onClose();
                window.dispatchEvent(new CustomEvent('nexus-open-account'));
              }}
              className="flex items-center gap-2 justify-center px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200/50 dark:border-slate-700/50 transition-all shadow-sm"
            >
              <User className="h-3 w-3" />
              <span className="text-[10px] font-semibold">Account</span>
            </button>
          </div>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Tutorial button clicked");
              window.dispatchEvent(new CustomEvent('nexus-trigger-tutorial'));
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 group"
          >
            <HelpCircle className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span className="text-xs font-bold uppercase tracking-wider">Tutorial</span>
          </button>
        </div>
      </div>
    </div>
  );
}
