"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}

export function DropdownMenu({
  trigger,
  children,
  align = "right",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function updatePosition() {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    setPos({
      top: rect.bottom + 6,
      left: align === "right" ? rect.right : rect.left,
      width: rect.width,
    });
  }

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align]);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;

      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function onScrollOrResize() {
      updatePosition();
    }

    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </div>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              left:
                align === "right"
                  ? undefined
                  : pos.left,
              right:
                align === "right"
                  ? window.innerWidth - pos.left
                  : undefined,
            }}
            className="z-50 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
            onClick={() => setOpen(false)}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  );
}

export function DropdownItem({
  children,
  onClick,
  danger,
  disabled,
  selected,
  className,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors",
        selected
          ? "bg-sky-400/10 font-semibold text-sky-600"
          : danger
          ? "text-red-600 hover:bg-slate-50"
          : "text-navy-900 hover:bg-slate-50",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
        className
      )}
    >
      {children}
    </button>
  );
}