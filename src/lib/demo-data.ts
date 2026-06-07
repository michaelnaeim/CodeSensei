import type { Repo, Specialization, Topic } from "@/types";

export const DEMO_USER = {
  name: "Alex Chen",
  username: "alexchen",
  avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=alexchen",
};

export const DEMO_REPOS: Repo[] = [
  {
    id: "chromium",
    name: "chromium",
    fullName: "chromium/chromium",
    description: "The open-source browser project behind Google Chrome — 50M+ lines of code",
    language: "C++",
    stars: 21000,
    isPrivate: false,
    owner: "chromium",
  },
  {
    id: "auth-service",
    name: "auth-service",
    fullName: "alexchen/auth-service",
    description: "Production JWT authentication microservice with OAuth2 flows",
    language: "TypeScript",
    stars: 1247,
    isPrivate: true,
    owner: "alexchen",
  },
  {
    id: "next-js",
    name: "next.js",
    fullName: "vercel/next.js",
    description: "The React Framework for the Web",
    language: "JavaScript",
    stars: 128000,
    isPrivate: false,
    owner: "vercel",
  },
  {
    id: "react",
    name: "react",
    fullName: "facebook/react",
    description: "The library for web and native user interfaces",
    language: "JavaScript",
    stars: 230000,
    isPrivate: false,
    owner: "facebook",
  },
];

export const SPECIALIZATIONS: Record<string, Specialization[]> = {
  chromium: [
    {
      id: "authentication",
      title: "Authentication",
      description: "OAuth2, token validation, and sign-in flows across Chromium",
      icon: "shield",
      fileCount: 12,
      mastery: 0,
      status: "not_started",
    },
    {
      id: "networking",
      title: "Networking",
      description: "HTTP stack, TLS, and request handling",
      icon: "layers",
      fileCount: 24,
      mastery: 0,
      status: "not_started",
    },
    {
      id: "rendering",
      title: "Rendering",
      description: "Blink layout engine and paint pipeline",
      icon: "zap",
      fileCount: 18,
      mastery: 0,
      status: "not_started",
    },
    {
      id: "sandbox",
      title: "Sandbox",
      description: "Process isolation and security boundaries",
      icon: "lock",
      fileCount: 8,
      mastery: 0,
      status: "not_started",
    },
  ],
  "auth-service": [
    {
      id: "authentication",
      title: "Authentication",
      description: "JWT tokens, session validation, and login flows",
      icon: "shield",
      fileCount: 3,
      mastery: 0,
      status: "not_started",
    },
    {
      id: "authorization",
      title: "Authorization",
      description: "RBAC, permission checks, and policy enforcement",
      icon: "lock",
      fileCount: 2,
      mastery: 0,
      status: "not_started",
    },
    {
      id: "oauth",
      title: "OAuth2",
      description: "GitHub & Google provider integrations",
      icon: "key",
      fileCount: 4,
      mastery: 0,
      status: "not_started",
    },
    {
      id: "middleware",
      title: "Middleware",
      description: "Request guards, rate limiting, and CORS",
      icon: "layers",
      fileCount: 2,
      mastery: 0,
      status: "not_started",
    },
  ],
  "next-js": [
    {
      id: "routing",
      title: "App Router",
      description: "File-based routing and layouts",
      icon: "route",
      fileCount: 5,
      mastery: 0,
      status: "not_started",
    },
    {
      id: "rendering",
      title: "Rendering",
      description: "SSR, SSG, and streaming patterns",
      icon: "zap",
      fileCount: 4,
      mastery: 0,
      status: "not_started",
    },
  ],
  "react": [
    {
      id: "hooks",
      title: "Hooks",
      description: "useState, useEffect, and custom hooks",
      icon: "hook",
      fileCount: 6,
      mastery: 0,
      status: "not_started",
    },
  ],
};

const AUTH_SOURCE = `import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY = '24h';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = header.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = payload;
  next();
}`;

