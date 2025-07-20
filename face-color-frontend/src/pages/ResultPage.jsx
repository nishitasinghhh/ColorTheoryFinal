import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './ResultPage.css';
import ColorPalette from "../components/ColorPalette";
import FloatingChatbot from "../components/FloatingChatbot";

// MOCK DATA for development (remove before production!)
const MOCK_RESULT = {
  "feature_extraction": {
    "undertone": "Warm",
    "lip_rgb": [101, 110, 165],
    "hair_rgb": [29, 31, 37],
    "skin_rgb": [73, 91, 132],
    "left_eye_color": "Black",
    "right_eye_color": "Black",
    "dominant_eye_color": "Black"
  },
  "api_result": {
    "season": "Winter",
    "season_description": "Winter seasons are defined by cool undertones and high-contrast features. While this assessment includes a warm undertone, the overall visual features such as the deep black eye color, cool-toned skin (RGB: 73,91,132), and muted, cool lip and hair colors align with the traits of the Winter palette.",
    "full_seasonal_color_palette_grid": [
      [
        { "name": "Ice Blue", "hex": "#B3DDF2" },
        { "name": "Sky Blue", "hex": "#9AC9E3" },
        { "name": "Denim Blue", "hex": "#607DAB" },
        { "name": "Sapphire", "hex": "#355486" },
        { "name": "Deep Navy", "hex": "#1A2745" }
      ],
      [
        { "name": "Soft Lilac", "hex": "#D3CCE3" },
        { "name": "Lavender", "hex": "#B8A9C9" },
        { "name": "Amethyst", "hex": "#7E5E9C" },
        { "name": "Mulberry", "hex": "#503A6C" },
        { "name": "Black Plum", "hex": "#322240" }
      ],
      [
        { "name": "Powder Pink", "hex": "#FED6E0" },
        { "name": "Blush Pink", "hex": "#F8AFC8" },
        { "name": "Rosewood", "hex": "#CF6F8B" },
        { "name": "Crimson", "hex": "#A0485A" },
        { "name": "Deep Burgundy", "hex": "#5A2934" }
      ],
      [
        { "name": "Mint Green", "hex": "#DFFAF1" },
        { "name": "Seafoam", "hex": "#C2E5D7" },
        { "name": "Cool Emerald", "hex": "#5B8374" },
        { "name": "Teal", "hex": "#336E65" },
        { "name": "Deep Forest Green", "hex": "#1A3933" }
      ],
      [
        { "name": "Silver", "hex": "#C4C9CD" },
        { "name": "Gray Mist", "hex": "#A8ADB0" },
        { "name": "Slate Gray", "hex": "#7C8185" },
        { "name": "Charcoal", "hex": "#4A4F54" },
        { "name": "Black", "hex": "#1C1D1F" }
      ],
      [
        { "name": "Cool Red", "hex": "#DA5C65" },
        { "name": "Berry Red", "hex": "#B43A49" },
        { "name": "Wine", "hex": "#8A2735" },
        { "name": "Burgundy", "hex": "#671A28" },
        { "name": "Deep Crimson", "hex": "#4E121E" }
      ],
      [
        { "name": "Crystal White", "hex": "#FFFFFF" },
        { "name": "Snow", "hex": "#F8F9FA" },
        { "name": "Soft Gray", "hex": "#DDDEE1" },
        { "name": "Cool Ash", "hex": "#B7B8BC" },
        { "name": "Pewter", "hex": "#8D8F93" }
      ],
      [
        { "name": "Frosty Cyan", "hex": "#AECBDB" },
        { "name": "Icy Aqua", "hex": "#89B3C7" },
        { "name": "Arctic Teal", "hex": "#578A9D" },
        { "name": "Steel Blue", "hex": "#3A5E73" },
        { "name": "Deep Ocean Blue", "hex": "#223846" }
      ]
    ],
    "clothing_color_recommendations": [
      {
        "name": "Cool Sapphire",
        "hex": "#355486",
        "image_url": "https://www.colorhexa.com/355486.png"
      },
      {
        "name": "Deep Burgundy",
        "hex": "#5A2934",
        "image_url": "https://www.colorhexa.com/5a2934.png"
      },
      {
        "name": "Frosty Cyan",
        "hex": "#AECBDB",
        "image_url": "https://www.colorhexa.com/aecbdb.png"
      },
      {
        "name": "Ice Blue",
        "hex": "#B3DDF2",
        "image_url": "https://www.colorhexa.com/b3ddf2.png"
      }
    ],
    "foundation_recommendations": [
      {
        "brand": "Estée Lauder",
        "product": "Double Wear Foundation",
        "shade": "Cool Bone (1C1)",
        "hex": "#F0D3C1",
        "image_url": "https://www.esteelauder.com/media/export/cms/products/640x640/el_sku_Y8J201_640x640_0.jpg",
        "buy_link": "https://www.esteelauder.com/product/643/38588/product-catalog/makeup/double-wear/stay-in-place-makeup-spf-10"
      },
      {
        "brand": "MAC Cosmetics",
        "product": "Studio Fix Fluid",
        "shade": "NW20",
        "hex": "#E0C5B4",
        "image_url": "https://www.maccosmetics.com/media/export/cms/products/640x600/mac_sku_M6JC01_640x600_0.jpg",
        "buy_link": "https://www.maccosmetics.com/product/13847/1231/products/makeup/face/foundation/studio-fix-fluid-spf-15"
      }
    ],
    "lipstick_recommendations": [
      {
        "brand": "Charlotte Tilbury",
        "product": "Matte Revolution",
        "shade": "Walk of No Shame",
        "hex": "#8C2238",
        "image_url": "https://www.charlottetilbury.com/media/Charlotte-Tilbury-Matte-Revolution-Lipstick-Walk-of-No-Shame-Lid-Off-Closed-Packshot.png",
        "buy_link": "https://www.charlottetilbury.com/us/product/matte-revolution-walk-of-no-shame"
      },
      {
        "brand": "Dior",
        "product": "Rouge Dior",
        "shade": "999 Matte Red",
        "hex": "#B40A24",
        "image_url": "https://www.dior.com/product.diorrouge-843.png",
        "buy_link": "https://www.dior.com/en_us/products/Y0028458-rouge-dior-floral-lip-care-lipstick"
      }
    ],
    "blush_recommendations": [
      {
        "brand": "NARS",
        "product": "Blush",
        "shade": "Outlaw",
        "hex": "#CB5364",
        "image_url": "https://narscosmetics.com/media/catalog/product/NARS_Blush_Outlaw.png",
        "buy_link": "https://www.narscosmetics.com/USA/nars-blush/0607845054072.html"
      },
      {
        "brand": "Benefit Cosmetics",
        "product": "Box o’ Powder Blush",
        "shade": "Dallas",
        "hex": "#A7686B",
        "image_url": "https://www.benefitcosmetics.com/media/catalog_product/BI00-3000110-dallas_closed.png",
        "buy_link": "https://www.benefitcosmetics.com/us/en/product/box-o-powder-blush"
      }
    ],
    "clothing_style_recommendations": {
      "styles_to_wear": [
        "High-contrast outfits",
        "Monochromatic looks",
        "Sharp tailoring",
        "Cool-toned jewel colors",
        "Classic winter coats"
      ],
      "styles_to_avoid": [
        "Earthy warm tones",
        "Muted or faded colors",
        "Overly warm yellows and oranges",
        "Beige-heavy palettes"
      ]
    }
  }
};

