import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Link2, FolderKanban, BarChart3, Activity, Zap, Split, Code2, Settings, Plus, Star, Archive, Hash } from 'lucide-react';
import { useGetCollections } from '../features/collections/api/useGetCollections';
import { useState } from 'react';
import { CollectionModal } from '../features/collections/components/CollectionModal';
import { cn } from '@/lib/utils';

interface NavItem { icon: React.ElementType; label: string; to: string; active?: boolean; count?: number }

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
              item.active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <item.icon className={cn("size-4 shrink-0", item.active ? "text-foreground" : "text-muted-foreground")} />
            <span className="flex-1 truncate">{item.label}</span>
            {item.count !== undefined && (
              <span className={cn("text-xs tabular-nums", item.active ? "text-muted-foreground" : "text-muted-foreground/60")}>{item.count}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

export const Sidebar = ({ collapsed = false, onClose }: { collapsed?: boolean; onClose?: ()=>void } = {}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { data } = useGetCollections();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentCollectionId = searchParams.get('collectionId');
  const pathname = location.pathname;
  const search = location.search;

  const isDashboard = pathname === '/' && !search;
  const isLinksFiltered = pathname === '/' && !!search;

  return (
    <>
      <aside className={cn(
        "flex w-[240px] shrink-0 flex-col border-r border-border bg-[#555879] text-[#F4EBD3] overflow-y-auto scrollbar-thin",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:shadow-xl",
        collapsed ? "max-md:hidden" : "max-md:flex",
        "max-md:w-[260px]"
      )}>
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/10 px-4 md:hidden">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#F4EBD3] text-[#555879]">
            <Link2 className="size-4" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[#F4EBD3]">LinkForge</span>
          <span className="ml-auto rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-[#DED3C4]">BETA</span>
        </div>

        <div className="flex-1 space-y-6 p-3 overflow-y-auto">
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-[#DED3C4]/70 mb-2">Overview</p>
            <Link to="/" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors", pathname === "/" ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:text-[#F4EBD3] hover:bg-white/10")}>
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-[#DED3C4]/70 mb-2">Link Management</p>
            <Link to="/links" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname === "/links" && !searchParams.get("isFavorite") && searchParams.get("status")!== "ARCHIVED" && !currentCollectionId ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <Link2 className="size-4" /> Links
              {data?.data && <span className="ml-auto text-xs text-[#DED3C4]/60">{data.data.reduce((a,c)=> a + (c._count?.links||0),0)}</span>}
            </Link>
            <Link to="/collections" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname === "/collections" ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <FolderKanban className="size-4" /> Collections
            </Link>
            <Link to="/links?isFavorite=true" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname === "/links" && searchParams.get("isFavorite")==="true" ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <Star className="size-4" /> Favorites
            </Link>
            <Link to="/links?status=ARCHIVED" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname === "/links" && searchParams.get("status")==="ARCHIVED" ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <Archive className="size-4" /> Archived
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-[#DED3C4]/70 mb-2">Insights</p>
            <Link to="/analytics" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname.startsWith("/analytics") ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <BarChart3 className="size-4" /> Analytics
            </Link>
            <Link to="/activity" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname === "/activity" ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <Activity className="size-4" /> Activity
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-[#DED3C4]/70 mb-2">Smart Routing</p>
            <Link to="/routing/rules" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname.includes("/routing") && pathname.includes("rules") ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <Zap className="size-4" /> Smart Rules
            </Link>
            <Link to="/routing/traffic" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname.includes("traffic") ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <Split className="size-4" /> Traffic Routing
            </Link>
          </div>

          {/* Collections dynamic */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#DED3C4]/70">Collections</p>
              <button onClick={()=> setIsModalOpen(true)} className="rounded-md p-1 text-[#DED3C4]/70 hover:bg-white/10 hover:text-[#F4EBD3]">
                <Plus className="size-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {data?.data?.slice(0,8).map((c)=> (
                <Link key={c.id} to={`/links?collectionId=${c.id}`} className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors", currentCollectionId===c.id && pathname === "/links" ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
                  <Hash className="size-3.5 opacity-60" />
                  <span className="truncate flex-1">{c.name}</span>
                  <span className="text-xs tabular-nums text-[#DED3C4]/60">{c._count?.links ?? 0}</span>
                </Link>
              ))}
              {(!data?.data || data.data.length===0) && (
                <p className="px-2.5 py-2 text-xs text-[#DED3C4]/60">No collections yet</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-[#DED3C4]/70 mb-2">Developer</p>
            <Link to="/developer" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname === "/developer" ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <Code2 className="size-4" /> Developer
            </Link>
          </div>

          <div className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-[#DED3C4]/70 mb-2">System</p>
            <Link to="/settings" className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", pathname.startsWith("/settings") || pathname==="/profile" || pathname==="/security" ? "bg-white/10 text-[#F4EBD3]" : "text-[#DED3C4]/80 hover:bg-white/10 hover:text-[#F4EBD3]")}>
              <Settings className="size-4" /> Settings
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-medium text-[#F4EBD3]">Need help?</p>
            <p className="mt-1 text-xs leading-relaxed text-[#DED3C4]/80">Check docs or contact support.</p>
          </div>
        </div>
      </aside>

      <CollectionModal isOpen={isModalOpen} onClose={()=> setIsModalOpen(false)} />
      {onClose && !collapsed && (
        <button className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden" onClick={onClose} aria-label="Close sidebar" />
      )}
    </>
  )
}
