import Image from "next/image";
import { cn } from "@/lib/utils";

interface EsameLogoProps {
  className?: string;
  height?: number;
  iconOnly?: boolean;
}

export function EsameLogo({ className, height = 32, iconOnly = false }: EsameLogoProps) {
  // const src = iconOnly ? "/logo-icon.png" : "/logo-full.png";
  // const aspect = iconOnly ? 280 / 313 : 1327 / 313;
  // const width = Math.round(height * aspect);

  return (
    <div className={cn("flex items-center", className)}>
      <svg className="w-8 h-8 text-[#1f385c]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 4h2v16H5zM9 4h9v4H9zM9 10h7v4H9zM9 16h9v4H9z" />
      </svg>
      <p className="ml-2 text-xl font-bold text-[#1f385c]">ESAME</p>
    </div>
  );
}