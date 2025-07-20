import React, { useState, useEffect } from 'react';
import './Recommendations.css';
import FloatingChatbot from '../components/FloatingChatbot';

const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:8000'}/recommendations`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (items) => {
    if (!Array.isArray(items)) {
      console.error("Expected items to be an array, got:", items);
      return {};
    }
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const groupedRecommendations = groupByCategory(recommendations || []);

  if (loading) {
    return (
      <div className="recommendations-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-page">
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={fetchRecommendations} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <div className="recommendations-header">
        <h1>Your Personalized Recommendations</h1>
        <p>Based on your seasonal color analysis and preferences</p>
      </div>

      <div className="recommendations-container">
        {Object.entries(groupedRecommendations).map(([category, items]) => (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            <div className="items-grid">
              {items.map((item, index) => (
                <div key={index} className="recommendation-card">
                  <div className="item-info">
                    <h3 className="item-name">{item.product}</h3>
                    <p className="item-description">{item.description}</p>
                  </div>
                  
                  {item.shopping_result && (
                    <div className="shopping-info">
                      {item.shopping_result.image && (
                        <img 
                          src={item.shopping_result.image} 
                          alt={item.shopping_result.title}
                          className="product-image"
                        />
                      )}
                      <div className="shopping-details">
                        <h4 className="product-title">{item.shopping_result.title}</h4>
                        {item.shopping_result.price && (
                          <p className="product-price">{item.shopping_result.price}</p>
                        )}
                        <a 
                          href={item.shopping_result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="buy-button"
                        >
                          View Product
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {!item.shopping_result && (
                    <div className="no-shopping-info">
                      <p>Search query: {item.query}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="recommendations-footer">
        <button 
          onClick={() => window.history.back()} 
          className="back-button"
        >
          ← Back
        </button>
        <button 
          onClick={() => window.location.href = '/'} 
          className="home-button"
        >
          Start Over
        </button>
      </div>
      
      {/* Floating Chatbot for additional recommendations */}
      <FloatingChatbot />
    </div>
  );
};

export default RecommendationsPage;
