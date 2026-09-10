import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Shield, Bell, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const tabs=[
  { to:"/settings/profile", label:"Profile", icon:User },
  { to:"/settings/security", label:"Security", icon:Shield },
  { to:"/settings/preferences", label:"Preferences", icon:Bell },
  { to:"/settings/developer", label:"Developer", icon:Code2 },
];

export default function SettingsPage(){
  const loc = useLocation();
  // redirect default
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and workspace preferences.</p>
      </div>
      <div className="flex gap-4">
        <nav className="hidden sm:block w-48 shrink-0 space-y-1">
          {tabs.map(t=> (
            <NavLink key={t.to} to={t.to} className={({isActive})=> cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium", isActive || loc.pathname===t.to ? "bg-muted text-foreground":"text-muted-foreground hover:text-foreground hover:bg-muted/60")}>
              <t.icon className="size-4" /> {t.label}
            </NavLink>
          ))}
        </nav>
        <Card className="flex-1 p-6">
          <Outlet />
        </Card>
      </div>
    </div>
  )
}

export function SettingsProfile(){ return <div className="text-sm text-muted-foreground">Profile settings — edit via Profile page. <a href="/profile" className="text-primary underline">Go to Profile</a></div> }
export function SettingsPreferences(){ return <div className="space-y-4"><h3 className="font-semibold">Preferences</h3><p className="text-sm text-muted-foreground">Theme and notifications.</p></div> }
export function SettingsDeveloper(){ return <div className="space-y-3"><h3 className="font-semibold">Developer</h3><p className="text-sm text-muted-foreground">API keys & webhooks — coming soon.</p><div className="rounded-lg border border-border bg-muted p-4 font-mono text-xs">Authorization: Bearer &lt;token&gt;</div></div> }
