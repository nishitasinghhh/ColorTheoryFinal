import React from 'react';
import './ResultStyles.css';

const SwatchSection = ({ swatches }) => (
  <div className="result-section">
    <h2>Recommended Color Swatches</h2>
    <div className="swatch-grid">
      {swatches.map((color, idx) => (
        <div key={idx} className="swatch-card">
          <img src={color.image} alt={color.name} className="swatch-image" />
          <p>{color.name}</p>
        </div>
      ))}
    </div>
  </div>
);

export default SwatchSection;