export const TOPICS: Record<string, Topic> = {
  authentication: {
    id: "authentication",
    repoId: "auth-service",
    title: "Authentication",
    description: "Learn how this codebase handles user authentication end-to-end.",
    files: [
      {
        id: "jwt-middleware",
        path: "src/middleware/auth.ts",
        title: "JWT Auth Middleware",
        language: "typescript",
        sourceCode: AUTH_SOURCE,
        lesson: {
          summary:
            "This file implements the core JWT authentication layer. You'll learn how tokens are signed, verified, and enforced on incoming requests.",
          estimatedMinutes: 15,
          objectives: [
            { id: "o1", text: "Understand JWT signing with secret keys and expiry" },
            { id: "o2", text: "Trace the Bearer token extraction from HTTP headers" },
            { id: "o3", text: "Explain why failed verification returns 401, not 500" },
            { id: "o4", text: "Identify where user context attaches to the request" },
          ],
          concepts: [
            {
              title: "JSON Web Tokens",
              description:
                "Self-contained tokens encoding user identity. Signed with a server secret so tampering is detectable.",
            },
            {
              title: "Bearer Authentication",
              description:
                "Standard HTTP scheme: client sends `Authorization: Bearer <token>`. Middleware extracts and validates before route handlers run.",
            },
            {
              title: "Fail-closed security",
              description:
                "Missing or invalid tokens immediately reject the request. Never silently proceed as anonymous when auth is required.",
            },
          ],
        },
        flashcards: [
          {
            id: "f1",
            front: "What HTTP header carries JWT tokens in this codebase?",
            back: "Authorization header with Bearer scheme: `Authorization: Bearer <token>`",
          },
          {
            id: "f2",
            front: "What happens when jwt.verify() throws an error?",
            back: "verifyToken() catches it and returns null, causing the middleware to respond with 401 Invalid token.",
          },
          {
            id: "f3",
            front: "Why use expiresIn when signing tokens?",
            back: "Limits blast radius if a token is stolen. Stolen tokens become useless after expiry without server-side revocation.",
          },
          {
            id: "f4",
            front: "Where does authenticated user data become available to route handlers?",
            back: "On req.user after authMiddleware successfully verifies the token and attaches the AuthPayload.",
          },
        ],
        notes: [
          { line: 1, text: "jsonwebtoken library handles signing and verification" },
          { line: 5, text: "Secret from env — never hardcode in source" },
          { line: 6, text: "24h expiry balances security vs. re-login friction" },
          { line: 14, text: "signToken: called at login to issue credentials" },
          { line: 18, text: "verifyToken: returns null on any failure (fail-safe)" },
          { line: 25, text: "Middleware runs before every protected route" },
          { line: 28, text: "Checks Bearer prefix — rejects malformed headers early" },
          { line: 32, text: "Slice(7) strips 'Bearer ' prefix (7 chars)" },
          { line: 35, text: "Null payload → 401, not 403 (not authenticated vs. forbidden)" },
          { line: 39, text: "Attach payload to req.user for downstream handlers" },
        ],
        challenge: {
          id: "c1",
          title: "Implement Token Refresh Check",
          description:
            "Write a function that checks if a JWT payload was issued more than 12 hours ago and should be refreshed. Use the `iat` (issued at) claim from the decoded token.",
          input: 'token issued 13 hours ago, current time now',
          expectedOutput: "true (needs refresh)",
          starterCode: `function shouldRefreshToken(decoded: { iat: number }): boolean {
  const TWELVE_HOURS = 12 * 60 * 60;
  // Your code here
}`,
          pseudocodeHint: `1. Get current Unix timestamp
2. Calculate age = now - decoded.iat
3. Return true if age > 12 hours in seconds`,
          hints: [
            "iat is in seconds since Unix epoch",
            "Compare against 12 * 60 * 60 seconds",
            "Date.now() returns milliseconds — divide by 1000",
          ],
        },
        quiz: [
          {
            id: "q1",
            question: "What status code does authMiddleware return for a missing token?",
            options: ["200 OK", "401 Unauthorized", "403 Forbidden", "500 Internal Server Error"],
            correctIndex: 1,
            explanation: "401 indicates the client hasn't authenticated. 403 would mean authenticated but not permitted.",
          },
          {
            id: "q2",
            question: "Why does verifyToken return null instead of throwing?",
            options: [
              "Performance optimization",
              "Cleaner middleware flow without try/catch at call site",
              "JWT library requirement",
              "To hide errors from attackers",
            ],
            correctIndex: 1,
            explanation: "Returning null lets middleware handle auth failure uniformly with a single if-check.",
          },
          {
            id: "q3",
            question: "What is stored in req.user after successful auth?",
            options: [
              "Raw JWT string",
              "Database user record",
              "Decoded AuthPayload (userId, email, role)",
              "Session ID",
            ],
            correctIndex: 2,
            explanation: "The decoded AuthPayload interface defines userId, email, and role attached to the request.",
          },
        ],
      },
    ],
  },
};

export function getRepo(id: string) {
  return DEMO_REPOS.find((r) => r.id === id);
}

export function getSpecializations(repoId: string) {
  return SPECIALIZATIONS[repoId] ?? [];
}

export function getTopic(topicId: string) {
  return TOPICS[topicId];
}
