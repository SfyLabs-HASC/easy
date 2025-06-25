import React from 'react';
import '../App.css'; // Usiamo gli stili globali

// Definiamo le proprietà che il componente accetterà
interface Props {
  status: 'loading' | 'success' | 'error';
  message: string;
  onClose: () => void; // Funzione per chiudere il popup
}

const TransactionStatusModal = ({ status, message, onClose }: Props) => {
  
  // Funzione per renderizzare l'icona corretta in base allo stato
  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <div className="spinner"></div>;
      case 'success':
        return <div className="success-icon"></div>;
      case 'error':
        return <div className="error-icon"></div>;
      default:
        return null;
    }
  };

  return (
    <div className="loading-overlay">
      <div className="loading-box">
        {renderIcon()}
        <p className="loading-text">{message}</p>
        
        {/* Mostra il pulsante "OK" solo se la transazione non è più in caricamento */}
        {status !== 'loading' && (
          <button onClick={onClose} className="web3-button">
            OK
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionStatusModal;
