import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import GreatHall from '@/pages/GreatHall'
import Lexicon from '@/pages/Lexicon'
import MemoryScrolls from '@/pages/MemoryScrolls'
import NotFound from '@/pages/NotFound'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<GreatHall />} />
        <Route path="lexicon" element={<Lexicon />} />
        <Route path="memory-scrolls" element={<MemoryScrolls />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
