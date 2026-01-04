import { useState, useEffect } from "react";

function TextAnalyzer({ onClose }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // פונקציה לעדכון גובה אוטומטי של התיבה
  const handleTextChange = (e) => {
    setText(e.target.value);
    e.target.style.height = '60px'; // גובה התחלתי נמוך (רבע מהקודם)
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  async function analyzeText() {
    setError("");
    setResult(null);
    if (!text.trim()) {
      setError("אופס! שכחת להדביק טקסט לבדיקה 🙂");
      return;
    }
    setLoading(true);

    try {
      const resp = await fetch("http://localhost:4000/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error();
      setResult(data);
    } catch {
      setError("משהו השתבש בחיבור לשרת. בדקי שהשרת רץ.");
    } finally {
      setLoading(false);
    }
  }

  const theme = result ? (
    result.riskLevel === "red" ? { color: "#FF4D4D", icon: "🚨", status: "זיהינו סכנה!" } :
    result.riskLevel === "yellow" ? { color: "#FFC107", icon: "⚠️", status: "חשוב להיזהר" } :
    { color: "#2ECC71", icon: "✅", status: "הכל נראה בטוח" }
  ) : { color: "#3D5A80" };

  return (
    <div style={{
      width: "100%", 
      maxWidth: "1140px", // הערך הסטנדרטי ליישור עם 3 כרטיסיות (שני את זה ל-1200px אם עדיין חסר קצת)
      margin: "0 auto",
      padding: "40px",
      direction: "rtl",
      backgroundColor: "#F0F7FF",
      borderRadius: "32px",
      border: "2px dashed #3D5A80",
      boxShadow: "0 15px 35px rgba(0,0,0,0.05)",
      boxSizing: "border-box", // מבטיח שה-Padding לא יגדיל את התיבה מעבר לרוחב המוגדר
      position: "relative",
      textAlign: "right"
    }}>
      
      {/* כפתור סגירה - מחובר ל-prop onClose */}
      <button 
        onClick={onClose}
        type="button"
        style={{
          position: "absolute",
          top: "25px",
          right: "25px", // העברתי לימין כדי שלא יתנגש עם הטקסט בעברית
          padding: "10px 18px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "15px",
          color: "#4A5568",
          fontWeight: "bold",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          zIndex: 10
        }}
      >
        סגירה ✕
      </button>

      {/* כותרות פנימיות */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "34px", color: "#1A375D", marginBottom: "8px", fontWeight: "800" }}>ניתוח טקסט חכם</h2>
        <p style={{ color: "#4A5568", fontSize: "18px" }}>הדביקו תוכן כדי לזהות דפוסים חשודים, הונאות או שיח פוגעני</p>
      </div>

      {/* תיבת טקסט - נמוכה ודינמית */}
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        padding: "20px",
        marginBottom: "20px",
        border: "1px solid #E2E8F0"
      }}>
        <textarea
          placeholder="הדביקו כאן את התוכן לבדיקה..."
          value={text}
          onChange={handleTextChange}
          style={{
            width: "100%",
            minHeight: "60px",
            height: "60px",
            border: "none",
            fontSize: "19px",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            color: "#2D3748",
            lineHeight: "1.5",
            overflow: "hidden"
          }}
        />
      </div>

      <button 
        onClick={analyzeText} 
        disabled={loading}
        style={{
          width: "100%",
          padding: "20px",
          backgroundColor: "#4A90E2",
          color: "white",
          border: "none",
          borderRadius: "16px",
          fontSize: "20px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 6px 15px rgba(74, 144, 226, 0.2)"
        }}
      >
        {loading ? "סורק..." : "נתחו את התוכן עכשיו"}
      </button>

      {error && <p style={{ color: "#E53E3E", textAlign: "center", marginTop: "15px" }}>{error}</p>}

      {/* אזור תוצאות */}
      {result && (
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "24px",
          padding: "30px",
          border: `2px solid ${theme.color}`,
          marginTop: "30px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
          animation: "fadeIn 0.4s ease-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
            <span style={{ fontSize: "45px" }}>{theme.icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "26px", color: theme.color, fontWeight: "800" }}>{theme.status}</h3>
              <p style={{ margin: 0, color: "#718096", fontSize: "16px" }}>ציון סיכון: {result.riskScore}%</p>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "17px", color: "#2D3748", marginBottom: "8px", fontWeight: "700" }}>ניתוח המערכת:</h4>
            <div style={{ backgroundColor: "#F8FAFC", padding: "20px", borderRadius: "15px", fontSize: "17px", color: "#1A365D", border: "1px solid #E2E8F0" }}>
              {result.explanation}
            </div>
          </div>

          {result.recommendation && (
            <div style={{
              backgroundColor: result.riskLevel === "green" ? "#F0FFF4" : "#FFFBEB",
              padding: "20px",
              borderRadius: "15px",
              borderRight: `6px solid ${theme.color}`,
              display: "flex", gap: "15px", alignItems: "flex-start"
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

export default TextAnalyzer;