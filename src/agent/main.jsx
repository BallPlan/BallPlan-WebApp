import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import AgentApp from './AgentApp.jsx';

createRoot(document.getElementById('agent-root')).render(
  <StrictMode>
    <AgentApp />
  </StrictMode>,
);
