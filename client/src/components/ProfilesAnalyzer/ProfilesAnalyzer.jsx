import { useState } from 'react';
import styles from './ProfilesAnalyzer.module.css';


function ProfilesAnalyzer() {
  const [loadingText, setLoadingText] = useState('');
  const [platform, setPlatform] = useState(null);
  const [igFollowers, setFollowers] = useState('');
  const [igFollowing, setFollowing] = useState('');
  const [username, setUsername] = useState('');
  const [result, setResult] = useState(null);


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
      setLoadingText(`Error: ${analyzeData.error}`);
      return;
    }

    // 2) GET -> read from DB
    const getRes = await fetch(`http://localhost:3001/api/instagram/profile/${encodeURIComponent(clean)}`);
    const getData = await getRes.json();

    if (!getData.ok) {
      setLoadingText(`Error: ${getData.error}`);
      return;
    }

    setResult(getData);
    setLoadingText('Done ✅');
  } catch {
    setLoadingText('Network error');
  }
};

  
  return (
    <div>
      <h2>Social Profiles Safety Analyzer</h2>
      <textarea
        placeholder="Paste username here..."
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />


      <h3>Which platform?</h3>
      <button
       onClick={() => handlePlatformSelect('instagram')}
        className={styles.Platformbutton}
        >
          Instagram</button>
      <button
       onClick={() => handlePlatformSelect('facebook')}
       className={styles.Platformbutton}
       >
        Facebook</button>
      <button
       onClick={() => handlePlatformSelect('Phone Number')}
       className={styles.Platformbutton}
       >
        Phone Number</button>
      <button
       onClick={() => handlePlatformSelect('TikTok')}
       className={styles.Platformbutton}
       >
        TikTok</button>
        
    {platform === 'instagram' && (
        <div className={styles.instagramFields}>
          <h4>Instagram Follows details:</h4>
          <label>
            Followers Number:
            <input
              type="number"
              min="0"
              value={igFollowers}
              onChange={(e) => setFollowers(e.target.value)}
              placeholder=""
            />
          </label>
          <label>
            Following Number:
            <input
              type="number"
              min="0"
              value={igFollowing}
              onChange={(e) => setFollowing(e.target.value)}
              placeholder=""
            />
          </label>
        </div>
      )}
      <br />
      <br />
      <button onClick={handleAnalyze}>Analyze</button>
      <h6>{loadingText}</h6>
      {result?.ok && (
      <div style={{ marginTop: 16 }}>
        <h4>DB Result</h4>
        <div><b>Full name:</b> {result.profile?.full_name ?? '-'}</div>
        <div><b>Verified:</b> {String(result.profile?.is_verified ?? '-')}</div>
        <div><b>Private:</b> {String(result.profile?.is_private ?? '-')}</div>

        <h5 style={{ marginTop: 12 }}>Metrics</h5>
        <pre>{JSON.stringify(result.profile?.metrics ?? {}, null, 2)}</pre>

        <h5 style={{ marginTop: 12 }}>Latest posts (count)</h5>
        <div>{result.posts?.length ?? 0}</div>
      </div>
    )}

      </div>
  );
}

export default ProfilesAnalyzer;
