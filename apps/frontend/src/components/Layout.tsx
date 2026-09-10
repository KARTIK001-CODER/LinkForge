import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close on route change? handled via sidebar link clicks

  useEffect(()=>{
    if (sidebarOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return ()=> { document.body.style.overflow="" }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header onMenuToggle={()=> setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar persists */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        {/* Mobile overlay sidebar */}
        {sidebarOpen && (
          <div className="md:hidden">
            <Sidebar onClose={()=> setSidebarOpen(false)} />
          </div>
        )}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
