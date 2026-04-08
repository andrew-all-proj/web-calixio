import React from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from './providers'
import { App } from './App'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <AppProviders>
    <App />
  </AppProviders>
)
