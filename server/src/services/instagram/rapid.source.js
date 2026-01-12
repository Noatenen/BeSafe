import axios from "axios";

const HOST = "instagram-scraper-stable-api.p.rapidapi.com";

// --- כאן היה התיקון הגדול: שינינו את הכתובות למה שבאמת עובד ---
export const ENDPOINTS = [
  {
    key: "user_data", // זה יביא את המידע על הפרופיל
    label: "User Info",
    method: "GET", // ה-API הזה עובד עם GET
    path: "ig/info_v2", // הכתובת הנכונה
    params: (username) => ({ user_name: username }), // הפרמטר הוא user_name
    essential: true,
  },
  {
    key: "user_posts", // זה יביא את הפוסטים
    label: "User Posts",
    method: "GET",
    path: "ig/posts", // הכתובת הנכונה לפוסטים
    params: (username) => ({ user_name: username }),
    essential: false, // לא חובה, כדי שאם הפוסטים נכשלים עדיין נקבל פרופיל
  },
];

// פונקציית עזר לסידור ה-URL
function urlFor(path) {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `https://${HOST}/${clean}`;
}

export async function callRapid({ method, path, params, form }) {
  // בדיקות תקינות למפתח
  // console.log("RAPIDAPI_KEY prefix:", process.env.RAPIDAPI_KEY?.slice(0, 6)); // לדיבוג

  if (!process.env.RAPIDAPI_KEY && process.env.MOCK_RAPID !== "true") {
    throw new Error("Missing RAPIDAPI_KEY in .env");
  }

  const KEY = process.env.RAPIDAPI_KEY;
  const isPostForm = method === "POST" && form;

  try {
    const res = await axios.request({
      method,
      url: urlFor(path),
      params, // ב-GET המידע עובר כאן
      data: isPostForm ? new URLSearchParams(form).toString() : undefined, // ב-POST המידע עובר כאן
      headers: {
        "x-rapidapi-key": KEY,
        "x-rapidapi-host": HOST,
        ...(isPostForm ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      timeout: 20000, // 20 שניות Timeout
      validateStatus: () => true, // לא לזרוק שגיאה אוטומטית על 404
    });

    if (res.status >= 400) {
      console.log(`[RapidAPI Error] ${method} ${path} -> Status: ${res.status}`);
      // console.log("Error Data:", res.data); // לפעמים עוזר לראות את הודעת השגיאה
    }

    return { status: res.status, data: res.data };
  } catch (err) {
    console.error(`[RapidAPI Exception] ${method} ${path}`, err.message);
    return { status: 500, data: null };
  }
}

export async function fetchFromRapid(username) {
  const clean = (username ?? "").trim();
  if (!clean) throw new Error("username is required");

  console.log(`🚀 [RapidAPI] Fetching data for: ${clean}...`);

  const results = {};
  let hasEssentialFailure = false;

  for (const ep of ENDPOINTS) {
    // הכנת הפרמטרים לפי סוג הבקשה
    const params = ep.params ? ep.params(clean) : undefined;
    const form = ep.form ? ep.form(clean) : undefined;

    const r = await callRapid({
      method: ep.method,
      path: ep.path,
      params,
      form,
    });

    // שמירת התוצאה במבנה שהקוד שלך מצפה לו
    // הערה: ה-API הזה מחזיר את המידע בדרך כלל בתוך data.owner או data.items
    // provider.js יצטרך לדעת לטפל בזה, אבל קודם שנקבל מידע!
    results[ep.key] = r;

    if (ep.essential && r.status >= 400) {
      console.log(`❌ Essential endpoint failed: ${ep.label}`);
      hasEssentialFailure = true;
      break; 
    }
  }

  return {
    ok: !hasEssentialFailure,
    results, // מחזיר אובייקט עם user_data ו-user_posts
  };
}