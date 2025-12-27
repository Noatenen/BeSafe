import "dotenv/config";
import axios from "axios";

console.log("start");

const KEY = process.env.RAPIDAPI_KEY;
if (!KEY) {
  throw new Error("Missing RAPIDAPI_KEY in .env");
}

const HOST = "instagram-scraper-stable-api.p.rapidapi.com"; 

export const ENDPOINTS =  [
  {
    key: "user_data",
    label: "User Data",
    method: "POST",
    path: "get_ig_user_data.php",
    form: (username) => ({ username_or_url: username }),
    essential: true,
  },
  {
  key: "user_about",
  label: "User About",
  method: "GET",
  path: "get_ig_user_about.php",
  params: (username) => ({ username_or_url: username }),
  essential: true,
},
{
  key: "user_posts",
  label: "User Posts",
  method: "POST",
  path: "get_ig_user_posts.php",
  form: (username) => ({ username_or_url: username }),
  essential: true,
},
];

//path corrector:
function urlFor(path) {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `https://${HOST}/${clean}`;
}

export async function callRapid({method, path, params, form}) {
  const isPostForm = method === "POST" && form;
  const res = await axios.request({
    method,
    url: urlFor(path),
    params,
    data: isPostForm ? new URLSearchParams(form).toString() : undefined,
    headers: {
        "X-RapidAPI-Key": KEY,
        "X-RapidAPI-Host": HOST,
         ...(isPostForm
          ? { "Content-Type":
          "application/x-www-form-urlencoded" } 
          : {}),
    },
    timeout: 20000,      //timeout if request over 20 sec
    validateStatus: () => true,
    });
    return {status: res.status, data: res.data};
}

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
    postsArray = raw.data?.items
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
