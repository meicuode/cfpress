import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { ConfirmProvider } from './contexts/ConfirmContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import HomePage from './pages/HomePage'
import ThreadPage from './pages/ThreadPage'
import TagPage from './pages/TagPage'
import CategoryPage from './pages/CategoryPage'
import AboutPage from './pages/AboutPage'
import FriendsPage from './pages/FriendsPage'
import SearchPage from './pages/SearchPage'
import AdminThreadsPage from './pages/admin/AdminThreadsPage'
import AdminThreadEditorPage from './pages/admin/AdminThreadEditorPage'
import AdminCommentsPage from './pages/admin/AdminCommentsPage'
import AdminMenusPage from './pages/admin/AdminMenusPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminAdvancedPage from './pages/admin/AdminAdvancedPage'
import AdminFooterPage from './pages/admin/AdminFooterPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/thread/:id" element={<ThreadPage />} />
              <Route path="/tag/:tagName" element={<TagPage />} />
              <Route path="/category" element={<CategoryPage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/search" element={<SearchPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="threads" element={<AdminThreadsPage />} />
              <Route path="threads/new" element={<AdminThreadEditorPage />} />
              <Route path="threads/:id/edit" element={<AdminThreadEditorPage />} />
              <Route path="comments" element={<AdminCommentsPage />} />
              <Route path="appearance/menus" element={<AdminMenusPage />} />
              <Route path="appearance/footer" element={<AdminFooterPage />} />
              <Route path="appearance/categories" element={<AdminCategoriesPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="settings/general" element={<AdminSettingsPage />} />
              <Route path="settings/advanced" element={<AdminAdvancedPage />} />
              <Route path="settings/site" element={<AdminSettingsPage />} />
            </Route>
          </Routes>
        </Router>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
