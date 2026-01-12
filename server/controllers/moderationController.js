import { BAD_PATTERNS } from "../data/badWords.he.js";

/* =========================
   נרמול טקסט (ללא שינוי)
   ========================= */
function normalizeText(str) {
  let s = (str || "").toLowerCase();
  s = s.replace(/ך/g, "כ").replace(/ם/g, "מ").replace(/ן/g, "נ").replace(/ף/g, "פ").replace(/ץ/g, "צ");
  s = s.replace(/[^\p{L}\p{N}\s]/gu, " ");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/(.)\1{2,}/g, "$1$1");
  return s;
}

function findBadWords(text) {
  const clean = normalizeText(text);
  const found = [];
  for (const pattern of BAD_PATTERNS) {
    if (pattern.re.test(clean)) {
      found.push(pattern.label);
    }
  }
  return found;
}

/* ==============================================
   פונקציית ניתוח עמוק - AI
   עדכון: הציון כעת הוא 1-5
   ============================================== */
async function getDeepAIAnalysis(text) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `אתה מומחה בטיחות ברשת (Cyber Safety).
            תפקידך לנתח הודעות טקסט בעברית ולדרג את הסיכון בסולם של 1 עד 5.

            סולם הדירוג:
            1 = Safe (בטוח לגמרי, שיחה רגילה)
            2 = Low Risk (חשד קל, אולי סלנג לא נעים אבל לא מסוכן)
            3 = Suspicious (חשוד - קללות, הצקות, או ניסיון בסיסי להונאה)
            4 = Dangerous (מסוכן - בריונות קשה, איומים, פישינג ברור)
            5 = Severe Risk (סכנה מיידית - סחיטה, עבירות מין, איום ממשי לחיים)
            
            קטגוריות לזיהוי:
            - phishing
            - extortion
            - bullying
            - threat
            - safe

            החזר אובייקט JSON בלבד:
            {
              "score": (מספר שלם בין 1 ל-5),
              "category": "category_name",
              "explanation": "הסבר קצר לילד בעברית",
              "urgent_action": "הנחיה קצרה מה לעשות"
            }`
          },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    let rawContent = data.choices[0].message.content;
    rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedResult = JSON.parse(rawContent);

    // וידוא שהציון הוא מספר בטווח הנכון
    parsedResult.score = Number(parsedResult.score);
    if (isNaN(parsedResult.score)) parsedResult.score = 1; // Fallback

    return parsedResult;

  } catch (err) {
    console.error("AI Analysis Error:", err);
    // במקרה שגיאה נחזיר ציון ניטרלי/נמוך כדי לא לתקוע את המערכת
    return { 
      score: 1, 
      category: "safe", 
      explanation: "לא הצלחנו לנתח את ההודעה כרגע.", 
      urgent_action: "" 
    };
  }
}

/* =========================
   Controller ראשי
   ========================= */
export async function moderateText(req, res) {
  try {
    const text = req.body?.text || "";

    if (!text.trim()) {
      return res.status(400).json({ error: "Missing text" });
    }

    // הרצה במקביל
    const [foundBadWords, aiAnalysis] = await Promise.all([
        Promise.resolve(findBadWords(text)), // עטפנו ב-promise כדי שיתאים ל-all בצורה נקייה
        getDeepAIAnalysis(text)
    ]);

    // --- חישוב ציון משוקלל (1-5) ---
    
    // מתחילים מהציון של ה-AI
    let finalScore = aiAnalysis.score;

    // לוגיקת Regex: אם נמצאו מילים אסורות, הציון לא יכול להיות נמוך מ-3
    // (כדי למנוע מצב שה-AI מפספס קללה והציון נשאר 1)
    if (foundBadWords.length > 0) {
        // אם הציון היה נמוך (1 או 2), נקפיץ אותו ל-3 לפחות
        // אם יש המון מילים גסות (יותר מ-2), נקפיץ ל-4
        if (foundBadWords.length > 2) {
             finalScore = Math.max(finalScore, 4);
        } else {
             finalScore = Math.max(finalScore, 3);
        }
    }

    // וידוא גבולות 1-5
    finalScore = Math.min(5, Math.max(1, finalScore));

    // --- קביעת Verdict (כמו אצל אריאל) ---
    let verdict = "unknown";
    if (finalScore < 1.6) verdict = "safe";
    else if (finalScore < 2.6) verdict = "low risk";
    else if (finalScore < 3.6) verdict = "suspicious";
    else if (finalScore < 4.6) verdict = "dangerous";
    else verdict = "severe risk";

    // שליחת התשובה
    return res.json({
      success: true,
      text,
      score: finalScore,      // המספר 1-5
      verdict,                // הטקסט (safe, suspicious...)
      category: aiAnalysis.category,
      explanation: aiAnalysis.explanation,
      recommendation: aiAnalysis.urgent_action,
      details: {
        regexFound: foundBadWords,
        aiRawScore: aiAnalysis.score
      }
    });

  } catch (error) {
    console.error("Main Controller Error:", error);
    return res.status(500).json({
      error: "Moderation failed",
      details: error.message,
    });
  }
}