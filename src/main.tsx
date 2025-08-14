import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';

// Dynamically create and inject the favicon link tag.
const setFavicon = () => {
  // Check if a favicon link already exists
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  // The inline SVG data for the sprout icon, matching the "CropVision" logo.
  const svgData = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2322c55e'%3E%3Cpath d='M7 20h10'/%3E%3Cpath d='M12 20V4'/%3E%3Cpath d='M7 4h10a5 5 0 0 1 0 10.3c-.62-.4-1.78-.88-3-1.6-1.22-.72-2-1-2-2'/%3E%3C/svg%3E";
  link.href = svgData;
};

// Call the function to set the favicon before rendering the app
setFavicon();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>
);
