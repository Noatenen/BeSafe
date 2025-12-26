import styles from './Home.module.css';
import ProfilesAnalyzer from '../../components/ProfilesAnalyzer/ProfilesAnalyzer';


const Home = () => {
  return (
    <div className={styles.home}>
      <h1 className={styles.headline}>Profile Analyzer</h1>
      <ProfilesAnalyzer />
    </div>
  );
};

export default Home;
