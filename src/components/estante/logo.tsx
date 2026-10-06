import { cn } from "@/lib/utils";

/**
 * Babel mark: a tower built from bookshelves. Each shelf of standing books is narrower than the one
 * below, and a book leans at the top. Books use `currentColor`; `cut` is the background colour
 * showing through the spine bands.
 */
export function BabelMark({ className, cut = "var(--sand)" }: { className?: string; cut?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("shrink-0", className)}>
        <rect x="2" y="29.2" width="28" height="1.2" rx="0.6" fill="currentColor" />
        <rect x="6" y="21.4" width="20" height="1.2" rx="0.6" fill="currentColor" />
        <rect x="9.5" y="13.6" width="13" height="1.2" rx="0.6" fill="currentColor" />
        <rect x="12.5" y="5.8" width="7" height="1.2" rx="0.6" fill="currentColor" />
        <rect x="3" y="22.4" width="2.59" height="6.8" rx="0.45" fill="currentColor" />
        <rect x="3" y="23.9" width="2.59" height="0.55" fill={cut} />
        <rect x="6.34" y="21.8" width="2.59" height="7.4" rx="0.45" fill="currentColor" />
        <rect x="6.34" y="23.43" width="2.59" height="0.55" fill={cut} />
        <rect x="9.69" y="23" width="2.59" height="6.2" rx="0.45" fill="currentColor" />
        <rect x="9.69" y="24.36" width="2.59" height="0.55" fill={cut} />
        <rect x="13.03" y="21.8" width="2.59" height="7.4" rx="0.45" fill="currentColor" />
        <rect x="13.03" y="23.43" width="2.59" height="0.55" fill={cut} />
        <rect x="16.38" y="22.6" width="2.59" height="6.6" rx="0.45" fill="currentColor" />
        <rect x="16.38" y="24.05" width="2.59" height="0.55" fill={cut} />
        <rect x="19.72" y="22.2" width="2.59" height="7" rx="0.45" fill="currentColor" />
        <rect x="19.72" y="23.74" width="2.59" height="0.55" fill={cut} />
        <rect x="23.06" y="21.8" width="2.59" height="7.4" rx="0.45" fill="currentColor" />
        <rect x="23.06" y="23.43" width="2.59" height="0.55" fill={cut} />
        <rect x="26.41" y="22.8" width="2.59" height="6.4" rx="0.45" fill="currentColor" />
        <rect x="26.41" y="24.21" width="2.59" height="0.55" fill={cut} />
        <rect x="7" y="15.4" width="2.38" height="6" rx="0.45" fill="currentColor" />
        <rect x="7" y="16.72" width="2.38" height="0.55" fill={cut} />
        <rect x="10.12" y="14.8" width="2.38" height="6.6" rx="0.45" fill="currentColor" />
        <rect x="10.12" y="16.25" width="2.38" height="0.55" fill={cut} />
        <rect x="13.25" y="15.8" width="2.38" height="5.6" rx="0.45" fill="currentColor" />
        <rect x="13.25" y="17.03" width="2.38" height="0.55" fill={cut} />
        <rect x="16.38" y="14.8" width="2.38" height="6.6" rx="0.45" fill="currentColor" />
        <rect x="16.38" y="16.25" width="2.38" height="0.55" fill={cut} />
        <rect x="19.5" y="15.2" width="2.38" height="6.2" rx="0.45" fill="currentColor" />
        <rect x="19.5" y="16.56" width="2.38" height="0.55" fill={cut} />
        <rect x="22.62" y="15.6" width="2.38" height="5.8" rx="0.45" fill="currentColor" />
        <rect x="22.62" y="16.88" width="2.38" height="0.55" fill={cut} />
        <rect x="10.5" y="7.8" width="2.19" height="5.8" rx="0.45" fill="currentColor" />
        <rect x="10.5" y="9.08" width="2.19" height="0.55" fill={cut} />
        <rect x="13.44" y="8.4" width="2.19" height="5.2" rx="0.45" fill="currentColor" />
        <rect x="13.44" y="9.54" width="2.19" height="0.55" fill={cut} />
        <rect x="16.38" y="7.8" width="2.19" height="5.8" rx="0.45" fill="currentColor" />
        <rect x="16.38" y="9.08" width="2.19" height="0.55" fill={cut} />
        <rect x="19.31" y="8.2" width="2.19" height="5.4" rx="0.45" fill="currentColor" />
        <rect x="19.31" y="9.39" width="2.19" height="0.55" fill={cut} />
        <rect x="13.4" y="1.2" width="2.3" height="4.6" rx="0.45" fill="currentColor" />
        <rect x="13.4" y="2.21" width="2.3" height="0.55" fill={cut} />
        <g transform="rotate(-18 18.7 5.8)"><rect x="16.4" y="1.4" width="2.3" height="4.4" rx="0.45" fill="currentColor" /><rect x="16.4" y="2.37" width="2.3" height="0.55" fill={cut} /></g>
    </svg>
  );
}

/** Mark + wordmark, as used in the sidebar and the mobile header. */
export function BabelLogo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={cn("grid place-items-center rounded-[0.8rem] bg-sand text-ink", size === "md" ? "size-9" : "size-8")}>
        <BabelMark className={size === "md" ? "size-7" : "size-6"} />
      </span>
      <span className={cn("font-bold tracking-tight", size === "md" ? "text-xl" : "text-lg")}>Babel</span>
    </span>
  );
}
