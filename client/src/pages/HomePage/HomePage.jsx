import { useState } from "react";

import TextAnalyzer from "../../components/TextAnalyzer";
import styles from "./Home.module.css";

import NavBar from "../../components/NavBar/NavBar";
import Hero from "../../components/Hero/Hero";
import CheckSection from "../../components/CheckSection/CheckSection";
import Footer from "../../components/Footer/Footer";

export default function HomePage() {
  var [activeCheckType, setActiveCheckType] = useState(""); // "text" | "links" | "images" | ""

  function openCheck(type) {
    setActiveCheckType(type);

    // גלילה נעימה לפאנל אחרי שה־DOM מתעדכן
    setTimeout(function () {
      var el = document.getElementById("check-panel");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function closeCheck() {
    setActiveCheckType("");
  }

  return (
    <div className={styles.page}>
      <NavBar />
      <Hero />

      {/* החלק של שלוש הכרטיסיות */}
      <CheckSection activeType={activeCheckType} onSelect={openCheck} />

      {/* פאנל הבדיקה שמופיע בלחיצה */}
      {activeCheckType === "text" ? (
        <section 
          id="check-panel" 
          className={styles.checkPanel} 
          aria-label="אזור בדיקה"
          style={{ width: "100%", padding: "20px 0" }} // הבטחת רוחב מלא ב-container
        >
          {/* אנחנו מעבירים את פונקציית הסגירה כ-prop */}
          <TextAnalyzer onClose={closeCheck} />
        </section>
      ) : null}

      {/* הערה: אם בעתיד תוסיפו לינקים/תמונות, תוכלו להוסיף כאן תנאים נוספים */}

      <Footer />
    </div>
  );
}