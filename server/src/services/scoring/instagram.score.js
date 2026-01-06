import { analyzeCaptionsAi } from "./ig.ai.js";
import { isAiEnabled } from "../ai/openai.client.js";

export async function scoreInstagram({ metrics, posts, profile }) {  const reasons = [];
  let score = 0;
  const m = metrics ?? {};
  const postsArr = Array.isArray(posts) ? posts : [];
  const followers = profile?.followers_count;
  const following = profile?.following_count;
    const captions = (posts || [])
    .map(p => p?.caption_text)
    .filter(Boolean);
  let aiCaptions = null;

  //scpring logics
  if (postsArr.length === 0) {
    reasons.push(
      "No posts available; score is based on profile information only"
    );
  } else {
    score += avgLikes(m, reasons);
    score += avgCom(m, reasons);
    score += friendsTag(m, reasons);
    score += postsCount(m, reasons);  
    const captionsResult = await captionsAI(
      captions,
      reasons,
      profile?.username
    );
    if (captionsResult){
      score += captionsResult.score;
      aiCaptions = captionsResult.ai_captions;
    }
  }
  score += follows (followers, following, reasons);


  //calculate final score
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  if (!Number.isFinite(score)) score = 0;
  score = Math.min(100, Math.max(0, score));
  score = Math.max(1, Math.ceil(score / 20)); //convert to 1-5 scale
  const label = score >= 4 ? "high" : score >= 2 ? "medium" : "low";
    
  if (reasons.length === 0) {
    reasons.push("No strong suspicious signals found in recent data");
    }

  return {
    ok: true,
    score,
    label,
    reasons,
    features: {
      average_likes: m.average_likes ?? null,
      average_comments: m.average_comments ?? null,
      posts_returned_count: m.posts_returned_count ?? null,
      carousel_posts_count: m.carousel_posts_count ?? null,
      unique_tagged_users_count: m.unique_tagged_users_count ?? null,
    },
    ai_captions: aiCaptions,
  };
}

/* calculate follwers/folloeing ratio
    under 0.5 -> score += 20
    under 1 -> score += 10
*/
function follows (followers, following, reasons){
    let ratio = null;
    if (typeof followers === "number" && typeof following === "number" && following > 0) {
    ratio = followers / Math.max(following, 1);
    }
    if (ratio < 0.5) {
        reasons.push("Very low followers/following ratio");
        return 20;
    } else if (ratio < 1) {
        reasons.push("Low followers/following ratio");
        return 10;
    }
    return 0;
}

/* avarge likes on posts
    under 20 -> score += 22
    under 50 -> score += 10
*/
function avgLikes(m, reasons) {
  if (typeof m.average_likes !== "number") return 0;

  if (m.average_likes < 20) {
    reasons.push("Very low average likes");
    return 22;
  }

  if (m.average_likes < 40) {
    reasons.push("Low average likes");
    return 10;
  }

  return 0;
}

/* avarge comments on posts
    under 5 -> score += 15
*/
function avgCom(m, reasons) {
  if (typeof m.average_comments !== "number") return 0;

  if (m.average_comments < 5) {
    reasons.push("Very low average comments");
    return 15;
  }

  return 0;
}

/* How many users tagged on posts
    0 tags -> score += 8
*/
function friendsTag(m, reasons) {
  if (typeof m.unique_tagged_users_count !== "number") return 0;

  if (m.unique_tagged_users_count === 0) {
    reasons.push("No tagged users in recent posts");
    return 8;
  }

  return 0;
}

/* How many posts
    under 3 -> score += 15
    under 6 -> score += 8
*/
function postsCount(m, reasons) {
  if (typeof m.posts_returned_count !== "number") return 0;

  if (m.posts_returned_count < 3) {
    reasons.push("Very few recent posts available");
    return 15;
  }

  if (m.posts_returned_count < 6) {
    reasons.push("Few recent posts available");
    return 8;
  }

  return 0;
}

//AI score for posts's captions - suspiciousness score + resons
async function captionsAI (captions, reasons, username){
    console.log("AI enabled?", isAiEnabled(), "captions:", captions.length);
    let score = 0;
    const ai = await analyzeCaptionsAi(captions, { username });
    if (ai) {
        // suspiciousness: 0..1  => add up to 20 points
        const add = Math.round((ai.suspiciousness || 0) * 20);
        score += add;

        // add a couple reasons (short)
        (ai.reasons || []).slice(0, 3).forEach(r => reasons.push(`Captions: ${r}`));
    }
    return {
        score,
        ai_captions: ai
    };
}

