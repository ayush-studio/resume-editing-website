import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/familjen-grotesk/400.css'
import '@fontsource/familjen-grotesk/500.css'
import '@fontsource/familjen-grotesk/600.css'
import '@fontsource/newsreader/500.css'
import '@fontsource/newsreader/600.css'
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/600.css'
import './index.css'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