const SEASON_EMOJIS = {
  Winter: "❄️",
  Spring: "🌸",
  Summer: "☀️",
  Autumn: "🍂"
};

const EmojiBurst = ({ season }) => {
  const [show, setShow] = React.useState(true);

  React.useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(timer);
  }, [season]);

  if (!show) return null;

  const count = 14;
  const emoji = SEASON_EMOJIS[season] || "🎨";
  return (
    <div className="emoji-burst">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (360 / count) * i;
        return (
          <span
            key={i}
            className="emoji-burst-emoji"
            style={{
              "--angle": `${angle}deg`
            }}
          >
            {emoji}
          </span>
        );
      })}
    </div>
  );
};

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result || MOCK_RESULT;

  // If no result data, redirect back to home
  React.useEffect(() => {
    if (!result) {
      navigate("/");
    }
  }, [result, navigate]);

  if (!result) return null;

  return (
    <div>
      <div className="result-hero">
        <span className="result-hero-icon" role="img" aria-label="palette">🎨</span>
        <h1 className="result-hero-title">Your Color Analysis Results</h1>
        <p className="result-hero-subtitle">
          <span role="img" aria-label="sparkle">✨</span>
          Ready to meet your most radiant self? Here’s your personalized palette and style secrets!
          <span role="img" aria-label="sparkle">✨</span>
        </p>
      </div>
      {/* Season Card */}
      <div className="season-card result-card">
        <div className="season-card-emoji" title={result.api_result?.season || ""}>
          {/* Feeble background emoji behind main emoji */}
          <span className="season-emoji-bg">
            {result.api_result?.season === "Winter" ? "❄️" :
              result.api_result?.season === "Spring" ? "🌸" :
              result.api_result?.season === "Summer" ? "☀️" :
              result.api_result?.season === "Autumn" ? "🍂" :
              "🎨"}
          </span>
          {/* Emoji burst animation */}
          <EmojiBurst season={result.api_result?.season} />
          {/* Main emoji in foreground */}
          <span className="season-emoji-main">
            {result.api_result?.season === "Winter" ? "❄️" :
              result.api_result?.season === "Spring" ? "🌸" :
              result.api_result?.season === "Summer" ? "☀️" :
              result.api_result?.season === "Autumn" ? "🍂" :
              "🎨"}
          </span>
        </div>
        <div className="season-card-text">
          {/* Feeble background emoji behind text */}
          <span className="season-emoji-bg-text">
            {result.api_result?.season === "Winter" ? "❄️" :
              result.api_result?.season === "Spring" ? "🌸" :
              result.api_result?.season === "Summer" ? "☀️" :
              result.api_result?.season === "Autumn" ? "🍂" :
              "🎨"}
          </span>
          <div className="season-card-title">
            Your Season: <span>{result.api_result?.season || "-"}</span>
          </div>
          <div className="season-card-description">
            {result.api_result?.season_description || "-"}
          </div>
        </div>
      </div>

      {/* Features Card */}
      {/* <div className="features-card result-card">
        <div className="features-title">Detected Features</div>
        <div className="features-grid">
          <div className="feature-label">Skin Undertone</div>
          <div className="feature-value">{result.feature_extraction?.undertone || "-"}</div>

          <div className="feature-label">Lip Color</div>
          <div className="feature-value">
            <span
              className="feature-swatch"
              style={{
                background: result.feature_extraction?.lip_rgb
                  ? `rgb(${result.feature_extraction.lip_rgb.join(",")})`
                  : "#eee"
              }}
            />
          </div>

          <div className="feature-label">Hair Color</div>
          <div className="feature-value">
            <span
              className="feature-swatch"
              style={{
                background: result.feature_extraction?.hair_rgb
                  ? `rgb(${result.feature_extraction.hair_rgb.join(",")})`
                  : "#eee"
              }}
            />
          </div>

          <div className="feature-label">Eye Color</div>
          <div className="feature-value">
            <span
              className="feature-swatch"
              style={{
                background: "#222"
              }}
            />
            <span className="feature-eye-label">
              {result.feature_extraction?.dominant_eye_color || "-"}
            </span>
          </div>
        </div>
      </div> */}
      {/* <pre>{JSON.stringify(result, null, 2)}</pre> */}
      {/* You will style and structure this later */}
      <ColorPalette paletteGrid={result.api_result?.full_seasonal_color_palette_grid} />
      
      {/* Floating Chatbot for personalized recommendations */}
      <FloatingChatbot />
    </div>
  );
};

export default ResultPage;
