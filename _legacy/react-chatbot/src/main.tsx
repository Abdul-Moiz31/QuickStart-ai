import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createGlobalStyle } from 'styled-components';

// Create global styles for font and general reset
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');

  body {
    margin: 0;
    padding: 0;
    font-family: 'Outfit', sans-serif;
    background-color: #f9f9f9;
  }
`;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalStyle />
    <App
      token="A1ED-1A711D66-26DB17E9"
      theme='tech'
      wantToShowSuggestions={true}
    />
  </React.StrictMode>
);
