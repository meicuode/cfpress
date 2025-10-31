import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ThreadPage from './pages/ThreadPage'
import TagPage from './pages/TagPage'
import CategoryPage from './pages/CategoryPage'
import AboutPage from './pages/AboutPage'
import FriendsPage from './pages/FriendsPage'
import SearchPage from './pages/SearchPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/thread/:id" element={<ThreadPage />} />
          <Route path="/tag/:tagName" element={<TagPage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
