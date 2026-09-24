import fs from "fs"
import { cert, initializeApp } from "firebase-admin/app"

// Prod: FIREBASE_SERVICE_ACCOUNT holds the JSON key as a string.
// Local dev: falls back to a key file (never baked into images or git).
const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  }

  const keyPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    new URL("../serviceAccountKey.json", import.meta.url)

  return JSON.parse(fs.readFileSync(keyPath, "utf8"))
}

export const app = initializeApp({
  credential: cert(loadServiceAccount())
});
