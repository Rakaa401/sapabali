
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MapPin,
  BookOpen,
  BrainCircuit,
  Activity,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  List,
  Tags,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Destinations", href: "/admin/destinations", icon: MapPin },
  { label: "AI Structuring", href: "/admin/ai-structuring", icon: Sparkles },
  { label: "AI Logs", href: "/admin/ai-logs", icon: BrainCircuit },
  { label: "Activity", href: "/admin/activity", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const knowledgeLinks = [
  { label: "All Knowledge", href: "/admin/knowledge", icon: List },
  { label: "Categories", href: "/admin/knowledge/categories", icon: Tags },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(
    pathname.startsWith("/admin/knowledge")
  );
  const [loggingOut, setLoggingOut] = useState(false);

  const knowledgeActive = pathname.startsWith("/admin/knowledge");

  useEffect(() => {
    if (knowledgeActive) {
      setKnowledgeOpen(true);
    }
  }, [knowledgeActive]);

  async function handleLogout() {
    setLoggingOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoggingOut(false);
      return;
    }

    router.replace("/admin/login");
    router.refresh();
  }

  function closeSidebar() {
    setOpen(false);
  }

  return (
    <>
      <div className="fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white px-5 lg:hidden">
        <Link href="/admin" className="text-lg font-bold text-zinc-950">
          Sapa<span className="text-emerald-600">Bali</span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          aria-expanded={open}
          className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-zinc-200 px-6">
          <Link href="/admin" className="text-xl font-bold text-zinc-950">
            Sapa<span className="text-emerald-600">Bali</span>
          </Link>
        </div>

        <div className="px-5 pb-3 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Workspace
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <Link
            href="/admin"
            onClick={closeSidebar}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              pathname === "/admin"
                ? "bg-emerald-50 text-emerald-700"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <LayoutDashboard size={18} />
            Overview
          </Link>

          <Link
            href="/admin/destinations"
            onClick={closeSidebar}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              pathname.startsWith("/admin/destinations")
                ? "bg-emerald-50 text-emerald-700"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            <MapPin size={18} />
            Destinations
          </Link>

          <div>
            <button
              type="button"
              onClick={() => setKnowledgeOpen(!knowledgeOpen)}
              aria-expanded={knowledgeOpen}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                knowledgeActive
                  ? ""
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              <span className="flex items-center gap-3">
                <BookOpen size={18} />
                Knowledge Base
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  knowledgeOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {knowledgeOpen && (
         <div className="ml-4 mt-1 space-y-1 border-l border-transparent pl-4">
                {knowledgeLinks.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/admin/knowledge"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-emerald-50 font-medium text-emerald-700"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {navigation.slice(2).map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut size={18} />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
