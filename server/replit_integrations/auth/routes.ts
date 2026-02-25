import type { Express } from "express";
import { authStorage } from "./storage";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get Google Client ID for frontend
  app.get("/api/auth/google-client-id", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    res.json({ clientId });
  });
  // Get current authenticated user - returns null if not authenticated
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Check if user is authenticated via session
      if (!req.session?.userId) {
        return res.json(null);
      }
      
      const userId = req.session.userId;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.json(null);
      }
      
      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update username
  app.patch("/api/auth/user/username", async (req: any, res) => {
    try {
      // Check if user is authenticated via session
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { username } = req.body;
      if (!username || typeof username !== "string" || username.trim().length === 0) {
        return res.status(400).json({ message: "Username is required" });
      }

      const userId = req.session.userId;
      const user = await authStorage.updateUsername(userId, username.trim());
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({ message: "Failed to update username" });
    }
  });

  // Update profile image
  app.patch("/api/auth/user/profile-image", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { profileImageUrl } = req.body;
      if (!profileImageUrl || typeof profileImageUrl !== "string") {
        return res.status(400).json({ message: "Profile image URL is required" });
      }

      const userId = req.session.userId;
      const user = await authStorage.updateProfileImage(userId, profileImageUrl);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });
}
