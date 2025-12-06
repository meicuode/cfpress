import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from './contexts/ThemeContext'
import { LayoutProvider } from './contexts/LayoutContext'
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
import SettingsPage from './pages/SettingsPage'
import AdminThreadsPage from './pages/admin/AdminThreadsPage'
import AdminThreadEditPage from './pages/admin/AdminThreadEditPage'
import AdminCommentsPage from './pages/admin/AdminCommentsPage'
import AdminMenusPage from './pages/admin/AdminMenusPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminAdvancedPage from './pages/admin/AdminAdvancedPage'
import AdminFooterPage from './pages/admin/AdminFooterPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminFilesPage from './pages/admin/AdminFilesPage'
import AdminThemePage from './pages/admin/AdminThemePage'
import AdminThemeColorPage from './pages/admin/AdminThemeColorPage'
import AdminLayoutPage from './pages/admin/AdminLayoutPage'

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <LayoutProvider>
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
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="threads" element={<AdminThreadsPage />} />
              <Route path="threads/new" element={<AdminThreadEditPage />} />
              <Route path="threads/:id/edit" element={<AdminThreadEditPage />} />
              <Route path="comments" element={<AdminCommentsPage />} />
              <Route path="files" element={<AdminFilesPage />} />
              <Route path="appearance/menus" element={<AdminMenusPage />} />
              <Route path="appearance/footer" element={<AdminFooterPage />} />
              <Route path="appearance/categories" element={<AdminCategoriesPage />} />
              <Route path="appearance/theme" element={<AdminThemePage />} />
              <Route path="appearance/theme/color" element={<AdminThemeColorPage />} />
              <Route path="appearance/theme/layout" element={<AdminLayoutPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="settings/general" element={<AdminSettingsPage />} />
              <Route path="settings/advanced" element={<AdminAdvancedPage />} />
              <Route path="settings/site" element={<AdminSettingsPage />} />
            </Route>
          </Routes>
        </Router>
          </ConfirmProvider>
        </ToastProvider>
      </LayoutProvider>
    </ThemeProvider>
    </HelmetProvider>
  )
}

export default App
