import React, { useState,useEffect } from 'react';
import './LandingPage.css';
import warm from '../images/warm-undertone.png'
import cool from '../images/cool-undertone.png'
import neutral from '../images/neutral-undertone.png'
import SeasonCards from '../components/SeasonCard';
import CallToAction from '../components/CallToAction';
import SeasonalQuiz from '../components/SeasonalQuiz';
import '../components/CallToAction.css';
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [undertone, setUndertone] = useState('Warm');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUndertoneModal, setShowUndertoneModal] = useState(false);
  const [showColorAnalysisModal, setShowColorAnalysisModal] = useState(false);
  const [showUndertoneDiscoveryModal, setShowUndertoneDiscoveryModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('undertone', undertone);

    try {
      const res = await fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:8000'}/analyze`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      // ✅ Handle api_result if it's a string
      if (typeof data.api_result === 'string') {
        try {
          const cleaned = data.api_result
            .replace(/^```json\n?/, '')
            .replace(/\n?```$/, '');
          data.api_result = JSON.parse(cleaned);
        } catch (parseErr) {
          console.warn('Parsing api_result failed:', parseErr);
          setError('Failed to parse response. Try another image.');
          setLoading(false);
          return;
        }
      }

      setResult(data);
      navigate("/result", { state: { result: data } });
    } catch (err) {
      setError('Error analyzing image. Please try again.');
    }
    setLoading(false);
  };
  useEffect(() => {
    if (result) {
      console.log('Result from API:', result);
    }
  }, [result]);
  return (
    <div className="landing-root">
      <div className="hero-section">
        <h1 className="landing-title">Discover Your Perfect Color Season</h1>
        <p className="landing-subtitle">
          Professional color analysis using AI to determine your seasonal color palette,<br/>
          makeup recommendations, and style guide.
        </p>
        
        {/* Info Buttons */}
        <div className="info-buttons-container">
          <button className="info-btn" onClick={() => setShowColorAnalysisModal(true)}>
            <span className="info-icon">💡</span>
            Why You Need Color Analysis
          </button>
          <button className="info-btn" onClick={() => setShowUndertoneDiscoveryModal(true)}>
            <span className="info-icon">🎨</span>
            Know About Your Undertone
          </button>
        </div>
        
        <div className="upload-bar-outer">
          <form onSubmit={handleAnalyze} className="upload-bar">
            <label className="custom-file-upload">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                required
                style={{ display: 'none' }}
              />
              <span>📁 Choose File</span>
            </label>
            <button
              type="button"
              className="take-photo-btn"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = handleFileChange;
                input.click();
              }}
            >
              📷 Take Photo
            </button>
            <button
              type="button"
              className="select-undertone-btn"
              onClick={() => setShowUndertoneModal(true)}
            >
              Select Undertone
            </button>
            <button
              type="button"
              className="quiz-btn"
              onClick={() => setShowQuizModal(true)}
            >
              🎯 Take Quiz
            </button>
            <button type="submit" disabled={loading || !selectedFile} className="analyze-btn">
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </form>
        </div>
      </div>

      <h2 className="season-cards-headline">
        Not sure what the 4 color seasons are? <span className="season-cards-highlight">We’ve got you covered!</span>
      </h2>
      <SeasonCards />
      <CallToAction />

      {error && <div style={{ color: '#e53e3e', marginBottom: 20 }}>{error}</div>}

      {result && result.api_result && result.feature_extraction && (
        <div className="analysis-root">
          {/* Season & Features */}
          <div className="analysis-header">
            <div className="season-card pretty-card">
              <div className="season-title">
                <span role="img" aria-label="season">❄️</span> Your Season: <b>{result.api_result?.season || '-'}</b>
              </div>
              <div className="season-description">
                {result.api_result?.season_description || '-'}
              </div>
            </div>
            <div className="features-card pretty-card">
              <div className="features-title">Detected Features</div>
              <div className="features-list">
                <div>Skin Undertone <span className="swatch" style={{background: result.feature_extraction?.undertone === "Cool" ? "#b3c6ff" : result.feature_extraction?.undertone === "Warm" ? "#ffe0b3" : "#e0e0e0"}}></span> {result.feature_extraction?.undertone || '-'}</div>
                <div>Lip Color <span className="swatch" style={{background: result.feature_extraction?.lip_rgb ? `rgb(${result.feature_extraction.lip_rgb.join(",")})` : '#eee'}}></span></div>
                <div>Hair Color <span className="swatch" style={{background: result.feature_extraction?.hair_rgb ? `rgb(${result.feature_extraction.hair_rgb.join(",")})` : '#eee'}}></span></div>
                <div>Eye Color <span className="swatch" style={{background: "#222"}}></span> {result.feature_extraction?.dominant_eye_color || '-'}</div>
              </div>
            </div>
          </div>

          {/* Full Seasonal Color Palette */}
          <div className="palette-section pretty-card">
            <div className="palette-title">Your Color Palette</div>
            <div className="palette-grid">
              {result.api_result?.full_seasonal_color_palette_grid?.map((row, rowIdx) => (
                <div className="palette-row" key={rowIdx}>
                  {row.map((color, idx) => (
                    <div className="palette-swatch" key={idx}>
                      <div className="palette-color" style={{background: color.hex}} title={color.name}></div>
                      <div className="palette-hex">{color.hex}</div>
                      <div className="palette-name">{color.name}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Makeup Recommendations */}
          <div className="makeup-section">
            <div className="makeup-title">Makeup Recommendations</div>
            <div className="makeup-grid">
              {/* Foundation */}
              <div className="makeup-card pretty-card">
                <div className="makeup-type">Foundation</div>
                {result.api_result?.foundation_recommendations?.map((item, idx) => (
                  <div className="makeup-item" key={idx}>
                    <div className="makeup-row">
                      <img src={item.image_url} alt={item.product} className="makeup-img" />
                      <span className="swatch" style={{background: item.hex}}></span>
                    </div>
                    <div className="makeup-brand">{item.brand}</div>
                    <div className="makeup-product">{item.product} <span className="makeup-shade">{item.shade}</span></div>
                    <a href={item.buy_link} target="_blank" rel="noopener noreferrer" className="buy-btn">Buy Now</a>
                  </div>
                ))}
              </div>
              {/* Lipstick */}
              <div className="makeup-card pretty-card">
                <div className="makeup-type">Lipstick</div>
                {result.api_result?.lipstick_recommendations?.map((item, idx) => (
                  <div className="makeup-item" key={idx}>
                    <div className="makeup-row">
                      <img src={item.image_url} alt={item.product} className="makeup-img" />
                      <span className="swatch" style={{background: item.hex}}></span>
                    </div>
                    <div className="makeup-brand">{item.brand}</div>
                    <div className="makeup-product">{item.product} <span className="makeup-shade">{item.shade}</span></div>
                    <a href={item.buy_link} target="_blank" rel="noopener noreferrer" className="buy-btn">Buy Now</a>
                  </div>
                ))}
              </div>
              {/* Blush */}
              <div className="makeup-card pretty-card">
                <div className="makeup-type">Blush</div>
                {result.api_result?.blush_recommendations?.map((item, idx) => (
                  <div className="makeup-item" key={idx}>
                    <div className="makeup-row">
                      <img src={item.image_url} alt={item.product} className="makeup-img" />
                      <span className="swatch" style={{background: item.hex}}></span>
                    </div>
                    <div className="makeup-brand">{item.brand}</div>
                    <div className="makeup-product">{item.product} <span className="makeup-shade">{item.shade}</span></div>
                    <a href={item.buy_link} target="_blank" rel="noopener noreferrer" className="buy-btn">Buy Now</a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clothing Recommendations */}
          <div className="clothing-section pretty-card">
            <div className="clothing-title">Clothing Recommendations</div>
            <div className="clothing-row">
              {result.api_result?.clothing_color_recommendations?.map((item, idx) => (
                <div className="clothing-card" key={idx}>
                  <img src={item.image_url} alt={item.name} className="clothing-img" />
                  <div className="clothing-name">{item.name}</div>
                  <div className="clothing-hex" style={{background: item.hex}}>{item.hex}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Clothing & Style Guide */}
          <div className="style-guide-section">
            <div className="style-title">Clothing & Style Guide</div>
            <div className="style-guide-grid">
              <div className="style-card pretty-card">
                <div className="style-header"><span role="img" aria-label="check">✔️</span> Styles to Wear</div>
                <ul>
                  {result.api_result?.clothing_style_recommendations?.styles_to_wear?.map((style, idx) => (
                    <li key={idx}>{style}</li>
                  ))}
                </ul>
              </div>
              <div className="style-card pretty-card">
                <div className="style-header"><span role="img" aria-label="cross">✖️</span> Styles to Avoid</div>
                <ul>
                  {result.api_result?.clothing_style_recommendations?.styles_to_avoid?.map((style, idx) => (
                    <li key={idx}>{style}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      {showUndertoneModal && (
  <div className="modal-overlay" onClick={() => setShowUndertoneModal(false)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <h2 className="modal-title">How to Choose Your Undertone</h2>
      <div className="undertone-modal-grid">
        {/* Warm Undertone */}
        <div className="undertone-modal-card">
          <img src={warm} alt="Warm Undertones" />
          <div className="undertone-modal-title">Warm Undertones</div>
          <div className="undertone-modal-desc">Have green/olive veins</div>
          <label className="undertone-radio-label">
            <input
              type="radio"
              name="undertone"
              checked={undertone === 'Warm'}
              onChange={() => {
                setUndertone('Warm');
                setShowUndertoneModal(false);
              }}
            />
            Select Warm
          </label>
        </div>
        {/* Neutral Undertone */}
        <div className="undertone-modal-card">
          <img src={neutral} alt="Neutral Undertones" />
          <div className="undertone-modal-title">Neutral Undertones</div>
          <div className="undertone-modal-desc">Have blue/green veins</div>
          <label className="undertone-radio-label">
            <input
              type="radio"
              name="undertone"
              checked={undertone === 'Neutral'}
              onChange={() => {
                setUndertone('Neutral');
                setShowUndertoneModal(false);
              }}
            />
            Select Neutral
          </label>
        </div>
        {/* Cool Undertone */}
        <div className="undertone-modal-card">
          <img src={cool} alt="Cool Undertones" />
          <div className="undertone-modal-title">Cool Undertones</div>
          <div className="undertone-modal-desc">Have purple/blue veins</div>
          <label className="undertone-radio-label">
            <input
              type="radio"
              name="undertone"
              checked={undertone === 'Cool'}
              onChange={() => {
                setUndertone('Cool');
                setShowUndertoneModal(false);
              }}
            />
            Select Cool
          </label>
        </div>
      </div>
      <button className="close-modal-btn" onClick={() => setShowUndertoneModal(false)}>Close</button>
    </div>
  </div>
)}
      {showColorAnalysisModal && (
        <div className="modal-overlay" onClick={() => setShowColorAnalysisModal(false)}>
          <div className="modal-content color-analysis-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowColorAnalysisModal(false)}>✕</button>
            
            <div className="color-analysis-header">
              <h2 className="color-analysis-title">Why You Need Color Analysis</h2>
              <p className="color-analysis-subtitle">
                Color analysis transforms how you look and feel by identifying the colors that enhance your natural beauty.
              </p>
            </div>

            <div className="transform-section">
              <h3 className="transform-title">Transform Your Appearance</h3>
              <div className="transform-content">
                <div className="transform-text">
                  <div className="benefit-item">
                    <div className="benefit-icon purple-bg">💜</div>
                    <div className="benefit-content">
                      <h4 className="benefit-title">Enhance Your Natural Glow</h4>
                      <p className="benefit-desc">The right colors make your skin look brighter, clearer, and more radiant.</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon blue-bg">👁️</div>
                    <div className="benefit-content">
                      <h4 className="benefit-title">Make Your Eyes Pop</h4>
                      <p className="benefit-desc">Colors that complement your undertone make your eyes appear brighter and more vibrant.</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <div className="benefit-icon green-bg">💚</div>
                    <div className="benefit-content">
                      <h4 className="benefit-title">Look Younger & Healthier</h4>
                      <p className="benefit-desc">Harmonious colors reduce signs of fatigue and aging, giving you a youthful appearance.</p>
                    </div>
                  </div>
                </div>
                <div className="transform-image">
                  <div className="comparison-card">
                    <div className="comparison-images">
                      <div className="comparison-img left-img"></div>
                      <div className="comparison-img right-img"></div>
                    </div>
                    <p className="comparison-caption">See the dramatic difference the right colors can make</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="benefits-section">
              <div className="benefit-card">
                <div className="benefit-card-icon orange-bg">🛍️</div>
                <h4 className="benefit-card-title">Smart Shopping</h4>
                <p className="benefit-card-desc">Stop buying clothes that don't work. Invest in pieces that make you look amazing every time.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-card-icon purple-bg">⏰</div>
                <h4 className="benefit-card-title">Save Time</h4>
                <p className="benefit-card-desc">Get dressed faster with a wardrobe full of colors that work perfectly together.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-card-icon green-bg">⭐</div>
                <h4 className="benefit-card-title">Boost Confidence</h4>
                <p className="benefit-card-desc">Feel confident knowing you always look your best in colors that enhance your natural beauty.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {showUndertoneDiscoveryModal && (
        <div className="modal-overlay" onClick={() => setShowUndertoneDiscoveryModal(false)}>
          <div className="modal-content undertone-discovery-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn undertone-close-btn" onClick={() => setShowUndertoneDiscoveryModal(false)}>✕</button>
            
            <div className="undertone-discovery-header">
              <h2 className="undertone-discovery-title">Discover Your Undertone</h2>
              <p className="undertone-discovery-subtitle">
                Understanding your skin's undertone is the foundation of finding your perfect colors. Select the option that best describes your skin.
              </p>
            </div>

            <div className="undertone-cards-section">
              <div className="undertone-cards-grid">
                {/* Warm Undertone Card */}
                <div className="undertone-card warm-card">
                  <div className="undertone-card-icon warm-icon">☀️</div>
                  <h3 className="undertone-card-title">Warm Undertone</h3>
                  <ul className="undertone-characteristics">
                    <li><span className="check-icon">✓</span> Golden or yellow base</li>
                    <li><span className="check-icon">✓</span> Veins appear greenish</li>
                    <li><span className="check-icon">✓</span> Gold jewelry looks better</li>
                    <li><span className="check-icon">✓</span> Tan easily in sun</li>
                  </ul>
                  <div className="undertone-color-palette">
                    <div className="color-circle warm-color-1"></div>
                    <div className="color-circle warm-color-2"></div>
                    <div className="color-circle warm-color-3"></div>
                    <div className="color-circle warm-color-4"></div>
                  </div>
                  <button 
                    className="undertone-select-btn warm-btn"
                    onClick={() => {
                      setUndertone('Warm');
                      setShowUndertoneDiscoveryModal(false);
                    }}
                  >
                    Select Warm
                  </button>
                </div>

                {/* Cool Undertone Card */}
                <div className="undertone-card cool-card">
                  <div className="undertone-card-icon cool-icon">❄️</div>
                  <h3 className="undertone-card-title">Cool Undertone</h3>
                  <ul className="undertone-characteristics">
                    <li><span className="check-icon">✓</span> Pink or blue base</li>
                    <li><span className="check-icon">✓</span> Veins appear bluish</li>
                    <li><span className="check-icon">✓</span> Silver jewelry looks better</li>
                    <li><span className="check-icon">✓</span> Burn easily in sun</li>
                  </ul>
                  <div className="undertone-color-palette">
                    <div className="color-circle cool-color-1"></div>
                    <div className="color-circle cool-color-2"></div>
                    <div className="color-circle cool-color-3"></div>
                    <div className="color-circle cool-color-4"></div>
                  </div>
                  <button 
                    className="undertone-select-btn cool-btn"
                    onClick={() => {
                      setUndertone('Cool');
                      setShowUndertoneDiscoveryModal(false);
                    }}
                  >
                    Select Cool
                  </button>
                </div>

                {/* Neutral Undertone Card */}
                <div className="undertone-card neutral-card">
                  <div className="undertone-card-icon neutral-icon">⚖️</div>
                  <h3 className="undertone-card-title">Neutral Undertone</h3>
                  <ul className="undertone-characteristics">
                    <li><span className="check-icon">✓</span> Mix of warm and cool</li>
                    <li><span className="check-icon">✓</span> Veins appear blue-green</li>
                    <li><span className="check-icon">✓</span> Both gold and silver work</li>
                    <li><span className="check-icon">✓</span> Tan moderately</li>
                  </ul>
                  <div className="undertone-color-palette">
                    <div className="color-circle neutral-color-1"></div>
                    <div className="color-circle neutral-color-2"></div>
                    <div className="color-circle neutral-color-3"></div>
                    <div className="color-circle neutral-color-4"></div>
                  </div>
                  <button 
                    className="undertone-select-btn neutral-btn"
                    onClick={() => {
                      setUndertone('Neutral');
                      setShowUndertoneDiscoveryModal(false);
                    }}
                  >
                    Select Neutral
                  </button>
                </div>
              </div>
            </div>

            <div className="quick-tips-section">
              <h3 className="quick-tips-title">Quick Tips to Identify Your Undertone</h3>
              <div className="quick-tips-grid">
                <div className="quick-tip">
                  <div className="tip-number purple-bg">1</div>
                  <div className="tip-content">
                    <h4 className="tip-title">Vein Test</h4>
                    <p className="tip-description">Look at your wrist veins in natural light. Green = warm, blue = cool, blue-green = neutral.</p>
                  </div>
                </div>
                <div className="quick-tip">
                  <div className="tip-number teal-bg">2</div>
                  <div className="tip-content">
                    <h4 className="tip-title">Jewelry Test</h4>
                    <p className="tip-description">Compare gold vs silver jewelry against your skin. Which makes you glow?</p>
                  </div>
                </div>
                <div className="quick-tip">
                  <div className="tip-number purple-bg">3</div>
                  <div className="tip-content">
                    <h4 className="tip-title">White Paper Test</h4>
                    <p className="tip-description">Hold white paper to your face. Does your skin look pink/red (cool) or yellow/golden (warm)?</p>
                  </div>
                </div>
                <div className="quick-tip">
                  <div className="tip-number orange-bg">4</div>
                  <div className="tip-content">
                    <h4 className="tip-title">Sun Reaction</h4>
                    <p className="tip-description">How does your skin react to sun? Tan easily (warm) or burn first (cool)?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showQuizModal && (
        <SeasonalQuiz
          onComplete={(quizResult) => {
            setResult(quizResult);
            setShowQuizModal(false);
            navigate("/result", { state: { result: quizResult } });
          }}
          onClose={() => setShowQuizModal(false)}
        />
      )}
    </div>
  );
}

export default LandingPage;
