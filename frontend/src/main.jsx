import React, { StrictMode } from 'react';
import { createRoot, ReactDOM } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import {ThemeProvider} from './context/ThemeProvider.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)


// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
