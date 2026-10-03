"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/sessions", label: "Session Engine" },
  { href: "/ask", label: "Ask the Archive" },
  { href: "/patterns", label: "Pattern Intelligence" },
  { href: "/content", label: "Content Mine" },
  { href: "/assets", label: "STRYN Assets" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${active ? "bg-panel-2 text-text" : "text-muted hover:text-text"}`}
          >
            {active && <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />}
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
