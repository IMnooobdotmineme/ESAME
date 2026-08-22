
import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";

interface OrgTopbarProps {
  title: string;
  description?: string;
}

const ORG_CACHE_KEY = "org-chrome-cache";

type CachedOrg = { name: string; avatarUrl: string | null };

function readCache(): CachedOrg | null {
  try {
    const raw = window.localStorage.getItem(ORG_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedOrg) : null;
  } catch {
    return null;
  }
}

function writeCache(data: CachedOrg) {
  try {
    window.localStorage.setItem(ORG_CACHE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — ignore, cache is a nice-to-have
  }
}

export function OrgTopbar({ title, description }: OrgTopbarProps) {
  // Server-safe defaults — must match what's rendered on the server exactly.
  const [orgName, setOrgName] = useState("Org Admin");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Client-only, pre-paint: pull from cache so there's effectively no
  // visible flash, without ever mismatching the server-rendered HTML.
  useLayoutEffect(() => {
    const cached = readCache();
    if (cached) {
      setOrgName(cached.name);
      setAvatarUrl(cached.avatarUrl);
      setHasLoadedOnce(true);
    }
  }, []);

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const payload = await res.json();
        if (res.ok && payload?.user?.name) {
          const nextName = payload.user.name as string;
          const nextAvatar = (payload.user.avatarUrl ?? null) as string | null;
          setOrgName(nextName);
          setAvatarUrl(nextAvatar);
          writeCache({ name: nextName, avatarUrl: nextAvatar });
        }
      } catch {
        // no-op: keep cached/default label if the session is unavailable
      } finally {
        setHasLoadedOnce(true);
      }
    }

    async function loadNotifications() {
      try {
        const res = await fetch("/api/org/notifications", { cache: "no-store" });
        const payload = await res.json();
        if (res.ok) {
          setUnreadCount(Number(payload.counts?.unread ?? 0));
        }
      } catch {
        setUnreadCount(0);
      }
    }

    function refreshOrgChrome() {
      loadOrg();
      loadNotifications();
    }

    refreshOrgChrome();
    window.addEventListener("org-profile-updated", refreshOrgChrome);
    return () => window.removeEventListener("org-profile-updated", refreshOrgChrome);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 backdrop-blur px-6 h-16">
      <div>
        <h1 className="text-lg font-semibold text-navy-900">{title}</h1>
        {description && (
          <p className="text-xs text-slate-500 hidden sm:block">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        >
          <Bell size={18} className="text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 rounded-full hover:bg-slate-50 transition-colors pr-2 -mr-2 py-1"
        >
          <div className="relative h-9 w-9 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-medium shrink-0 overflow-hidden">
            {!hasLoadedOnce ? (
              <div className="h-full w-full animate-pulse bg-white/20" />
            ) : avatarUrl ? (
              <Image src={avatarUrl} alt={orgName} fill className="object-cover" />
            ) : (
              orgName.slice(0, 2).toUpperCase() || "OA"
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-navy-900 leading-tight">{orgName}</p>
            <p className="text-xs text-slate-500 leading-tight">ORGANIZATION</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
