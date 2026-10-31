
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Destinations", href: "/destinations" },
  { label: "Explore", href: "/explore" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="text-xl font-bold tracking-tight text-zinc-950"
        >
          Sapa<span className="text-emerald-600">Bali</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-600 transition hover:text-emerald-600"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <Link
          href="/explore"
          className="hidden rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 md:block"
        >
          Explore Bali
        </Link>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-zinc-700 transition hover:bg-zinc-100 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-zinc-200 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-zinc-700"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/explore"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-emerald-600"
            >
              Explore Bali
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
