import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export type FirebaseUser = {
  uid: string;
  email?: string;
};

/** Valida Firebase ID token (Bearer). */
export async function verifyFirebaseIdToken(
  authorization: string | null,
  projectId: string,
): Promise<FirebaseUser> {
  if (!authorization?.startsWith("Bearer ")) {
    throw new AuthError("Missing Bearer token");
  }
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) throw new AuthError("Empty Bearer token");

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const uid = typeof payload.sub === "string" ? payload.sub : "";
  if (!uid) throw new AuthError("Token sem uid");

  return {
    uid,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
