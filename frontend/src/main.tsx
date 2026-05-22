import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Architecture from './pages/Architecture'
import FloatingSphere from './components/FloatingSphere'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FloatingSphere />
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/architecture" element={<Architecture />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
