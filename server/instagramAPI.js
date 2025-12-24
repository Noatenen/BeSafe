import "dotenv/config";
import axios, { toFormData } from "axios";

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
  }
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

