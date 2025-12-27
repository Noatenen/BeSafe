import { useState } from "react";

function TextAnalyzer() {
  var [text, setText] = useState("");
  var [result, setResult] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");

  async function analyzeText() {
    setError("");
    setResult(null);

    if (!text.trim()) {
      setError("תכתבי טקסט לבדיקה 🙂");
      return;
    }

    setLoading(true);

    try {
      var resp = await fetch("http://localhost:4000/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
      });

      var data = await resp.json();
      console.log("API RESPONSE:", data);


      if (!resp.ok) {
        setError("השרת החזיר שגיאה");
        console.log(data);
        return;
      }

      setResult(data);
    } catch {
      setError("לא הצלחתי להתחבר לשרת (האם הוא רץ?)");
    } finally {
      setLoading(false);
    }
  }

  // שליפה נוחה מהתוצאה (המבנה החדש)
  var riskScore = result ? result.riskScore : null;
  var riskLevel = result ? result.riskLevel : null;
  var foundBadWords = result ? result.foundBadWords : null;

  // אם את עדיין רוצה להציג "flagged" לדיבוג:
  var flagged = result && result.model ? result.model.flagged : null;

  // טקסט ותצוגה לפי רמה
  var levelText =
    riskLevel === "green" ? "🟢 תקין" :
    riskLevel === "yellow" ? "🟡 גבולי" :
    riskLevel === "red" ? "🔴 מסוכן" :
    "";

  var boxStyle = {
    marginTop: "15px",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "12px"
  };

  return (
    <div>
      <h2>Text Safety Analyzer</h2>

      <textarea
        placeholder="Paste text here..."
        value={text}
        onChange={function (e) { setText(e.target.value); }}
        rows={6}
        style={{ width: "100%", padding: "10px" }}
      />

      <button onClick={analyzeText} disabled={loading} style={{ marginTop: "10px" }}>
        {loading ? "בודק..." : "Analyze"}
      </button>

      {error ? <p style={{ marginTop: "10px" }}>{error}</p> : null}

      {result ? (
        <div style={boxStyle}>
          <p style={{ fontSize: "18px" }}>
            <b>תוצאה:</b> {levelText}
          </p>

          <p>
            <b>ציון סיכון:</b> {riskScore} / 100
          </p>

          {foundBadWords && foundBadWords.length > 0 ? (
            <p>
              <b>מילים שנמצאו:</b> {foundBadWords.join(", ")}
            </p>
          ) : (
            <p>
              <b>מילים שנמצאו:</b> לא נמצאו מילים בעייתיות במילון
            </p>
          )}

          {/* לדיבוג בלבד - אפשר למחוק אחרי */}
          <p style={{ opacity: 0.7 }}>
            <b>Flagged (model):</b> {String(flagged)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default TextAnalyzer;
