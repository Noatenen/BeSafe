import axios from "axios";
import OpenAI from "openai";

//Weights for final score (must sum to 1)
const SCORE_WEIGHTS = {
    heuristics: 0.5,
    virusTotal: 0.2,
    ai: 0.3,
};
export const checkLink = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "URL is requested" });
        }
        //     // הודעת דמו קבועה לבינתיים
        //     return res.json({
        //     verdict: "suspicious",
        //     score: 55,
        //     reasons: [
        //       "Shortened URL detected",
        //       "Contains suspicious keyword: login"
        //     ],
        //     recommendation: "Verify the sender before clicking"
        //   });
        const heuristics = runHeuristics(url);
        const virusTotal = await checkVirusTotal(url);
        const ai = await askOpenAI(url);

        // return by default 1 if something goes wrong
        const hScore = heuristics?.score ?? 1;
        const vtScore = virusTotal?.score ?? 1;
        const aiScore = ai?.score ?? 1;

        //final score calc
        const finalScore =
            hScore * SCORE_WEIGHTS.heuristics +
            vtScore * SCORE_WEIGHTS.virusTotal +
            aiScore * SCORE_WEIGHTS.ai;

        const roundedScore = Number(
            Math.min(5, Math.max(1, finalScore)).toFixed(1)
        );

        //verdict categories
        let verdict = "unknown";

        if (roundedScore < 1.6) verdict = "safe";
        else if (roundedScore < 2.6) verdict = "low risk";
        else if (roundedScore < 3.6) verdict = "suspicious";
        else if (roundedScore < 4.6) verdict = "dangerous";
        else verdict = "severe risk";

        let recommendation = "";
        if (roundedScore < 1.6) {
            recommendation = "This link appears safe, but always verify the sender.";
        }
        else if (roundedScore < 2.6) {
            recommendation = "Low-risk link. Avoid entering personal information unless trusted.";
        }
        else if (roundedScore < 3.6) {
            recommendation = "Be cautious. Check the sender and avoid logging in via this link.";
        }
        else if (roundedScore < 4.6) {
            recommendation = "High risk. Do NOT enter credentials. Verify with the organization directly.";
        }
        else {
            recommendation = "Severe risk. Avoid clicking and report this as phishing.";
        }

        const reasons = [
            ...(heuristics?.reasons ?? []),
            ...(virusTotal?.reasons ?? []),
            ...(ai?.reasons ?? [])
        ];

        return res.json({
            verdict,
            score: roundedScore,
            reasons,
            recommendation,
            sources: {
                heuristics,
                virusTotal,
                ai
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
}

// ---------- Basic Heuristics ----------
function runHeuristics(url) {
    let score = 1;
    const reasons = [];

    //1) HTTPS check
    if (!url.startsWith("https://")) {
        score += 3.0;
        reasons.push("Connection is not secure (HTTPS missing)");
    }

    //2) Suspicious keywords
    const suspiciousWords = ["login", "verify", "reset", "account", "bank"];
    suspiciousWords.forEach((word) => {
        if (url.toLowerCase().includes(word)) {
            score += 3.0;
            reasons.push(`Contains suspicious keyword: ${word}`);
        }
    });

    // 3) Shortened URL detection (very simple version)
    const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly"];
    if (shorteners.some((s) => url.includes(s))) {
        score += 3.0;
        reasons.push("Shortened URL detected");
    }

    // 4) Weird characters
    if (/[^\w\-.:/?&=#]/.test(url)) {
        score += 3.0;
        reasons.push("URL contains unusual characters");
    }

    // clamp score to [1,5] and return
    score = Math.max(1, Math.min(5, score));
    return { score, reasons };
}

// ---------- VirusTotal Assessment ----------
async function checkVirusTotal(url) {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;

    if (!apiKey) return null;

    try {
        // Submit URL for analysis
        const submitResponse = await axios.post(
            "https://www.virustotal.com/api/v3/urls",
            `url=${encodeURIComponent(url)}`,
            {
                headers: {
                    "x-apikey": apiKey,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        const submitData = submitResponse.data;
        const analysisId = submitData?.data?.id;

        if (!analysisId) return null;

        // Fetch analysis result
        const analysisResponse = await axios.get(
            `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
            { headers: { "x-apikey": apiKey } }
        );

        const analysisData = analysisResponse.data;

        const stats = analysisData?.data?.attributes?.stats;
        if (!stats) return null;

        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;

        const detections = malicious + suspicious;

        // Set the score

        let score;
        let reasons = [];

        if (detections >= 1) {
            score = 5;
            reasons.push(
                "VirusTotal: One or more security vendors reported this URL as malicious and potentially harmful."
            );
        } else {
            score = 1;
            reasons.push(
                "VirusTotal: no engines reported this URL as malicious."
            );
        }

        return { score, reasons };

    } catch (err) {
        console.error("VirusTotal error:", err);
        return null;
    }
}

// ---------- AI Risk Assessment ----------
async function askOpenAI(url) {
    if (!process.env.OPENAI_API_KEY) return null;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
You are a cybersecurity assistant.
Rate the risk level of a URL from 1 to 5:
1 = safe
2 = slightly suspicious
3 = suspicious
4 = dangerous
5 = very dangerous

Important:
- Base your answer ONLY on the URL string.
- Do NOT sound alarming.
- Be calm and educational.
- Return JSON only.
`
                },
                {
                    role: "user",
                    content: `
Analyze this URL and return JSON like:
{
 "score": number,
 "reasons": ["short explanation", "another reason"]
}

URL: ${url}
`
                }
            ],
            temperature: 0.2
        });

        const text = completion.choices[0].message.content;

        // Parse JSON safely
        const data = JSON.parse(text);

        return {
            score: Math.max(1, Math.min(5, data.score)),
            reasons: data.reasons || []
        };

    } catch (err) {
        console.error("OpenAI error:", err);
        return null;
    }
}

