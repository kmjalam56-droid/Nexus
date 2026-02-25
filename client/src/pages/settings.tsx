import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Palette, Bell, Zap, Globe, Monitor, Sun, Moon, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/contexts/theme-context";
import { HamburgerButton, AppSidebar } from "@/components/app-sidebar";
import { ParticlesBackground } from "@/components/particles-background";
import { cn } from "@/lib/utils";

export default function SettingsPage({ isPopup, onClose }: { isPopup?: boolean; onClose?: () => void }) {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true,
  });

  const handleBack = () => {
    if (isPopup && onClose) {
      onClose();
    } else {
      setLocation("/");
    }
  };

  return (
    <div className={cn("min-h-full relative", isPopup ? "bg-transparent h-full flex flex-col" : "bg-slate-50 dark:bg-slate-950 min-h-screen")}>
      {!isPopup && <ParticlesBackground />}
      {!isPopup && <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 border-b backdrop-blur-xl shrink-0",
        isPopup 
          ? "border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900" 
          : "border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950/30"
      )}>
        <div className="flex items-center gap-2 px-6 py-2">
          {!isPopup && <HamburgerButton onClick={() => setSidebarOpen(true)} />}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-6 w-6 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-transparent"
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Settings</span>
        </div>
      </header>

      {/* Content */}
      <main className={cn("mx-auto w-full max-w-3xl px-4 py-8 space-y-6 relative z-10", !isPopup && "flex-1")}>
        {/* Appearance Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-slate-500" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how Nexus looks on your device</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium text-slate-900 dark:text-white">Theme</Label>
              <div className="grid grid-cols-3 gap-4">
                {/* Light Theme Option */}
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:border-slate-300 dark:hover:border-slate-600",
                    theme === "light" 
                      ? "border-slate-900 dark:border-white bg-white dark:bg-slate-800" 
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                  )}
                  data-testid="theme-light"
                >
                  {/* Preview */}
                  <div className="w-full aspect-video rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                    <div className="h-3 bg-white border-b border-slate-200 flex items-center px-2 gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="p-2 space-y-1.5">
                      <div className="h-2 w-3/4 bg-slate-200 rounded" />
                      <div className="h-2 w-1/2 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Light</span>
                  </div>
                  {theme === "light" && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-slate-900 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>

                {/* Dark Theme Option */}
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:border-slate-300 dark:hover:border-slate-600",
                    theme === "dark" 
                      ? "border-slate-900 dark:border-white bg-white dark:bg-slate-800" 
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                  )}
                  data-testid="theme-dark"
                >
                  {/* Preview */}
                  <div className="w-full aspect-video rounded-lg bg-slate-800 border border-slate-700 overflow-hidden">
                    <div className="h-3 bg-slate-900 border-b border-slate-700 flex items-center px-2 gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    </div>
                    <div className="p-2 space-y-1.5">
                      <div className="h-2 w-3/4 bg-slate-700 rounded" />
                      <div className="h-2 w-1/2 bg-slate-700 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Dark</span>
                  </div>
                  {theme === "dark" && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-white flex items-center justify-center">
                      <Check className="h-3 w-3 text-slate-900" />
                    </div>
                  )}
                </button>

                {/* Neon Theme Option */}
                <button
                  onClick={() => setTheme("neon")}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:border-cyan-400",
                    theme === "neon" 
                      ? "border-cyan-400 bg-gradient-to-br from-purple-900/50 to-cyan-900/50 shadow-lg shadow-cyan-500/30" 
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                  )}
                  data-testid="theme-neon"
                >
                  {/* Preview */}
                  <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-purple-900 to-slate-900 border border-cyan-500/50 overflow-hidden">
                    <div className="h-3 bg-slate-900 border-b border-cyan-500/30 flex items-center px-2 gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                    </div>
                    <div className="p-2 space-y-1.5">
                      <div className="h-2 w-3/4 bg-gradient-to-r from-pink-500 to-purple-500 rounded" />
                      <div className="h-2 w-1/2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Neon</span>
                  </div>
                  {theme === "neon" && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-slate-500" />
              Notifications
            </CardTitle>
            <CardDescription>Choose what updates you want to receive</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Email Notifications</p>
                <p className="text-xs text-slate-500">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                data-testid="switch-email-notifications"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Push Notifications</p>
                <p className="text-xs text-slate-500">Receive browser push notifications</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                data-testid="switch-push-notifications"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Product Updates</p>
                <p className="text-xs text-slate-500">Get notified about new features</p>
              </div>
              <Switch
                checked={notifications.updates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
                data-testid="switch-product-updates"
              />
            </div>
          </CardContent>
        </Card>

        {/* Integrations Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-slate-500" />
              Integrations
            </CardTitle>
            <CardDescription>Connect Nexus with your favorite tools</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No integrations available yet</p>
              <p className="text-xs mt-1">Coming soon</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
