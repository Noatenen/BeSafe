import PropTypes from "prop-types";
import styles from "./CheckSection.module.css";
import CheckCard from "./CheckCard";

import uploadIcon from "../../assets/images/upload.svg";
import linkIcon from "../../assets/images/link.svg";
import messageIcon from "../../assets/images/message.svg";

function CheckSection(props) {
  var onSelect = props.onSelect;
  var activeType = props.activeType;

  return (
    <section className={styles.section} aria-label="מה אפשר לבדוק?">
      <div className={styles.inner}>
        <h2 className={styles.title}>מה אפשר לבדוק?</h2>
        <p className={styles.subtitle}>
          המערכת שלנו תומכת בסוגי תוכן שונים - כדי לשמור עליך ברשת
        </p>

        <div className={styles.grid}>
          <CheckCard
            title="ניתוח טקסט"
            text={
              "בדיקת הודעות, פוסטים ומיילים\nלזיהוי קללות, שיח פוגעני,\nנסיונות הונאה וסימנים לבריאות ברשת"
            }
            icon={messageIcon}
            type="text"
            isActive={activeType === "text"}
            onClick={onSelect}
          />

          <CheckCard
            title="בדיקת לינקים"
            text={
              "בדיקה האם הקישור בטוח לפני\nשלוחצים עליו\n(פישינג, אתרים חשודים, התחזות)"
            }
            icon={linkIcon}
            type="links"
            isActive={activeType === "links"}
            onClick={onSelect}
          />

          <CheckCard
            title="בדיקת פרופילים"
            text={
              " בדיקה חכמה של פרופילים ברשתות חברתיות\n כדי לזהות חשבונות שנראים לא אמיתיים או חריגים"
            }
            icon={uploadIcon}
            type="profiles"
            isActive={activeType === "profiles"}
            onClick={onSelect}
          />
        </div>
      </div>
    </section>
  );
}

/* 🔒 PropTypes – חובה בגלל ESLint */
CheckSection.propTypes = {
  onSelect: PropTypes.func,
  activeType: PropTypes.string,
};

CheckSection.defaultProps = {
  onSelect: null,
  activeType: "",
};

export default CheckSection;
