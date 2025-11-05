import { Outlet, Link } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-[#f0f0f1]">
      <AdminSidebar />
      <main className="flex-1 ml-[200px]">
        {/* Top bar */}
        <div className="h-[46px] bg-[#23282d] border-b border-[#32373c] flex items-center justify-end px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 text-[#eee] text-sm">
            <span>您好，admin</span>
          </div>
        </div>

        {/* Content area */}
        <div className="p-2">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
