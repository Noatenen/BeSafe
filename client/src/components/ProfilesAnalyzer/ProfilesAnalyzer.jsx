import { useState } from 'react';
import styles from './ProfilesAnalyzer.module.css';


function ProfilesAnalyzer() {
  const [loadingText, setLoadingText] = useState('');
  const [platform, setPlatform] = useState(null);
  const [igFollowers, setFollowers] = useState('');
  const [igFollowing, setFollowing] = useState('');

  const handlePlatformSelect = (selectedPlatform) => {
    setPlatform(selectedPlatform);
    /*
    switch (selectedPlatform) {
    case 'instagram':
      handleInstagram();
      break;
    case 'facebook':
      handleFacebook();
      break;
    case 'phone':
      handlePhone();
      break;
    case 'tiktok':
      handleTikTok();
      break;
    default:
      break;
  }*/
  };

  const handleAnalyze = () => {
    setLoadingText('Loading...');
  };
  
  return (
    <div>
      <h2>Social Profiles Safety Analyzer</h2>
      <textarea placeholder="Paste username here..." />

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
      </div>
  );
}

export default ProfilesAnalyzer;
