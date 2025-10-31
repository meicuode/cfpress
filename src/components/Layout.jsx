import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-b from-bg-primary to-[#2d3748] bg-cover bg-center bg-fixed before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-bg-primary/70"></div>

      <Navbar />
      <div className="flex max-w-[1200px] mx-auto mt-[90px] px-6 gap-8 w-full flex-1 max-[968px]:flex-col max-[968px]:px-5">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default Layout
