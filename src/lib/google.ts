import { OAuth2Client } from "google-auth-library";

function getRedirectUri() {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.APP_URL}/api/auth/google/callback`
  );
}

export function getGoogleOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
}

export function getGoogleAuthUrl() {
  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });
}

export async function exchangeCodeForGoogleProfile(code: string) {
  const client = getGoogleOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new Error("Google did not return an id_token");
  }
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Google token did not include an email");
  }
  return {
    email: payload.email,
    emailVerified: !!payload.email_verified,
    googleId: payload.sub,
    name: payload.name,
  };
}
