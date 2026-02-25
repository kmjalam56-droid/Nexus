import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { authStorage } from "./storage";
import { OAuth2Client } from "google-auth-library";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (!stored || !stored.includes(".")) {
    return false;
  }
  const [hashedPassword, salt] = stored.split(".");
  if (!hashedPassword || !salt) {
    return false;
  }
  try {
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  } catch {
    return false;
  }
}

export function getSession() {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Signup endpoint
  app.post("/api/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await authStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await authStorage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        username: email.split("@")[0],
      });

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Google OAuth endpoint - verify Google token and login/register
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential, accessToken } = req.body;
      
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        return res.status(500).json({ message: "Google OAuth not configured" });
      }

      let email: string;
      let given_name: string | undefined;
      let family_name: string | undefined;
      let picture: string | undefined;

      if (accessToken) {
        // Handle access token flow - fetch user info from Google
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
        );
        
        if (!userInfoResponse.ok) {
          return res.status(401).json({ message: "Invalid Google access token" });
        }

        const userInfo = await userInfoResponse.json() as {
          email?: string;
          given_name?: string;
          family_name?: string;
          picture?: string;
        };

        if (!userInfo.email) {
          return res.status(401).json({ message: "Could not get email from Google" });
        }

        email = userInfo.email;
        given_name = userInfo.given_name;
        family_name = userInfo.family_name;
        picture = userInfo.picture;
      } else if (credential) {
        // Handle ID token flow (original flow)
        const client = new OAuth2Client(googleClientId);
        
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: googleClientId,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          return res.status(401).json({ message: "Invalid Google token" });
        }

        email = payload.email;
        given_name = payload.given_name;
        family_name = payload.family_name;
        picture = payload.picture;
      } else {
        return res.status(400).json({ message: "Google credential or access token is required" });
      }

      // Check if user already exists
      let user = await authStorage.getUserByEmail(email);

      if (!user) {
        // Create new user from Google account (no password needed)
        user = await authStorage.createUser({
          email,
          password: null,
          firstName: given_name || null,
          lastName: family_name || null,
          username: email.split("@")[0],
          profileImageUrl: picture || null,
        });
      } else if (picture && !user.profileImageUrl) {
        // Update profile image if user doesn't have one
        await authStorage.updateProfileImage(user.id, picture);
        user = await authStorage.getUser(user.id);
      }

      if (!user) {
        return res.status(500).json({ message: "Failed to create user" });
      }

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(401).json({ message: "Google authentication failed" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // For backwards compatibility with existing /api/logout GET
  app.get("/api/logout", (req, res) => {
    res.clearCookie("connect.sid");
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
