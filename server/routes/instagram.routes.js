import express from "express";
import { getInstagramPayload } from "../src/services/instagram/provider.js";
import { scoreInstagram } from "../src/services/scoring/instagram.score.js";

const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const { username, followers_count, following_count } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ ok: false, error: "username is required" });
    }
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return res.status(400).json({ ok: false, error: "username is required" });
    }

    const followers =
      followers_count === "" || followers_count == null ? null : Number(followers_count);
    const following =
      following_count === "" || following_count == null ? null : Number(following_count);

    if (followers != null && (!Number.isFinite(followers) || followers < 0)) {
      return res
        .status(400)
        .json({ ok: false, error: "followers_count must be a non-negative number" });
    }
    if (following != null && (!Number.isFinite(following) || following < 0)) {
      return res
        .status(400)
        .json({ ok: false, error: "following_count must be a non-negative number" });
    }

    const payload = await getInstagramPayload(cleanUsername); // default: DB

    if (!payload?.ok) {
      return res.status(404).json({
        ok: false,
        error: payload?.error ?? "db_miss",
        note: "DB is the default source (no Rapid calls).",
      });
    }

    const posts = Array.isArray(payload.posts) ? payload.posts : [];
    const scoring = await scoreInstagram({
    profile: payload.profile ?? {},
    posts: posts ?? [],
    metrics: payload.metrics ?? {},
    overrides: {
        followers_count: followers,
        following_count: following,
    },
    });

    const profileOut = { ...(payload.profile ?? {}), scoring };
    console.log("[analyze] scoring type:", typeof scoring, scoring);

    return res.json({
    ok: true,
    username: cleanUsername,
    source: payload.meta?.source ?? "db",
    profile: profileOut,
    posts: payload.posts ?? [],
    metrics: payload.metrics ?? {},
    scoring, 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

router.get("/profile/:username", async (req, res) => {
  try {
    const rawUsername = req.params.username;

    if (!rawUsername || typeof rawUsername !== "string") {
      return res.status(400).json({ ok: false, error: "username is required" });
    }

    const cleanUsername = rawUsername.trim();
    if (!cleanUsername) {
      return res.status(400).json({ ok: false, error: "username is required" });
    }

    const payload = await getInstagramPayload(cleanUsername); // default: DB

    if (!payload?.ok) {
      return res.status(404).json({
        ok: false,
        error: payload?.error ?? "profile_not_found",
      });
    }

    return res.json({
      ok: true,
      profile: payload.profile,
      posts: payload.posts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
