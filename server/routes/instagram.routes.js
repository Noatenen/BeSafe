import express from "express";
import { ENDPOINTS, callRapid, extractPosts } from "../instagramAPI.js"; 

const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ ok: false, error: "username is required" });
    }

    const results = {};

    for (const ep of ENDPOINTS) {
      const params = ep.params ? ep.params(username) : undefined;
      const form = ep.form ? ep.form(username) : undefined;

      const r = await callRapid({
        method: ep.method,
        path: ep.path,
        params,
        form
      });

      results[ep.key] = r;
    }

    const postsNormalized = extractPosts(results.user_posts?.data);

    return res.json({
      ok: true,
      username,
      endpoints: Object.fromEntries(
        Object.entries(results).map(([k, v]) => [k, { status: v.status }])
      ),
      data: {
        user_data: results.user_data?.data ?? null,
        user_about: results.user_about?.data ?? null,
        user_posts: postsNormalized
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
