import styles from "./Hero.module.css";
import shieldIcon from "../../assets/images/sheild.svg";
import uploadIcon from "../../assets/images/upload.svg";
import searchIcon from "../../assets/images/search.svg";

export default function Hero() {
  return (
    <section className={styles.hero} aria-label="Hero">
      <div className={styles.inner}>
        <div className={styles.heroCard}>
          <div className={styles.iconWrap}>
            <img className={styles.icon} src={shieldIcon} alt="" />
          </div>

          <h1 className={styles.title}>בדקו אם התוכן בטוח - לפני שסומכים עליו</h1>

          <p className={styles.subtitle}>
            כלי חינמי שעוזר לזהות הונאות, ניסיונות פישינג ותוכן פוגעני או מטעה.
            פשוט, ברור, וללא צורך בידע טכני.
          </p>
        </div>

        <div id="how" className={styles.howBlock}>
          <h2 className={styles.howTitle}>איך זה עובד?</h2>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <img src={uploadIcon} alt="" />
              </div>
              <div className={styles.stepHead}>שלב 1</div>
              <div className={styles.stepTitle}>הכניסו תוכן</div>
              <p className={styles.stepText}>
                הדביקו טקסט, העלו תמונה או <br />
                הדביקו קישור שתרצו לבדוק
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <img src={searchIcon} alt="" />
              </div>
              <div className={styles.stepHead}>שלב 2</div>
              <div className={styles.stepTitle}>נתחו</div>
              <p className={styles.stepText}>
                המערכת סורקת את התוכן, מזהה סיכונים, <br />
                דגלים אדומים ודפוסים חשודים
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <img src={shieldIcon} alt="" />
              </div>
              <div className={styles.stepHead}>שלב 3</div>
              <div className={styles.stepTitle}>המלצות להמשך פעולה</div>
              <p className={styles.stepText}>
                קבלו הערכת סיכון ברורה, <br />
                תובנות והמלצות להמשך פעולה
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
