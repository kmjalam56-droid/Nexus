import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, User, Mail, CreditCard, LogIn, LogOut, Save, AtSign, ChevronLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { HamburgerButton, AppSidebar } from "@/components/app-sidebar";
import { ParticlesBackground } from "@/components/particles-background";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { useUpload } from "@/hooks/use-upload";

import { cn } from "@/lib/utils";

export default function AccountPage({ isPopup, onClose }: { isPopup?: boolean; onClose?: () => void }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { t } = useLanguage();

  const handleBack = () => {
    if (isPopup && onClose) {
      onClose();
    } else {
      setLocation("/");
    }
  };
  
  const { uploadFile } = useUpload({
    onSuccess: async (response) => {
      try {
        const res = await fetch("/api/auth/user/profile-image", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileImageUrl: response.objectPath }),
          credentials: "include",
        });
        if (res.ok) {
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          toast({ title: "Profile picture updated!" });
        }
      } catch (error) {
        toast({ title: "Failed to save profile picture", variant: "destructive" });
      } finally {
        setIsUploadingImage(false);
      }
    },
    onError: () => {
      toast({ title: "Failed to upload image", variant: "destructive" });
      setIsUploadingImage(false);
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    
    setIsUploadingImage(true);
    await uploadFile(file);
  };

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
    }
  }, [user]);

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/user/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update username");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Username updated",
        description: "Your username has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("account.title")}</span>
        </div>
      </header>

      {/* Content */}
      <main className={cn("mx-auto w-full max-w-3xl px-4 py-8 space-y-6 relative z-10", !isPopup && "flex-1")}>
        {/* Profile Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          {isLoading ? (
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </CardContent>
          ) : !isAuthenticated ? (
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <User className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">{t("account.notLoggedIn")}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t("account.loginToAccess")}</p>
                </div>
                <Button 
                  onClick={() => window.location.href = "/auth"}
                  className="mt-2 gap-2 bg-gradient-to-r from-green-500 to-emerald-500"
                  data-testid="button-login"
                >
                  <LogIn className="h-4 w-4" />
                  {t("button.login")}
                </Button>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    data-testid="input-profile-image"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="relative group cursor-pointer"
                    data-testid="button-change-avatar"
                  >
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt={username || "User"} 
                        className="h-16 w-16 rounded-full shadow-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                        {(username || user?.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploadingImage ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </div>
                  </button>
                  <div>
                    <CardTitle className="text-xl">{username || user?.email?.split("@")[0] || "User"}</CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                    <p className="text-xs text-slate-400 mt-1">Tap avatar to change photo</p>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <AtSign className="h-3.5 w-3.5" />
                      {t("account.username")}
                    </Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t("account.username")}
                      className="bg-white dark:bg-slate-800"
                      data-testid="input-username"
                    />
                    <p className="text-xs text-slate-500">{t("account.chooseDisplayName")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail className="h-3.5 w-3.5" />
                      {t("account.email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-slate-50 dark:bg-slate-800 opacity-70"
                      data-testid="input-email"
                    />
                    <p className="text-xs text-slate-500">{t("account.managedByGoogle")}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    onClick={handleSaveUsername}
                    disabled={isSaving}
                    className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 button-animate"
                    data-testid="button-save-username"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? t("account.saving") : t("account.saveUsername")}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = "/api/logout"}
                    className="gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 button-animate"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("button.logout")}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Billing Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-slate-500" />
              {t("account.billing")}
            </CardTitle>
            <CardDescription>{t("account.manageBilling")}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("account.freePlan")}</p>
                  <p className="text-xs text-slate-500">{t("account.basicAccess")}</p>
                </div>
                <Button variant="default" size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700" data-testid="button-upgrade">
                  {t("account.upgradePro")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
