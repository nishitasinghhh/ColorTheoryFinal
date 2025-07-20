import React from "react";
import "./SeasonCard.css";

const SEASONS = [
  {
    emoji: "🌸",
    name: "Spring (Warm & Bright)",
    bestFor: "Warm undertones, light hair (blonde, light red), light eyes (blue, green, hazel).",
    characteristics: "Warm, fresh, clear, and light.",
    bestColors: [
      { name: "Coral", hex: "#FF7F50" },
      { name: "Peach", hex: "#FFDAB9" },
      { name: "Turquoise", hex: "#40E0D0" },
      { name: "Golden Yellow", hex: "#FFD700" },
      { name: "Ivory", hex: "#FFFFF0" }
    ],
    avoid: "Cool, dusty, or dark colors like gray, burgundy, or navy."
  },
  {
    emoji: "☀️",
    name: "Summer (Cool & Soft)",
    bestFor: "Cool undertones, ash blonde or light brown hair, cool-toned eyes (gray, blue, soft hazel).",
    characteristics: "Cool, soft, muted, and light.",
    bestColors: [
      { name: "Dusty Rose", hex: "#C4A69F" },
      { name: "Lavender", hex: "#B497BD" },
      { name: "Powder Blue", hex: "#B0E0E6" },
      { name: "Soft Navy", hex: "#6A7BA2" },
      { name: "Mauve", hex: "#E0B0FF" }
    ],
    avoid: "Warm and bright colors like orange or strong yellows."
  },
  {
    emoji: "🍂",
    name: "Autumn (Warm & Muted)",
    bestFor: "Warm undertones, dark or red hair, warm eye colors (hazel, brown, green).",
    characteristics: "Warm, rich, earthy, and muted.",
    bestColors: [
      { name: "Olive", hex: "#808000" },
      { name: "Burnt Orange", hex: "#CC5500" },
      { name: "Mustard Yellow", hex: "#FFDB58" },
      { name: "Forest Green", hex: "#228B22" },
      { name: "Cream", hex: "#FFFDD0" }
    ],
    avoid: "Cool blues, icy colors, and neon brights."
  },
  {
    emoji: "❄️",
    name: "Winter (Cool & Bright)",
    bestFor: "Cool undertones, dark brown or black hair, deep eye colors (dark brown, cool blue, icy hazel).",
    characteristics: "Cool, bold, clear, and high-contrast.",
    bestColors: [
      { name: "True Red", hex: "#FF0000" },
      { name: "Emerald Green", hex: "#50C878" },
      { name: "Royal Blue", hex: "#4169E1" },
      { name: "Black", hex: "#000000" },
      { name: "Icy Pastel", hex: "#E0FFFF" }
    ],
    avoid: "Earthy, warm, or muted tones like mustard, olive, or beige."
  }
];

const SeasonCards = () => (
  <div className="season-cards-row">
    {SEASONS.map((season, idx) => (
      <div className="season-card" key={season.name} style={{ animationDelay: `${0.1 + idx * 0.15}s` }}>
        <div className="season-emoji">{season.emoji}</div>
        <div className="season-name">{season.name}</div>
        <div className="season-bestfor">{season.bestFor}</div>
        <div className="season-characteristics">{season.characteristics}</div>
        <div className="season-swatches">
          {season.bestColors.map((color) => (
            <div className="season-swatch" key={color.name} title={color.name} style={{ background: color.hex }} />
          ))}
        </div>
        <div className="season-avoid">
          <span className="season-avoid-label">Avoid:</span> {season.avoid}
        </div>
      </div>
    ))}
  </div>
);

export default SeasonCards;
