
import axios from "axios";

const KEY = process.env.RAPIDAPI_KEY;
function assertRapidKey() {
  if (process.env.MOCK_RAPID === "true") return;
  if (!process.env.RAPIDAPI_KEY) {
    throw new Error("Missing RAPIDAPI_KEY in .env (or set MOCK_RAPID=true)");
  }
}

const HOST = "instagram-scraper-stable-api.p.rapidapi.com"; 

export const ENDPOINTS =  [
  {
    key: "user_data",
    label: "User Data",
    method: "POST",
    path: "get_ig_user_data",
    form: (username) => ({ username_or_url: username }),
    essential: true,
  },
  {
  key: "user_about",
  label: "User About",
  method: "GET",
  path: "get_ig_user_about",
  params: (username) => ({ username_or_url: username }),
  essential: true,
},
{
  key: "user_posts",
  label: "User Posts",
  method: "POST",
  path: "get_ig_user_posts",
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
  assertRapidKey();
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
    if (res.status === 404) {
      console.log("[RapidAPI 404]", method, urlFor(path));
    }
    return {status: res.status, data: res.data};
}

export async function fetchFromRapid(username) {
  const clean = (username ?? "").trim();
  if (!clean) throw new Error("username is required");

  const results = {};

  for (const ep of ENDPOINTS) {
    const params = ep.params ? ep.params(clean) : undefined;
    const form = ep.form ? ep.form(clean) : undefined;

    const r = await callRapid({
      method: ep.method,
      path: ep.path,
      params,
      form,
    });

    results[ep.key] = r;
  }

  return results;
}
