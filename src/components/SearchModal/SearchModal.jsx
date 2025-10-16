import React from 'react';
import './SearchModal.css';

const SearchModal = ({ isOpen, onClose, results, searchQuery, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <h2 className="search-modal-title">
            🔍 Search Results {searchQuery && `for "${searchQuery}"`}
          </h2>
          <button className="search-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="search-modal-loading">
            <div className="search-spinner"></div>
            <p>Searching the web...</p>
          </div>
        ) : (
          <div className="search-modal-body">
            {results && results.visual_matches && results.visual_matches.length > 0 ? (
              <div className="search-results-grid">
                {results.visual_matches.slice(0, 12).map((result, idx) => (
                  <a
                    key={idx}
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="search-result-card"
                  >
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="search-result-image"
                    />
                    <div className="search-result-info">
                      <p className="search-result-title">{result.title}</p>
                      <p className="search-result-source">{result.source}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : results && results.images_results ? (
              <div className="search-results-grid">
                {results.images_results.slice(0, 12).map((result, idx) => (
                  <a
                    key={idx}
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="search-result-card"
                  >
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="search-result-image"
                    />
                    <div className="search-result-info">
                      <p className="search-result-title">{result.title}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="search-no-results">
                <p>No results found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
