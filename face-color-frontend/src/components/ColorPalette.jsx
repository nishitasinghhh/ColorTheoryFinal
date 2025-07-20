import React from "react";
import "./ColorPalette.css";

const ColorPalette = ({ paletteGrid, title = "Your Color Palette" }) => {
  if (!paletteGrid || !Array.isArray(paletteGrid)) return null;

  return (
    <div className="palette-section">
      <div className="palette-title">{title}</div>
      <div className="palette-grid">
        {paletteGrid.map((row, rowIdx) => (
          <div className="palette-row" key={rowIdx}>
            {row.map((color, idx) => (
              <div className="palette-swatch" key={idx}>
                <div
                  className="palette-color-animated"
                  style={{ background: color.hex }}
                  title={color.name}
                />
                <div className="palette-name">{color.name}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;
