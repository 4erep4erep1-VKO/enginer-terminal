import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { UserSettingsProvider } from './components/UserSettingsContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserSettingsProvider>
      <App />
    </UserSettingsProvider>
  </StrictMode>,
);
