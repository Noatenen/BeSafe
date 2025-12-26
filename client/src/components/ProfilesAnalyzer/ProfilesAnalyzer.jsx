import { useState } from 'react';

function ProfilesAnalyzer() {
  const [loadingText, setLoadingText] = useState('');

  const handleAnalyze = () => {
    setLoadingText('Loading...');
  };

  return (
    <div>
      <h2>Social Profiles Safety Analyzer</h2>
      <textarea placeholder="Paste username here..." />
      <br />
      <button onClick={handleAnalyze}>Analyze</button>
      <h6>{loadingText}</h6>
    </div>
  );
}

export default ProfilesAnalyzer;
