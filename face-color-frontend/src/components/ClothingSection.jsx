import React from 'react';
import './ResultStyles.css';

const ClothingSection = ({ outfits }) => (
  <div className="result-section">
    <h2>Clothing Recommendations</h2>
    {outfits.map((outfit, idx) => (
      <div key={idx} className="outfit-style">
        <h4>{outfit.style}</h4>
        <p>Colors: {outfit.colors.join(', ')}</p>
      </div>
    ))}
  </div>
);

export default ClothingSection;
