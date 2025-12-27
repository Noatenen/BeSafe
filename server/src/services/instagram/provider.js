import { fetchFromDb, fetchFromRapid } from "./index.js";


//DB by deafult
export async function getInstagramPayload(username, { mode = "db" } = {}) {
  if (!username || typeof username !== "string") {
    return { ok: false, error: "username_required" };
  }

  const clean = username.trim();
  if (!clean) return { ok: false, error: "username_required" };

  // 1) DB-only
  if (mode === "db") {
    const db = await fetchFromDb(clean);
    if (!db?.ok) return { ok: false, error: "db_miss" };
    return { ok: true, source: "db", ...db };
  }

  // 2) Rapid-only
  if (mode === "rapid") {
    const rapid = await fetchFromRapid(clean);
    if (!rapid?.ok) return { ok: false, error: "rapid_failed", details: rapid };
    return { ok: true, source: "rapid", ...rapid };
  }

  // 3) Auto: DB -> Rapid
  const db = await fetchFromDb(clean);
  if (db?.ok) return { ok: true, source: "db", ...db };

  const rapid = await fetchFromRapid(clean);
  if (!rapid?.ok) return { ok: false, error: "rapid_failed", details: rapid };
  return { ok: true, source: "rapid", ...rapid };
}