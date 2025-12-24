import { useContext } from 'react';
import styles from './RandomDuck.module.css';
import { DuckContext } from '../../context/DuckContext';
import FirstButton from '../common/FirstButton/FirstButton.jsx';

const apiUrl = import.meta.env.VITE_SERVER_API_URL || 'http://localhost:5000';

const RandomDuck = () => {
  const { duck, getRandomDuck } = useContext(DuckContext);

  return (
    <div className={styles.container}>
      <FirstButton onClick={getRandomDuck}>Show Random Duck</FirstButton>
      {duck && (
        <div className={styles.duck}>
          <h2 className={styles.duckName}>{duck.name}</h2>
          <img
            src={`${apiUrl.replace(/\/$/, '')}/${duck.imageUrl.replace(/^\//, '')}`}
            alt={duck.name}
            className={styles.img}
          />
        </div>
      )}
    </div>
  );
};

export default RandomDuck;
