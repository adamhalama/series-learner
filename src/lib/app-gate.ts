const encoder = new TextEncoder();

export const APP_GATE_COOKIE_NAME = "series_learner_gate";
export const APP_GATE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

let cachedSecret = "";
let cachedKeyPromise: Promise<CryptoKey> | null = null;

const isHex = (value: string) => /^[a-f0-9]+$/i.test(value);

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const timingSafeStringEqual = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
};

const getGateSecret = () => {
  const secret = process.env.APP_GATE_SECRET?.trim();
  if (!secret) {
    throw new Error("APP_GATE_SECRET is required when APP_GATE_PASSWORD is enabled.");
  }
  return secret;
};

const getSigningKey = async () => {
  const secret = getGateSecret();

  if (cachedKeyPromise && cachedSecret === secret) {
    return cachedKeyPromise;
  }

  cachedSecret = secret;
  cachedKeyPromise = crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  return cachedKeyPromise;
};

const signPayload = async (payload: string) => {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(new Uint8Array(signature));
};

const randomHex = (byteLength: number) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
};

export const isAppGateEnabled = () =>
  Boolean(process.env.APP_GATE_PASSWORD?.trim());

export const assertAppGateConfiguration = () => {
  if (!isAppGateEnabled()) {
    return;
  }

  void getGateSecret();
};

export const sanitizeNextPath = (rawPath: string | null | undefined) => {
  if (!rawPath || !rawPath.startsWith("/") || rawPath.startsWith("//")) {
    return "/";
  }

  if (rawPath.startsWith("/unlock")) {
    return "/";
  }

  return rawPath;
};

export const createAppGateToken = async (issuedAt = Date.now()) => {
  const expiresAt = issuedAt + APP_GATE_SESSION_TTL_SECONDS * 1000;
  const nonce = randomHex(16);
  const payload = `${expiresAt}.${nonce}`;
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
};

export const verifyAppGateToken = async (
  token: string | null | undefined,
  now = Date.now(),
) => {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [expiresAtRaw, nonce, signatureRaw] = parts;
  if (!/^\d+$/.test(expiresAtRaw)) {
    return false;
  }

  if (nonce.length !== 32 || !isHex(nonce)) {
    return false;
  }

  const signature = signatureRaw.toLowerCase();
  if (signature.length !== 64 || !isHex(signature)) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return false;
  }

  const expectedSignature = await signPayload(`${expiresAtRaw}.${nonce}`);
  return timingSafeStringEqual(expectedSignature, signature);
};
