import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="https://github.com/EXE901" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/nour-alaa-428466371/" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </div>
        <p className="copyright">© 2025 Nour Alaa. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
