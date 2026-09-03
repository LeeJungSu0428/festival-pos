"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/super-admin", label: "Dashboard" },
  { href: "/super-admin/inventory", label: "Inventory" },
  { href: "/super-admin/sales-history", label: "Sales History" },
  { href: "/super-admin/products", label: "Products" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/super-admin" ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
