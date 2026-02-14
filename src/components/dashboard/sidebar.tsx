"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Send,
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Building2 },
  { href: "/dashboard/send", label: "Send Reviews", icon: Send },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

function GlobeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" stroke="#00E5FF" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="4.5" ry="10" stroke="#00E5FF" strokeWidth="1.5" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="#00E5FF" strokeWidth="1.5" />
      <line x1="4" y1="7" x2="20" y2="7" stroke="#00E5FF" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="4" y1="17" x2="20" y2="17" stroke="#00E5FF" strokeWidth="1.5" strokeOpacity="0.5" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const nav = (
    <>
      {/* Brand header */}
      <div className="px-5 py-5 flex items-center gap-3">
        <GlobeIcon />
        <h1 className="text-lg font-semibold tracking-tight text-sidebar-text-active">
          MaMaDigital
        </h1>
      </div>

      {/* Divider below header */}
      <div className="mx-4 border-t border-sidebar-border" />

      {/* Primary navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px] relative",
                active
                  ? "bg-brand-light text-brand"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
              )}
            >
              {/* Active indicator bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand" />
              )}
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-colors duration-150",
                active ? "text-brand" : "text-sidebar-text group-hover:text-sidebar-text-active"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: Settings, Logout, Theme toggle */}
      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        <Link
          href="/dashboard/settings"
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px] relative",
            isActive("/dashboard/settings")
              ? "bg-brand-light text-brand"
              : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
          )}
        >
          {isActive("/dashboard/settings") && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand" />
          )}
          <Settings className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-150",
            isActive("/dashboard/settings") ? "text-brand" : "text-sidebar-text group-hover:text-sidebar-text-active"
          )} />
          Settings
        </Link>

        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active w-full transition-all duration-150 min-h-[44px]"
        >
          <LogOut className="h-5 w-5 shrink-0 text-sidebar-text group-hover:text-sidebar-text-active transition-colors duration-150" />
          Logout
        </button>

        {/* Divider above theme toggle */}
        <div className="pt-1 pb-0.5">
          <div className="border-t border-sidebar-border" />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active w-full transition-all duration-150 min-h-[44px]"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 shrink-0 text-sidebar-text group-hover:text-sidebar-text-active transition-colors duration-150" />
          ) : (
            <Moon className="h-5 w-5 shrink-0 text-sidebar-text group-hover:text-sidebar-text-active transition-colors duration-150" />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar -- dark themed to match sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-sidebar border-b border-sidebar-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <GlobeIcon />
          <h1 className="text-lg font-semibold tracking-tight text-sidebar-text-active">
            MaMaDigital
          </h1>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2.5 -mr-2 text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-150"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col transform transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-sidebar-border lg:bg-sidebar lg:h-screen lg:fixed">
        {nav}
      </aside>
    </>
  );
}
