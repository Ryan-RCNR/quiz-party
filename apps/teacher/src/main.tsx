import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './index.css'

// Validate required environment variables at startup
const requiredEnvVars = ['VITE_CLERK_PUBLISHABLE_KEY', 'VITE_API_URL', 'VITE_WS_URL'] as const
const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !import.meta.env[envVar]
)

if (missingEnvVars.length > 0) {
  const missingList = missingEnvVars.join(', ')
  if (import.meta.env.PROD) {
    console.error(`Missing required environment variables: ${missingList}`)
  }
  if (missingEnvVars.includes('VITE_CLERK_PUBLISHABLE_KEY')) {
    throw new Error('Missing Clerk Publishable Key')
  }
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
