import fs from "fs";
import path from "path";

import { fetchFromDb, fetchFromRapid } from "./index.js";
import { normalizeInstagram } from "./normalize.js";
import { Profile } from "../../models/Profile.js";
import { Post } from "../../models/Post.js";

function readDemoFile() {
  try {
    var demoPath = path.join(process.cwd(), "ig_result.json"); // בתוך /server
    if (!fs.existsSync(demoPath)) return null;
    var raw = fs.readFileSync(demoPath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.log("[Demo] Failed to read ig_result.json:", e && e.message);
    return null;
  }
}

// DB by default (אבל רק אם יש MONGODB_URI)
export async function getInstagramPayload(username, { mode = "Auto" } = {}) {
  if (!username || typeof username !== "string") return { ok: false, error: "username_required" };
  const clean = username.trim();
  if (!clean) return { ok: false, error: "username_required" };

  const hasMongo = Boolean(process.env.MONGODB_URI);

  // ✅ אם אין Mongo בכלל – חוזרים לדמו ולא נוגעים ב-DB
  if (!hasMongo) {
    const demo = readDemoFile();
    if (demo && demo.profile) {
      return {
        ok: true,
        source: "demo",
        profile: { ...demo.profile, username: clean },
        posts: Array.isArray(demo.posts) ? demo.posts : [],
        metrics: demo.metrics || {},
        meta: { source: "demo" }
      };
    }

    return {
      ok: true,
      source: "demo",
      profile: { username: clean, full_name: clean, bio: "" },
      posts: [],
      metrics: { followers_count: null, following_count: null },
      meta: { source: "demo" }
    };
  }

  // ---- מכאן זה אותו קוד של מאי (כשיש Mongo) ----

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
        normalized.posts.map((p) => ({
          updateOne: {
            filter: { platform: "instagram", username: clean, post_id: p.id },
            update: { $set: { ...p, post_id: p.id, platform: "instagram", username: clean } },
            upsert: true,
          },
        }))
      );
    }
  } catch {
    db_saved = false;
  }

  return { ok: true, source: "rapid", ...normalized, meta: { source: "rapid", db_saved } };
}
