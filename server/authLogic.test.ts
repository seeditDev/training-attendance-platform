import { describe, expect, it } from "vitest";

/**
 * Test authentication logic for hardcoded admin credentials
 */
describe("Authentication Logic", () => {
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin123";

  function validateCredentials(username: string, password: string): boolean {
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  }

  it("should accept correct admin credentials", () => {
    const result = validateCredentials("admin", "admin123");
    expect(result).toBe(true);
  });

  it("should reject incorrect username", () => {
    const result = validateCredentials("wronguser", "admin123");
    expect(result).toBe(false);
  });

  it("should reject incorrect password", () => {
    const result = validateCredentials("admin", "wrongpassword");
    expect(result).toBe(false);
  });

  it("should reject empty credentials", () => {
    const result = validateCredentials("", "");
    expect(result).toBe(false);
  });

  it("should be case-sensitive for username", () => {
    const result = validateCredentials("Admin", "admin123");
    expect(result).toBe(false);
  });

  it("should be case-sensitive for password", () => {
    const result = validateCredentials("admin", "Admin123");
    expect(result).toBe(false);
  });
});
