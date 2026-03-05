import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import crypto from "crypto";

import sgMail from "@sendgrid/mail";
import twilio from "twilio";

setGlobalOptions({ region: "us-central1" });
admin.initializeApp();

const db = admin.firestore();

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
function randCode6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function nowMs() { return Date.now(); }

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function sendEmailOtp(to: string, code: string) {
  const SENDGRID_API_KEY = requireEnv("SENDGRID_API_KEY");
  const SENDGRID_FROM = requireEnv("SENDGRID_FROM");

  sgMail.setApiKey(SENDGRID_API_KEY);

  await sgMail.send({
    to,
    from: SENDGRID_FROM,
    subject: "Your CryptoTracker verification code",
    text: `Your verification code is: ${code}\nThis code expires in 5 minutes.`,
    html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${code}</h2><p>Expires in 5 minutes.</p>`
  });
}

async function sendSmsOtp(toE164: string, code: string) {
  const TWILIO_ACCOUNT_SID = requireEnv("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = requireEnv("TWILIO_AUTH_TOKEN");
  const TWILIO_FROM = requireEnv("TWILIO_FROM");

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await client.messages.create({
    to: toE164,
    from: TWILIO_FROM,
    body: `CryptoTracker code: ${code} (expires in 5 minutes)`
  });
}

// Firestore docs:
// users/{uid} => { email, phoneE164, preferred2FA: 'email'|'phone', username, firstName, lastName }
// otp/{uid} => { codeHash, expiresAt, triesLeft, lastSentAt, method, destinationMasked }

export const startOtp = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const method = (req.data?.method as "email" | "phone") || "email";

  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) throw new HttpsError("failed-precondition", "User profile missing.");
  const user = userSnap.data() as any;

  const email = String(user.email || "");
  const phoneE164 = String(user.phoneE164 || "");

  if (method === "email" && !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Missing/invalid email.");
  }
  if (method === "phone" && !phoneE164.startsWith("+")) {
    throw new HttpsError("invalid-argument", "Missing/invalid phone.");
  }

  const otpRef = db.doc(`otp/${uid}`);
  const otpSnap = await otpRef.get();
  const otpData = otpSnap.exists ? (otpSnap.data() as any) : null;

  // Basic rate limit: at most 1 send every 25 seconds
  if (otpData?.lastSentAt && nowMs() - otpData.lastSentAt < 25000) {
    throw new HttpsError("resource-exhausted", "Please wait before requesting a new code.");
  }

  const code = randCode6();
  const expiresAt = nowMs() + 5 * 60 * 1000; // 5 min
  const codeHash = sha256(code);

  let destinationMasked = "";
  if (method === "email") {
    const parts = email.split("@");
    destinationMasked = `${parts[0].slice(0,2)}***@${parts[1]}`;
    await sendEmailOtp(email, code);
  } else {
    destinationMasked = `${phoneE164.slice(0,2)}***${phoneE164.slice(-2)}`;
    await sendSmsOtp(phoneE164, code);
  }

  await otpRef.set({
    codeHash,
    expiresAt,
    triesLeft: 5,
    lastSentAt: nowMs(),
    method,
    destinationMasked
  }, { merge: true });

  return { ok: true, method, destinationMasked, expiresAt };
});

export const verifyOtp = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const code = String(req.data?.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError("invalid-argument", "Code must be 6 digits.");
  }

  const otpRef = db.doc(`otp/${uid}`);
  const otpSnap = await otpRef.get();
  if (!otpSnap.exists) throw new HttpsError("failed-precondition", "No OTP request found.");

  const otp = otpSnap.data() as any;

  if (nowMs() > otp.expiresAt) {
    throw new HttpsError("deadline-exceeded", "Code expired.");
  }
  if (typeof otp.triesLeft === "number" && otp.triesLeft <= 0) {
    throw new HttpsError("permission-denied", "Too many attempts. Request a new code.");
  }

  const ok = sha256(code) === otp.codeHash;

  if (!ok) {
    await otpRef.set({ triesLeft: (otp.triesLeft ?? 5) - 1 }, { merge: true });
    throw new HttpsError("permission-denied", "Wrong code.");
  }

  // clear otp on success
  await otpRef.delete();

  return { ok: true };
});
