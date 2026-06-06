import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("megsy_cookies_accepted");
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (choice: string) => {
    localStorage.setItem("megsy_cookies_accepted", choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="cookie-card"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            id="cookieSvg"
          >
            <g>
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" fill="rgb(97, 81, 81)" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </g>
          </svg>

          <p className="cookieHeading">We use cookies.</p>
          <p className="cookieDescription">
            We use cookies to ensure that we give you the best experience on our website.{" "}
            <a href="https://privacy.megsyai.com" target="_blank" rel="noopener noreferrer">Learn more</a>.
          </p>

          <div className="buttonContainer">
            <button className="acceptButton" onClick={() => handleChoice("true")}>
              Accept
            </button>
            <button className="declineButton" onClick={() => handleChoice("declined")}>
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
