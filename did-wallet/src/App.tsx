import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { SideMenuLayout } from './layout/sideMenuLayout'
import { PageTop } from './pages/top'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SideMenuLayout />}>
          <Route index element={<PageTop />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
