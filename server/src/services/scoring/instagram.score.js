export function scoreInstagram({ metrics }) {  const reasons = [];
  let score = 0;
  const m = metrics ?? {};

  score += avgLikes(m, reasons);
  score += avgCom(m, reasons);
  score += friendsTag(m, reasons);
  score += postsCount(m, reasons);

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  const label = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

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
  };
}

function avgLikes(m, reasons) {
  if (typeof m.average_likes !== "number") return 0;

  if (m.average_likes < 20) {
    reasons.push("Very low average likes");
    return 20;
  }

  if (m.average_likes < 50) {
    reasons.push("Low average likes");
    return 10;
  }

  return 0;
}

function avgCom(m, reasons) {
  if (typeof m.average_comments !== "number") return 0;

  if (m.average_comments < 2) {
    reasons.push("Very low average comments");
    return 10;
  }

  return 0;
}

function friendsTag(m, reasons) {
  if (typeof m.unique_tagged_users_count !== "number") return 0;

  if (m.unique_tagged_users_count === 0) {
    reasons.push("No tagged users in recent posts");
    return 5;
  }

  return 0;
}

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
