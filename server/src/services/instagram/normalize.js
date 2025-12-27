
// Extract and normalize Instagram basic data from a RapidAPI response
export function extractProfile(rawUserData, username) { 
  // ensure we received a valid plain object
  if (!rawUserData || typeof rawUserData !== "object" || Array.isArray(rawUserData)) {
  return {
    username: username ?? null,
    full_name: null,
    is_verified: null,
    is_private: null,
    biography: null,
    external_url: null,
    profile_pic_url: null,
    hd_profile_pic_url: null,
  };
  }
  const u =
    rawUserData?.user ??
    rawUserData?.data?.user ??
    rawUserData?.data ??
    rawUserData;

  return {
    username: username ?? u?.username ?? null,
    full_name: u?.full_name ?? null,
    is_verified: u?.is_verified ?? null,
    is_private: u?.is_private ?? null,
    biography: u?.biography ?? null,
    external_url: u?.external_url ?? u?.website ?? null,
    profile_pic_url: u?.profile_pic_url ?? null,
    hd_profile_pic_url: u?.hd_profile_pic_url_info?.url ?? u?.hd_profile_pic_url ?? null,
  };
}

// Extract and normalize Instagram posts from a RapidAPI response
export function extractPosts(raw) { 
  // ensure we received a valid plain object
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
  return { posts_returned_count: 0, items: [] };
  }
  const items = [];
  // Attempt to locate the posts array across known response shapes
  let postsArray = null;
  if (Array.isArray(raw.items)) {
    postsArray = raw.items;
  } else if (Array.isArray(raw.data?.items)) {
    postsArray = raw.data.items;
  } else if (Array.isArray(raw.posts)) {
    postsArray = raw.posts;
  } else if (Array.isArray(raw.data?.posts)) {
    postsArray = raw.data.posts;
  }

  // If no posts array was found, return an empty normalized result
  if (!Array.isArray(postsArray)) {
    return { posts_returned_count: 0, items: [] };
  }
  //Adding posts items 
  for (const post of postsArray) {
    const postNode = post.node ?? post;
    const rawTags = postNode?.usertags?.in;
    const tagsArray = Array.isArray(rawTags) ? rawTags : [];
    const usertags = tagsArray.map((t) => ({
      username: t?.user?.username ?? null,
      full_name: t?.user?.full_name ?? null,
      is_verified: t?.user?.is_verified ?? null,
      position: t?.position ?? null,
    }));
    items.push({
      id: postNode?.id ?? null,
      like_count: postNode?.like_count ?? null,
      comment_count: postNode?.comment_count ?? null,
      caption_text: postNode?.caption?.text ?? null,
      accessibility_caption: postNode?.accessibility_caption ?? null,
      usertags,
    });
  }
  return { posts_returned_count: items.length, items };
}

//Merge profile data and posts results
export function normalizeInstagram(results, username) { 
  const profile = extractProfile(results?.user_data, username);

  const postsNormalized = extractPosts(results?.user_posts);
  const posts = postsNormalized.items;

  // ---- Metrics calculations ----
  const safeNum = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const postsCount = posts.length;
  const totalLikes = posts.reduce((sum, p) => sum + safeNum(p.like_count), 0);
  const totalComments = posts.reduce((sum, p) => sum + safeNum(p.comment_count), 0);
  const averageLikes = postsCount > 0 ? Math.round(totalLikes / postsCount) : 0;
  const averageComments = postsCount > 0 ? Math.round(totalComments / postsCount) : 0;

  const carouselPostsCount = posts.reduce((count, p) => {
    const tagsLen = Array.isArray(p.usertags) ? p.usertags.length : 0;
    return count + (tagsLen >= 2 ? 1 : 0);
  }, 0);

  const taggedSet = new Set();
  for (const p of posts) {
    if (!Array.isArray(p.usertags)) continue;
    for (const t of p.usertags) {
      const uname = typeof t?.username === "string" ? t.username.trim() : "";
      if (uname) taggedSet.add(uname.toLowerCase());
    }
  }
  const uniqueTaggedUsersCount = taggedSet.size;

  const metrics = {
    posts_returned_count: postsNormalized.posts_returned_count,
    average_likes: averageLikes,
    average_comments: averageComments,
    carousel_posts_count: carouselPostsCount,
    unique_tagged_users_count: uniqueTaggedUsersCount,
  };

  return { profile, posts, metrics };
}
