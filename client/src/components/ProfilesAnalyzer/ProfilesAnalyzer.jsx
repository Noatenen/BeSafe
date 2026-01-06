import { useMemo, useState } from 'react';
import styles from './ProfilesAnalyzer.module.css';

function ProfilesAnalyzer() {
  const [loadingText, setLoadingText] = useState('');
  const [platform, setPlatform] = useState(null);
  const [igFollowers, setFollowers] = useState('');
  const [igFollowing, setFollowing] = useState('');
  const [username, setUsername] = useState('');
  const [result, setResult] = useState(null);


  const canAnalyze = useMemo(() => username.trim().length > 0, [username]);

  const handlePlatformSelect = (selectedPlatform) => {
    setPlatform(selectedPlatform);
  };

  const handleAnalyze = async () => {
    try {
      setLoadingText('Loading...');
      setResult(null);

      if (platform !== 'instagram') {
        setLoadingText('Please choose Instagram');
        return;
      }

      const clean = username.trim();
      if (!clean) {
        setLoadingText('Please enter a username');
        return;
      }

      // 1) POST -> analyze (saves to DB)
      const analyzeRes = await fetch('http://localhost:3001/api/instagram/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: clean,
          followers_count: igFollowers,
          following_count: igFollowing,
        }),
      });

      const analyzeData = await analyzeRes.json();
      if (!analyzeData.ok) {
        setLoadingText(
          analyzeData.endpoints
            ? `Error: ${analyzeData.error} | ${JSON.stringify(analyzeData.endpoints)}`
            : `Error: ${analyzeData.error}`
        );
        return;
      }

      // 2) GET -> read from DB
      const getRes = await fetch(
        `http://localhost:3001/api/instagram/profile/${encodeURIComponent(clean)}`
      );
      const getData = await getRes.json();

      if (!getData.ok) {
        setLoadingText(`Error: ${getData.error}`);
        return;
      }

      setResult(analyzeData);
    } catch {
      setLoadingText('Network error');
    }
  };


return (
  <div className={styles.page}>
    <div className={styles.card}>
      <h2 className={styles.title}>Social Profiles Safety Analyzer</h2>

      <textarea
        className={styles.textarea}
        placeholder="Paste username here..."
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <h3 className={styles.subTitle}>Which platform?</h3>

      <div className={styles.platformRow}>
        <button
          type="button"
          onClick={() => handlePlatformSelect("instagram")}
          className={`${styles.Platformbutton} ${
            platform === "instagram" ? styles.selected : ""
          }`}
        >
          Instagram
        </button>

        <button
          type="button"
          onClick={() => handlePlatformSelect("facebook")}
          className={`${styles.Platformbutton} ${
            platform === "facebook" ? styles.selected : ""
          }`}
        >
          Facebook
        </button>
      </div>

      {platform === "instagram" && (
        <div className={styles.instagramFields}>
          <h4>Instagram details (optional):</h4>

          <label className={styles.fieldLabel}>
            Followers Number:
            <input
              className={styles.input}
              type="number"
              min="0"
              value={igFollowers}
              onChange={(e) => setFollowers(e.target.value)}
            />
          </label>

          <label className={styles.fieldLabel}>
            Following Number:
            <input
              className={styles.input}
              type="number"
              min="0"
              value={igFollowing}
              onChange={(e) => setFollowing(e.target.value)}
            />
          </label>
        </div>
      )}

      <button
        className={styles.analyzeBtn}
        onClick={handleAnalyze}
        disabled={!canAnalyze}
        type="button"
      >
        Analyze
      </button>

      <h6 className={styles.status}>{loadingText}</h6>
    </div>
    
     {result?.profile?.scoring && (
    <div className={styles.resultBox}>
      <h3>Analysis Result</h3>

      <p>
        <strong>Risk level:</strong>{" "}
        <span className={styles[result.profile.scoring.label]}>
          {result.profile.scoring.label}
        </span>
      </p>

      <p>
        <strong>Score:</strong> {result.profile.scoring.score} / 5
      </p>

      {Array.isArray(result.profile.scoring.reasons) &&
        result.profile.scoring.reasons.length > 0 && (
          <>
            <h4>Reasons</h4>
            <ul>
              {result.profile.scoring.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </>
        )}
        </div>
      )}
    </div>
  );
}

export default ProfilesAnalyzer;
