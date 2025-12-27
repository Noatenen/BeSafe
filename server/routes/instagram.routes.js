import express from "express";
import { ENDPOINTS, callRapid, normalizeInstagram } from "../instagramAPI.js";
import { Profile } from "../src/models/Profile.js";
import { Post } from "../src/models/Post.js";


const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const { username, followers_count, following_count } = req.body;
    //Validate user name
    if (!username || typeof username !== "string") {
      return res.status(400).json({ ok: false, error: "username is required" });
    }
    const cleanUsername = username.trim();
    if (!cleanUsername) {
    return res.status(400).json({ ok: false, error: "username is required" });
    }
    //Validate followers and following
    const followers = followers_count === "" || followers_count == null ? null : Number(followers_count);
    const following = following_count === "" || following_count == null ? null : Number(following_count);
    if (followers != null && (!Number.isFinite(followers) || followers < 0)) {
    return res.status(400).json({ ok: false, error: "followers_count must be a non-negative number" });
    }
    if (following != null && (!Number.isFinite(following) || following < 0)) {
    return res.status(400).json({ ok: false, error: "following_count must be a non-negative number" });
    }

    const results = {};

    for (const ep of ENDPOINTS) {
      const params = ep.params ? ep.params(cleanUsername) : undefined;
      const form = ep.form ? ep.form(cleanUsername) : undefined;

      const r = await callRapid({
        method: ep.method,
        path: ep.path,
        params,
        form
      });

      results[ep.key] = r;
    }
    // IF API failed
    const failed = Object.entries(results).filter(([, v]) => !v || v.status < 200 || v.status >= 300);
    if (failed.length > 0) {
    return res.status(502).json({
        ok: false,
        error: "rapidapi_failed",
        endpoints: Object.fromEntries(failed.map(([k, v]) => [k, v?.status ?? null])),
    });
}

    const unpacked = {
    user_data: results.user_data?.data ?? null,
    user_about: results.user_about?.data ?? null,
    user_posts: results.user_posts?.data ?? null,
    };
    const normalized = normalizeInstagram(unpacked, cleanUsername);
    const updateDoc = {
    platform: "instagram",
    username: cleanUsername,
    ...normalized.profile,
    followers_count: followers,
    following_count: following,
    metrics: normalized.metrics,
    last_fetched_at: new Date(),
    };

    const savedProfile = await Profile.findOneAndUpdate(
    { platform: "instagram", username: cleanUsername },
    { $set: updateDoc },
    { upsert: true, new: true }
    );
// Save posts (upsert-ish): insertMany with unique index + ignore duplicates
const postDocs = (normalized.posts ?? [])
  .filter((p) => p?.id) //  post_id
  .map((p) => ({
    platform: "instagram",
    username: cleanUsername,
    post_id: String(p.id),

    like_count: typeof p.like_count === "number" ? p.like_count : null,
    comment_count: typeof p.comment_count === "number" ? p.comment_count : null,
    caption_text: p.caption_text ?? null,
    accessibility_caption: p.accessibility_caption ?? null,

    usertags: Array.isArray(p.usertags) ? p.usertags : [],
    fetched_at: new Date(),
  }));

    let postsInserted = 0;
    if (postDocs.length > 0) {
    try {
        const inserted = await Post.insertMany(postDocs, { ordered: false });
        postsInserted = inserted.length;
    } catch (e) {
        if (e?.code !== 11000) throw e;
    }
    }

    return res.json({
    ok: true,
    username: cleanUsername,
    profile_id: savedProfile._id,
    metrics: savedProfile.metrics,
    posts_saved: postsInserted,
    posts_returned: normalized.metrics.posts_returned_count,
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

    // 1) Fetch profile
    const profile = await Profile.findOne({
      platform: "instagram",
      username: cleanUsername,
    }).lean();

    if (!profile) {
      return res.status(404).json({
        ok: false,
        error: "profile_not_found",
      });
    }

    // 2) Fetch latest 12 posts
    const posts = await Post.find({
      platform: "instagram",
      username: cleanUsername,
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    return res.json({
      ok: true,
      profile,
      posts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});


export default router;
