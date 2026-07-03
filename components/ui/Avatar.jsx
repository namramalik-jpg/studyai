import Image from "next/image";
import { memo } from "react";

function getInitials(name = "", email = "") {
  const source = name || email || "StudyAI";
  return source
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ src, name, email, size = "md", className = "" }) {
  const sizeClass = size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-20 w-20 text-xl" : "h-11 w-11 text-sm";
  const pixelSize = size === "sm" ? 36 : size === "lg" ? 80 : 44;

  if (src) {
    return (
      <Image
        src={src}
        alt={name ? `${name} avatar` : "User avatar"}
        width={pixelSize}
        height={pixelSize}
        loading="lazy"
        sizes={`${pixelSize}px`}
        unoptimized
        className={`${sizeClass} rounded-full border border-border object-cover dark:border-border ${className}`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex items-center justify-center rounded-full bg-primary font-black text-white shadow-sm ${className}`}
      aria-label={name || email || "StudyAI user"}
    >
      {getInitials(name, email)}
    </span>
  );
}

export default memo(Avatar);
