import { useLocation, useNavigate } from "react-router-dom";
import styles from "./ProfilesScore.module.css";

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const result = location.state?.result;

  if (!result) {
    return (
      <div className={styles.resultBox}>
        <h3>No results to show</h3>
        <button onClick={() => navigate("/")}>Go Back</button>
      </div>
    );
  }

  const scoring = result?.scoring ?? result?.profile?.scoring;
  return (
    <div className={styles.resultBox}>
      <h3>Analysis Result</h3>

      <button onClick={() => navigate("/")}>← New analysis</button>

      {scoring?.score != null ? (
        <>
          <p>
            <strong>Risk level:</strong>{" "}
            <span className={styles[scoring.label || "low"]}>{scoring.label || "unknown"}</span>
          </p>

          <p>
            <strong>Score:</strong> {scoring.score} / 5
          </p>

          {Array.isArray(scoring.reasons) && scoring.reasons.length > 0 && (
            <>
              <h4>Reasons:</h4>
              <ul>
                {scoring.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <p>No scoring data available.</p>
      )}
    </div>
  );
}
