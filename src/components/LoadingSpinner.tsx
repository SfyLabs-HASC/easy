import React from 'react';
import '../App.css'; // Useremo gli stili definiti in App.css

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="spinner"></div>
        <p className="loading-text">Transazione in corso, attendi...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;