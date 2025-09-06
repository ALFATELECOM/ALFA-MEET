import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Fix 100vh issues on mobile Safari using a CSS variable
const setAppViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

setAppViewportHeight();
window.addEventListener('resize', setAppViewportHeight);
window.addEventListener('orientationchange', setAppViewportHeight);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
