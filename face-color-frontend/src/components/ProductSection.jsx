import React from 'react';
import './ResultStyles.css';

const ProductSection = ({ title, products }) => (
  <div className="result-section">
    <h2>{title}</h2>
    <div className="product-grid">
      {products.map((item, idx) => (
        <div key={idx} className="product-card">
          <img src={item.image} alt={item.name} className="product-image" />
          <h4>{item.name}</h4>
          {item.shade && <p><strong>Shade:</strong> {item.shade}</p>}
          <a href={item.url} target="_blank" rel="noreferrer">Buy Now</a>
        </div>
      ))}
    </div>
  </div>
);

export default ProductSection;
