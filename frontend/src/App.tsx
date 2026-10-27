import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import SearchBeforePost from './pages/SearchBeforePost'
import Discussions from './pages/Discussions'
import DoubtDetail from './pages/DoubtDetail'
import FAQ from './pages/FAQ'
import NewDoubt from './pages/NewDoubt'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/search" element={<SearchBeforePost />} />
      <Route path="/doubts" element={<Discussions />} />
      <Route path="/doubts/:id" element={<DoubtDetail />} />
      <Route path="/doubts/new" element={<NewDoubt />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
