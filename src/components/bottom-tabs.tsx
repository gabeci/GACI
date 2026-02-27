"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/journal", label: "Journal" },
  { href: "/chatbot", label: "Chatbot" },
  { href: "/together", label: "Together" },
  { href: "/constellation", label: "Constellation" }
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <li key={tab.href}>
              <Link
                className={`block px-2 py-3 text-center text-xs font-medium ${
                  active ? "text-blue-600" : "text-gray-500"
                }`}
                href={tab.href}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
