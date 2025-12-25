import "dotenv/config";
import axios  from "axios";

console.log("start");

const KEY = process.env.RAPIDAPI_KEY;
if (!KEY) {
  console.error("Missing RAPIDAPI_KEY in .env");
  process.exit(1);
}

const HOST = "instagram-scraper-stable-api.p.rapidapi.com"; 

const ENDPOINTS = [
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

]

//path corrector:
function urlFor(path) {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `https://${HOST}/${clean}`;
}

async function callRapid({method, path, params, form}) {
  const isPostForm = method === "POST" && form;
  const res = await axios.request({
    method,
    url: urlFor(path),
    params,
    data: isPostForm ? new URLSearchParams(form).toString() : undefined,
    headers: {
        "X-RapidAPI-Key": KEY,
        "X-RapidAPI-Host": HOST,
        ...(isPostForm ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    timeout: 20000,      //timeout if request over 20 sec
    validateStatus: () => true,
    });
    return {status: res.status, data: res.data};
}


// Extract and normalize Instagram posts from a RapidAPI response
function extractPosts(raw) { 
  // Guard clause: ensure we received a valid plain object
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
  return { posts_returned_count: 0, items: [] };
  }
  const items = [];
  // Attempt to locate the posts array across known response shapes
  let postsArray = null;
  if (Array.isArray(raw.items)){
    postsArray = raw.items;
  } else if (Array.isArray(raw.data?.items)){
    postsArray = raw.data?.items
  } 
  // If no posts array was found, return an empty normalized result
  if (!Array.isArray(postsArray)) {
    return { posts_returned_count: 0, items: [] };
  }

  for (const post of postsArray){
    const postNode = post.node ?? post;
    items.push({
      id: postNode?.id ?? null
    })
  }

  return { posts_returned_count: items.length, items };

}
