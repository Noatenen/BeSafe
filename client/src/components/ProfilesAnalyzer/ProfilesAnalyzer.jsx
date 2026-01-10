import { useState, useMemo } from "react";
import PropTypes from "prop-types";

function ProfilesAnalyzer({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // שדות הטופס
  const [platform, setPlatform] = useState("instagram");
  const [username, setUsername] = useState("");
  const [igFollowers, setFollowers] = useState("");
  const [igFollowing, setFollowing] = useState("");

  const [result, setResult] = useState(null);

  const canAnalyze = useMemo(() => {
    return username.trim().length > 0;
  }, [username]);

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);

    if (platform !== "instagram") {
      setError("כרגע יש תמיכה רק באינסטגרם");
      setLoading(false);
      return;
    }

    try {
      // המרה למספרים רק אם הוזן ערך
      const bodyPayload = {
        username: username.trim(),
        followers_count: igFollowers ? Number(igFollowers) : undefined,
        following_count: igFollowing ? Number(igFollowing) : undefined,
      };

      const res = await fetch("http://localhost:4000/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      // תמיכה במקרי קצה של שגיאות
      if (!res.ok || (data.ok === false)) {
        throw new Error(data.error || "שגיאה בניתוח הפרופיל");
      }

      setResult(data); 
    } catch (err) {
      console.error(err);
      setError(err.message || "שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  }

  // --- פונקציית עזר: נרמול הנתונים ---
  const getUnifiedResult = (data) => {
    if (!data) return null;

    const coreData = data.scoring || data.profile?.scoring || data;

    const score = Number(coreData.score || 0);
    const reasons = coreData.reasons || [];
    const aiData = data.ai_captions || coreData.ai_captions;

    return {
        score: score,
        reasons: reasons,
        aiData: aiData
    };
  };

  const displayData = getUnifiedResult(result);

  // --- לוגיקת עיצוב לפי דירוג 1-5 ---
  const getTheme = (score) => {
    if (score >= 4) {
      return { 
        color: "#FF4D4D", 
        icon: "🚨", 
        status: "פרופיל בסיכון גבוה", 
        bg: "#FFF5F5" 
      };
    }
    if (score >= 2.6) { 
      return { 
        color: "#FFC107", 
        icon: "⚠️", 
        status: "פרופיל חשוד", 
        bg: "#FFFBEB" 
      };
    }
    return { 
      color: "#2ECC71", 
      icon: "✅", 
      status: "נראה אמין", 
      bg: "#F0FFF4" 
    };
  };

  const theme = displayData ? getTheme(displayData.score) : { color: "#3D5A80" };

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
      textAlign: "right"
    }}>
      
      {onClose && (
        <button 
          onClick={onClose}
          type="button"
          style={{
            position: "absolute",
            top: "25px",
            right: "25px",
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
      )}

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "34px", color: "#1A375D", marginBottom: "8px", fontWeight: "800" }}>
            בדיקת פרופיל מתחזה
        </h2>
        <p style={{ color: "#4A5568", fontSize: "18px" }}>
            הזינו שם משתמש (User) כדי לבדוק את אמינות הפרופיל
        </p>
      </div>

      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "24px",
        padding: "30px",
        marginBottom: "20px",
        border: "1px solid #E2E8F0"
      }}>
        
        <div style={{ display: "flex", gap: "15px", marginBottom: "20px", justifyContent: "center" }}>
            <button 
                onClick={() => setPlatform("instagram")}
                style={{
                    padding: "10px 20px",
                    borderRadius: "12px",
                    border: platform === "instagram" ? "2px solid #E1306C" : "1px solid #CBD5E0",
                    backgroundColor: platform === "instagram" ? "#FFF5F8" : "white",
                    color: platform === "instagram" ? "#E1306C" : "#4A5568",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "16px"
                }}
            >
                Instagram 📸
            </button>
            <button 
                onClick={() => setPlatform("facebook")}
                style={{
                    padding: "10px 20px",
                    borderRadius: "12px",
                    border: platform === "facebook" ? "2px solid #1877F2" : "1px solid #CBD5E0",
                    backgroundColor: platform === "facebook" ? "#E7F3FF" : "white",
                    color: platform === "facebook" ? "#1877F2" : "#4A5568",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "16px"
                }}
            >
                Facebook (בקרוב)
            </button>
        </div>

        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#2D3748" }}>שם משתמש:</label>
        <input
          type="text"
          placeholder="noa_kirel / official_page..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            height: "50px",
            padding: "0 15px",
            borderRadius: "12px",
            border: "1px solid #CBD5E0",
            fontSize: "18px",
            outline: "none",
            color: "#2D3748",
            direction: "ltr",
            textAlign: "left",
            marginBottom: "20px",
            boxSizing: "border-box"
          }}
        />

        {platform === "instagram" && (
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#718096" }}>מספר עוקבים (Followers):</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="לדוגמה: 150"
                        value={igFollowers}
                        onChange={(e) => setFollowers(e.target.value)}
                        style={{
                            width: "100%", height: "45px", padding: "0 10px", borderRadius: "10px",
                            border: "1px solid #CBD5E0", fontSize: "16px", outline: "none", boxSizing: "border-box"
                        }}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#718096" }}>מספר נעקבים (Following):</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="לדוגמה: 300"
                        value={igFollowing}
                        onChange={(e) => setFollowing(e.target.value)}
                        style={{
                            width: "100%", height: "45px", padding: "0 10px", borderRadius: "10px",
                            border: "1px solid #CBD5E0", fontSize: "16px", outline: "none", boxSizing: "border-box"
                        }}
                    />
                </div>
            </div>
        )}
      </div>

      <button 
        onClick={handleAnalyze} 
        disabled={!canAnalyze || loading}
        style={{
          width: "100%",
          padding: "20px",
          backgroundColor: "#4A90E2",
          color: "white",
          border: "none",
          borderRadius: "16px",
          fontSize: "20px",
          fontWeight: "bold",
          cursor: !canAnalyze || loading ? "not-allowed" : "pointer",
          opacity: !canAnalyze || loading ? 0.7 : 1,
          boxShadow: "0 6px 15px rgba(74, 144, 226, 0.2)"
        }}
      >
        {loading ? "מבצע ניתוח פרופיל..." : "בצע בדיקה"}
      </button>

      {error && <p style={{ color: "#E53E3E", textAlign: "center", marginTop: "15px", fontWeight: "bold" }}>{error}</p>}

      {displayData && (
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
              <h3 style={{ margin: 0, fontSize: "26px", color: theme.color, fontWeight: "800" }}>
                {theme.status}
              </h3>
              <p style={{ margin: 0, color: "#718096", fontSize: "16px", fontWeight: "600" }}>
                 דירוג אמינות: <span style={{ color: theme.color, fontSize: "20px" }}>{displayData.score}</span> / 5
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "17px", color: "#2D3748", marginBottom: "8px", fontWeight: "700" }}>ניתוח המערכת:</h4>
            <div style={{ 
                backgroundColor: "#F8FAFC", 
                padding: "20px", 
                borderRadius: "15px", 
                fontSize: "17px", 
                color: "#1A365D", 
                border: "1px solid #E2E8F0" 
            }}>
                {Array.isArray(displayData.reasons) && displayData.reasons.length > 0 ? (
                    <ul style={{ paddingRight: "20px", margin: 0 }}>
                        {displayData.reasons.map((r, i) => (
                            <li key={i} style={{ marginBottom: "5px" }}>{r}</li>
                        ))}
                    </ul>
                ) : (
                    <span>לא נמצאו אינדיקציות חשודות.</span>
                )}
            </div>
          </div>

          {displayData.aiData && displayData.aiData.suspiciousness > 0.5 && (
            <div style={{
                marginTop: "15px",
                padding: "15px",
                backgroundColor: "#FFF5F5",
                borderRadius: "12px",
                border: "1px solid #FECACA"
            }}>
                <strong style={{color: "#C53030"}}>🤖 ניתוח טקסט בפוסטים:</strong>
                <p style={{margin: "5px 0 0 0", fontSize: "15px", color: "#742A2A"}}>
                    ה-AI זיהה דפוסים חשודים בטקסט של הפוסטים (ציון: {Math.round(displayData.aiData.suspiciousness * 100)}%).
                </p>
            </div>
          )}

        </div>
      )}
      <style>{` @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } `}</style>
    </div>
  );
}

ProfilesAnalyzer.propTypes = {
  onClose: PropTypes.func,
};

export default ProfilesAnalyzer;