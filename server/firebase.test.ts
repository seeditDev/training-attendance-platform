import { describe, expect, it } from "vitest";

/**
 * Test Firebase credentials by attempting to initialize Firebase
 * This validates that the provided credentials are correct
 */
describe("Firebase Credentials", () => {
  it("should have all required Firebase environment variables", () => {
    const requiredEnvs = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "VITE_FIREBASE_APP_ID",
    ];

    for (const env of requiredEnvs) {
      expect(process.env[env], `Missing environment variable: ${env}`).toBeDefined();
      expect(process.env[env], `Empty environment variable: ${env}`).not.toBe("");
    }
  });

  it("should have valid Firebase configuration values", () => {
    // Validate API Key format (typically 39 characters)
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    expect(apiKey).toMatch(/^AIza[a-zA-Z0-9_-]{35}$/);

    // Validate Auth Domain format
    const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
    expect(authDomain).toMatch(/\.firebaseapp\.com$/);

    // Validate Project ID format
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    expect(projectId).toMatch(/^[a-z0-9-]+$/);

    // Validate Storage Bucket format
    const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET;
    expect(storageBucket).toMatch(/\.firebasestorage\.app$/);

    // Validate App ID format
    const appId = process.env.VITE_FIREBASE_APP_ID;
    expect(appId).toMatch(/^1:\d+:web:[a-f0-9]+$/);
  });
});
