import { fetchFromDb, fetchFromRapid } from "./index.js";
import { normalizeInstagram } from "./normalize.js";
import { Profile } from "../../models/Profile.js";
import { Post } from "../../models/Post.js";


//DB by deafult
export async function getInstagramPayload(username, { mode = "db" } = {}) {
  if (!username || typeof username !== "string") return { ok: false, error: "username_required" };
  const clean = username.trim();
  if (!clean) return { ok: false, error: "username_required" };

  // DB-only
  if (mode === "db") {
    const db = await fetchFromDb(clean);
    if (!db?.ok) return { ok: false, error: "db_miss" };
    return { ok: true, source: "db", ...db };
  }

  // Rapid-only
  if (mode === "rapid") {
    return await fetchNormalizeAndSave(clean);
  }

  // Auto: DB -> Rapid
  const db = await fetchFromDb(clean);
  if (db?.ok) return { ok: true, source: "db", ...db };

  return await fetchNormalizeAndSave(clean);
}

async function fetchNormalizeAndSave(clean) {
  const rapid = await fetchFromRapid(clean);
  if (!rapid?.ok) return { ok: false, error: "rapid_failed", details: rapid };

  const normalized = normalizeInstagram(rapid.results, clean);

  let db_saved = true;
  try {
    await Profile.updateOne(
      { platform: "instagram", username: clean },
      { $set: { ...normalized.profile, platform: "instagram", username: clean, metrics: normalized.metrics } },
      { upsert: true }
    );

    if (normalized.posts.length) {
      await Post.bulkWrite(
        normalized.posts.map(p => ({
          updateOne: {
            filter: { platform: "instagram", username: clean, post_id: p.id },
            update: { $set: { ...p, post_id: p.id, platform: "instagram", username: clean } },
            upsert: true
          }
        }))
      );
    }
  } catch {
    db_saved = false;
  }

  return { ok: true, source: "rapid", ...normalized, meta: { source: "rapid", db_saved } };
}
