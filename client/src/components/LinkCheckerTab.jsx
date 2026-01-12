import { useState } from "react";

function LinkCheckerTab() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setResult(null);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/link/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "משהו השתבש בבדיקה, נסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  const getTheme = (score) => {
    if (score >= 4) return { color: "#FF4D4D", icon: "🚨", status: "לינק מסוכן!", bg: "#FFF5F5" };
    if (score >= 2.6) return { color: "#FFC107", icon: "⚠️", status: "חשוב להיזהר", bg: "#FFFBEB" };
    return { color: "#2ECC71", icon: "✅", status: "הלינק נראה בטוח", bg: "#F0FFF4" };
  };

  const theme = result ? getTheme(result.score) : { color: "#3D5A80" };

  return (
    <div style={{
      width: "100%", 
      maxWidth: "1140px",
      margin: "0 auto",
      padding: "40px",
      direction: "rtl",
      backgroundColor: "#F0F7FF",
      borderRadius: "32px",
      border: "2px dashed #3D5A80",
      boxShadow: "0 15px 35px rgba(0,0,0,0.05)",
      boxSizing: "border-box",
      position: "relative",
      textAlign: "right",
      // --- הוספתי כאן את הפונט הראשי ---
      fontFamily: "'Rubik', sans-serif"
    }}>

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        {/* --- החרגתי את הכותרת (שתהיה בפונט המקורי) --- */}
        <h2 style={{ 
            fontSize: "34px", color: "#1A375D", marginBottom: "8px",
            fontWeight: "normal", // בפונטים מיוחדים לפעמים עדיף normal
            fontFamily: "'Omes', sans-serif"
        }}>
            בדיקת לינקים חשודים
        </h2>
        <p style={{ color: "#4A5568", fontSize: "18px" }}>
            הדביקו כאן את הקישור כדי לבדוק אם הוא בטוח לכניסה
        </p>
      </div>

      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "20px",
        marginBottom: "20px",
        border: "1px solid #E2E8F0"
      }}>
        <input
          type="text"
          placeholder="https://example.com..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: "100%", height: "50px", border: "none", fontSize: "19px", outline: "none",
            color: "#2D3748", direction: "ltr", textAlign: "left",
            // --- הוספתי כאן את הפונט לאינפוט ---
            fontFamily: "'Rubik', sans-serif"
          }}
        />
      </div>

      <button 
        onClick={handleClick} 
        disabled={!url || loading}
        style={{
          width: "100%", padding: "20px", backgroundColor: "#4A90E2", color: "white",
          border: "none", borderRadius: "16px", fontSize: "20px", fontWeight: "bold",
          cursor: !url || loading ? "not-allowed" : "pointer",
          opacity: !url || loading ? 0.7 : 1,
          boxShadow: "0 6px 15px rgba(74, 144, 226, 0.2)",
          // --- הוספתי כאן את הפונט לכפתור ---
          fontFamily: "'Rubik', sans-serif"
        }}
      >
        {loading ? "מבצעים סריקה..." : "בדיקת לינק"}
      </button>

      {error && <p style={{ color: "#E53E3E", textAlign: "center", marginTop: "15px" }}>{error}</p>}

      {result && (
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "30px",
          border: `2px solid ${theme.color}`, marginTop: "30px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.05)", animation: "fadeIn 0.4s ease-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
            <span style={{ fontSize: "45px" }}>{theme.icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "26px", color: theme.color, fontWeight: "800" }}>
                {theme.status}
              </h3>
              <p style={{ margin: 0, color: "#718096", fontSize: "16px", fontWeight: "600" }}>
                 דירוג סיכון: <span style={{ color: theme.color, fontSize: "20px" }}>{result.score}</span> / 5
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "17px", color: "#2D3748", marginBottom: "8px", fontWeight: "700" }}>ממצאים:</h4>
            <div style={{ 
                backgroundColor: "#F8FAFC", padding: "20px", borderRadius: "15px", 
                fontSize: "17px", color: "#1A365D", border: "1px solid #E2E8F0" 
            }}>
                {Array.isArray(result.reasons) && result.reasons.length > 0 ? (
                    <ul style={{ paddingRight: "20px", margin: 0 }}>
                        {result.reasons.map((r, i) => (
                            <li key={i} style={{ marginBottom: "5px" }}>{r}</li>
                        ))}
                    </ul>
                ) : (
                    <span>לא נמצאו דגלים אדומים מיוחדים.</span>
                )}
            </div>
          </div>

          {result.recommendation && (
            <div style={{
              backgroundColor: theme.bg, padding: "20px", borderRadius: "15px",
              borderRight: `6px solid ${theme.color}`, display: "flex", gap: "15px", alignItems: "flex-start"
            }}>
              <span style={{ fontSize: "22px" }}>💡</span>
              <div>
                <strong style={{ fontSize: "17px", color: "#2D3748" }}>המלצה לפעולה:</strong>
                <p style={{ margin: 0, fontSize: "16px", color: "#4A5568" }}>{result.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{` @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } `}</style>
    </div>
  );
}

export default LinkCheckerTab;