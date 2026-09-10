import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Command, Bell, Menu, X, Plus, LogOut, User, Shield, Settings, Link2 } from 'lucide-react';
import { useAuth } from '../features/auth/api/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header({ onMenuToggle, sidebarOpen }: { onMenuToggle: ()=>void; sidebarOpen: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const h = (e: MouseEvent)=> { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener("mousedown", h)
    return ()=> document.removeEventListener("mousedown", h)
  }, [])

  const handleLogout = async ()=> { setMenuOpen(false); await logout(); navigate("/login") }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4 backdrop-blur-md lg:px-6">
      <Link to="/" className="flex items-center gap-2.5 shrink-0">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Link2 className="size-4" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">LinkForge</span>
        <span className="hidden sm:inline-flex rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">BETA</span>
      </Link>

      <button onClick={onMenuToggle} className="ml-1 inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground md:hidden">
        {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {/* Search - hidden on mobile, shown desktop */}
      <div className="hidden flex-1 items-center md:flex max-w-md md:ml-6">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            onFocus={()=> setSearchFocused(true)}
            onBlur={()=> setSearchFocused(false)}
            placeholder="Search links, collections…"
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-20 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
          />
          <kbd className="pointer-events-none absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground md:inline-flex">
            <Command className="size-3" /> K
          </kbd>
        </div>
      </div>

      {/* Mobile search icon */}
      <button className="ml-auto inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card md:hidden">
        <Search className="size-4 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-2 md:ml-auto">
        <Link to="/create">
          <Button size="sm" className="hidden sm:inline-flex"><Plus className="size-3.5" /> Create Link</Button>
          <Button size="icon-sm" className="sm:hidden"><Plus className="size-4" /></Button>
        </Link>

        <button className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground">
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-card" />
        </button>

        <div className="relative" ref={ref}>
          <button onClick={()=> setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 hover:bg-muted">
            <Avatar className="size-7">
              <AvatarFallback>{(user?.displayName || user?.email || "U")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:block max-w-[120px] truncate">{user?.displayName || user?.username}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover p-1 shadow-lg">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-medium truncate">{user?.displayName || user?.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Link to="/profile" onClick={()=> setMenuOpen(false)} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted"><User className="size-4 text-muted-foreground" /> Profile</Link>
              <Link to="/security" onClick={()=> setMenuOpen(false)} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted"><Shield className="size-4 text-muted-foreground" /> Security</Link>
              <Link to="/settings" onClick={()=> setMenuOpen(false)} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted"><Settings className="size-4 text-muted-foreground" /> Settings</Link>
              <div className="my-1 h-px bg-border" />
              <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-destructive hover:bg-destructive/10"><LogOut className="size-4" /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
