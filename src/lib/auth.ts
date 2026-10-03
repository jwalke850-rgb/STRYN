export const AUTH_COOKIE = "stryn_operator";

/** Cookie token derived from the operator password; rotating the password logs everyone out. */
export async function authToken(password: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`stryn-operator:${password}`));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}
