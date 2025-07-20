import React from "react";
import "./CallToAction.css";

const CallToAction = () => {
  // Scroll to the hero section smoothly
  const scrollToHero = () => {
    const hero = document.querySelector(".hero-section");
    if (hero) {
      hero.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="cta-card">
      <h2 className="cta-headline">
        Ready to unlock your perfect palette?
      </h2>
      <p className="cta-subheadline">
        Discover the colors that make you shine—get your personalized color analysis now!
      </p>
      <button className="cta-btn" onClick={scrollToHero}>
        Get My Color Theory Analysis
      </button>
    </div>
  );
};

export default CallToAction;
