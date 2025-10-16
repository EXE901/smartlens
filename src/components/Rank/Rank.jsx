import React from 'react';

const Rank = ({ name, entries, facesDetected }) => {
  return (
    <div className="tc pa5 br3 center">
      <p className="f1 pa2 white">{`${name}, your current entry count is...`}</p>
      <p className="f1 pa white">{entries}</p>
      
      {facesDetected > 0 && (
        <div style={{ 
          marginTop: '20px',
          background: 'rgba(0, 255, 203, 0.15)', 
          padding: '12px 24px', 
          borderRadius: '8px',
          border: '2px solid #00ffcb',
          display: 'inline-block'
        }}>
          <p className="f3 white ma0">
            🎯 {facesDetected} face{facesDetected > 1 ? 's' : ''} detected!
          </p>
        </div>
      )}
    </div>
  );
}

export default Rank;
