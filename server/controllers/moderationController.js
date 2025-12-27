import { BAD_PATTERNS } from "../data/badWords.he.js";

/* =========================
   נרמול טקסט (עברית-friendly)
   ========================= */
function normalizeText(str) {
  var s = (str || "").toLowerCase();

  // אותיות סופיות -> רגילות
  s = s
    .replace(/ך/g, "כ")
    .replace(/ם/g, "מ")
    .replace(/ן/g, "נ")
    .replace(/ף/g, "פ")
    .replace(/ץ/g, "צ");

  // השארת אותיות / מספרים / רווחים
  s = s.replace(/[^\p{L}\p{N}\s]/gu, " ");

  // רווחים כפולים
  s = s.replace(/\s+/g, " ").trim();

  // הארכות אותיות (מפווגגרת → מפגרת)
  s = s.replace(/(.)\1{2,}/g, "$1$1");

  return s;
}

/* =========================
   זיהוי מילים בעייתיות
   ========================= */
function findBadWords(text) {
  var clean = normalizeText(text);
  var found = [];

  for (var i = 0; i < BAD_PATTERNS.length; i++) {
    if (BAD_PATTERNS[i].re.test(clean)) {
      found.push(BAD_PATTERNS[i].label);
    }
  }

  return found;
}

/* =========================
   חישוב ציון סיכון
   ========================= */
function calcRisk(foundBadWords, scores) {
  var harass = scores["harassment"] || 0;
  var hate = scores["hate"] || 0;
  var threat = scores["harassment/threatening"] || 0;
  var violence = scores["violence"] || 0;

  // מילים שלכם: 20 נק' לכל מילה (עד 60)
  var riskScore = Math.min(foundBadWords.length * 20, 60);

  // תרומה מהמודל
  riskScore += Math.round(harass * 40);
  riskScore += Math.round(hate * 60);
  riskScore += Math.round(threat * 80);
  riskScore += Math.round(violence * 40);

  riskScore = Math.min(riskScore, 100);

  var riskLevel = "green";
  if (riskScore >= 60) riskLevel = "red";
  else if (riskScore >= 30) riskLevel = "yellow";

  return { riskScore, riskLevel };
}

/* =========================
   Controller ראשי
   ========================= */
export async function moderateText(req, res) {
  try {
    var text = req.body?.text || "";

    if (!text.trim()) {
      return res.status(400).json({ error: "Missing text" });
    }

    // קריאה ל־OpenAI moderation
    var response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: text,
      }),
    });

    var data = await response.json();

    var result0 = data?.results?.[0] || {};
    var scores = result0.category_scores || {};
    var categories = result0.categories || {};
    var flagged = !!result0.flagged;

    // שכבה משלכם
    var foundBadWords = findBadWords(text);

    // חישוב סיכון
    var { riskScore, riskLevel } = calcRisk(foundBadWords, scores);

    // תשובה מסודרת לפרונט
    return res.json({
      riskScore,
      riskLevel,
      foundBadWords,
      model: {
        flagged,
        categories,
        category_scores: scores,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Moderation failed",
      details: error.message,
    });
  }
}
