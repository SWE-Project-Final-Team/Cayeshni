"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { userAvatarSrc } from "@/lib/api/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/expenses", label: "Expenses", icon: "receipt_long" },
  { href: "/groups", label: "Groups", icon: "group" },
  { href: "/friends", label: "Friends", icon: "diversity_3" },
  { href: "/settlements", label: "Settlements", icon: "payments" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const avatar = userAvatarSrc(profile?.profilePictureUrl);

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <div className="flex flex-1 min-h-0">
      <aside
        className={`${
          mobileOpen ? "flex" : "hidden"
        } md:flex flex-col h-screen w-64 bg-surface-container-low border-r border-outline-variant p-md gap-sm sticky top-0 shrink-0 z-30`}
      >
        <div className="mb-lg px-xs flex md:block items-center justify-between">
          <h1 className="font-headline-md text-headline-md text-primary">
            Cayeshni
          </h1>
          <button
            type="button"
            className="md:hidden text-on-surface-variant"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <Link
          href="/profile"
          aria-label="Open profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-md mb-lg px-xs rounded-lg -mx-xs py-xs hover:bg-surface-container-high transition-colors outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
        >
          {avatar ? (
            <img
              src={avatar}
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-outline-variant"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-surface font-label-sm text-label-sm font-bold">
              {(profile?.name ?? "?").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 text-left">
            <p className="font-label-sm text-label-sm text-on-surface truncate">
              {profile?.name ?? "…"}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant font-normal truncate">
              {profile?.email ?? ""}
            </p>
          </div>
        </Link>

        <nav className="flex flex-col gap-xs flex-grow">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-md px-md py-sm rounded-lg transition-all font-label-sm text-label-sm ${
                  active
                    ? "bg-secondary-fixed text-on-secondary-fixed font-bold scale-[0.98]"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${active ? "fill" : ""}`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/expenses"
          onClick={() => setMobileOpen(false)}
          className="w-full mt-md bg-secondary text-on-secondary font-label-sm text-label-sm py-sm px-md rounded-lg hover:shadow-md transition-shadow text-center"
        >
          Add expense
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full mt-sm border border-outline-variant text-primary font-label-sm text-label-sm py-sm px-md rounded-lg hover:bg-surface-container-high transition-colors"
        >
          Sign out
        </button>
      </aside>

      <main className="flex-grow flex flex-col min-w-0 bg-background overflow-y-auto">
        <header className="md:hidden flex justify-between items-center w-full px-container-margin py-md bg-surface border-b border-outline-variant sticky top-0 z-10">
          <button
            type="button"
            aria-label="Open menu"
            className="text-on-surface-variant p-sm"
            onClick={() => setMobileOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">
            Cayeshni
          </h1>
          <div className="w-10" />
        </header>
        {mobileOpen && (
          <button
            type="button"
            className="md:hidden fixed inset-0 bg-inverse-surface/40 z-10"
            aria-label="Dismiss menu"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <div className="p-container-margin md:p-xl max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      </div>
    </div>
  );
}
