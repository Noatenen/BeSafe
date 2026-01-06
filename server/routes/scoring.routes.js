import express from "express";
import { Profile } from "../src/models/Profile.js";
import { Post } from "../src/models/Post.js";
import { scoreInstagram } from "../src/services/scoring/instagram.score.js";

const router = express.Router();

router.get("/instagram/:username", async (req, res) => {
  try {
    const username = (req.params.username || "").trim();
    if (!username) return res.status(400).json({ ok: false, error: "username is required" });
    const refresh = req.query.refresh === "1";

    const profile = await Profile.findOne({ platform: "instagram", username }).lean();
    if (!profile) return res.status(404).json({ ok: false, error: "profile_not_found" });
    if (!refresh && profile.scoring?.score != null) {
    return res.json({
        ok: true,
        username,
        ...profile.scoring,
        cached: true
    });
    }

    const posts = await Post.find({ platform: "instagram", username })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const scored = await scoreInstagram({
      profile,
      metrics: profile.metrics,
      posts
    });
        await Profile.updateOne(
    { _id: profile._id },
    {
        $set: {
        scoring: {
            score: scored.score,
            label: scored.label,
            reasons: scored.reasons,
            ai_captions: scored.ai_captions
        }
        }
    }
);


    return res.json({ ok: true, username, ...scored });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

// return captions from DB (for quick testing in browser)
router.get("/instagram/:username/captions", async (req, res) => {
  try {
    const username = (req.params.username || "").trim();
    if (!username) return res.status(400).json({ ok: false, error: "username is required" });

    const limitRaw = req.query.limit;
    const limitNum = Number(limitRaw);
    const limit = Number.isFinite(limitNum) && limitNum > 0 && limitNum <= 50 ? limitNum : 12;

    const profileExists = await Profile.exists({ platform: "instagram", username });
    if (!profileExists) return res.status(404).json({ ok: false, error: "profile_not_found" });

    const posts = await Post.find({ platform: "instagram", username })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select({ caption_text: 1, post_id: 1, like_count: 1, comment_count: 1, createdAt: 1 })
      .lean();

    const captions = posts
      .map(p => p.caption_text)
      .filter(Boolean);

    return res.json({
      ok: true,
      username,
      limit,
      captions_count: captions.length,
      captions,
      posts_meta: posts.map(p => ({
        post_id: p.post_id,
        like_count: p.like_count ?? null,
        comment_count: p.comment_count ?? null,
        createdAt: p.createdAt
      }))
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

export default router;
