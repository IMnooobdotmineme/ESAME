import Image from "next/image";
import { cn } from "@/lib/utils";

interface EsameLogoProps {
  className?: string;
  height?: number;
  iconOnly?: boolean;
}

export function EsameLogo({ className, height = 32, iconOnly = false }: EsameLogoProps) {
  const src = iconOnly ? "/logo-icon.png" : "/logo-full.png";
  const aspect = iconOnly ? 280 / 313 : 1327 / 313;
  const width = Math.round(height * aspect);

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src={src}
        alt="Esame"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  );
}