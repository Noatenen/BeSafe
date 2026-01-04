import { BAD_PATTERNS } from "../data/badWords.he.js";

/* =========================
   נרמול טקסט (הקוד המקורי שלך)
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
   פונקציית ניתוח עמוק - ה"מוח" של המערכת
   מנתחת הקשר, סחיטה, פישינג וסלנג ישראלי
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
        model: "gpt-4o-mini", // דגם חכם, מהיר וזול
        messages: [
          {
            role: "system",
            content: `אתה מומחה בטיחות ברשת (Cyber Safety) הממוקד בהגנה על ילדים ובני נוער.
            תפקידך לנתח הודעות טקסט בעברית ולזהות איומים מורכבים שאינם רק קללות.
            
            חפש את הקטגוריות הבאות:
            1. phishing: בקשת פרטים אישיים, סיסמאות, קוד אימות SMS, או הבטחות שווא (כמו "זכית בפרס").
            2. extortion: סחיטה מינית או חברתית (למשל: "אם לא תשלם/תשלח תמונה אני אפרסם עליך...").
            3. bullying: השפלה, חרם, הטרדה או איומים באלימות.
            4. threat: איומים לפגיעה פיזית או פגיעה בפרטיות.
            5. safe: הודעה תקינה ללא כוונת זדון.

            דגשים לסלנג ישראלי: זהה מילים כמו 'סקאם', 'נודר', 'עוקץ', 'ניוד'.
            
            החזר אך ורק אובייקט JSON תקין בפורמט הבא:
            {
              "severity": (מספר בין 0 ל-100 המייצג את רמת הסיכון),
              "category": "phishing" | "bullying" | "extortion" | "threat" | "safe",
              "explanation": "הסבר קצר ופשוט לילד בעברית על מה שזיהית",
              "urgent_action": "הנחיה מעשית לילד: מה לעשות עכשיו (למשל: לחסום, לא לענות, לספר להורה)"
            }`
          },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();

    // בדיקה אם חזרה שגיאה מ-OpenAI
    if (data.error) {
      console.error("OpenAI API Error:", data.error.message);
      throw new Error(data.error.message);
    }

    let rawContent = data.choices[0].message.content;
    
    // ניקוי Markdown אם המודל הוסיף בטעות
    rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedResult = JSON.parse(rawContent);

    // וידוא שהציון הוא אכן מספר
    parsedResult.severity = Number(parsedResult.severity);

    return parsedResult;

  } catch (err) {
    console.error("AI Analysis Detailed Error:", err);
    // במקרה של שגיאה טכנית, נחזיר אובייקט ברירת מחדל בטוח
    return { 
      severity: 0, 
      category: "safe", 
      explanation: "לא הצלחנו לנתח את ההודעה כרגע. אם יש ספק - כדאי להתייעץ עם מבוגר.", 
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

    // הפעלת ה-Regex וה-AI במקביל לחיסכון בזמן
    const foundBadWords = findBadWords(text);
    const aiAnalysis = await getDeepAIAnalysis(text);

    // שקלול ציון סופי
    // אנחנו נותנים משקל גבוה ל-AI, אבל אם ה-Regex מצא קללה בוטה, זה מינימום 50
    let finalRiskScore = aiAnalysis.severity;
    if (foundBadWords.length > 0 && finalRiskScore < 50) {
      finalRiskScore = 50 + (foundBadWords.length * 5); 
    }
    
    finalRiskScore = Math.min(finalRiskScore, 100);

    // קביעת צבע/רמת סיכון
    let riskLevel = "green";
    if (finalRiskScore >= 75) riskLevel = "red";
    else if (finalRiskScore >= 40) riskLevel = "yellow";

    // שליחת התשובה המלאה לפרונט
    return res.json({
      success: true,
      text,
      riskScore: finalRiskScore,
      riskLevel,
      category: aiAnalysis.category,
      explanation: aiAnalysis.explanation,
      recommendation: aiAnalysis.urgent_action,
      details: {
        regexFound: foundBadWords,
        aiSeverity: aiAnalysis.severity
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