import PropTypes from "prop-types";
import styles from "./CheckCard.module.css";

export default function CheckCard(props) {
  var title = props.title;
  var text = props.text;
  var icon = props.icon;
  var type = props.type;
  var isActive = props.isActive;
  var onClick = props.onClick;

  function handleClick() {
    if (onClick) onClick(type);
  }

  var cardClass = styles.card;
  if (isActive) cardClass = styles.card + " " + styles.active;

  return (
    <button type="button" className={cardClass} onClick={handleClick}>
      <div className={styles.head}>
        <img className={styles.icon} src={icon} alt="" />
        <h3 className={styles.cardTitle}>{title}</h3>
      </div>

      <p className={styles.cardText}>{text}</p>
    </button>
  );
}

CheckCard.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
};

CheckCard.defaultProps = {
  isActive: false,
  onClick: null,
};
