// Small hand-drawn icon set (no icon-library dependency, no third-party
// glyphs) — keeps the design system self-contained per spec 30/56.
import type { SVGProps } from "react";

const paths: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9",
  book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5ZM20 18H6.5A2.5 2.5 0 0 0 4 20.5",
  calendar: "M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z",
  castle: "M4 21V10l3-2v3h2V7l3-2 3 2v4h2V8l3 2v11H4Zm4-4h2v4H8v-4Zm6 0h2v4h-2v-4Z",
  user: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-7 9a7 7 0 0 1 14 0",
  flame: "M12 2s-5 5.5-5 10a5 5 0 0 0 10 0c0-1.5-1-2.5-1-2.5s.5 2-1 2.5c1-2 0-4-1-5 0 1.5-1 2-1 2s1-2.5-1-5.5Z",
  play: "M6 4.5v15l13-7.5-13-7.5Z",
  pause: "M7 4h4v16H7zM13 4h4v16h-4z",
  check: "m5 13 4 4L19 7",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M9 7V4h6v3m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13",
  "chevron-right": "m9 6 6 6-6 6",
  trophy: "M6 4h12v3a6 6 0 0 1-12 0V4Zm0 0H3v1a3 3 0 0 0 3 3M18 4h3v1a3 3 0 0 1-3 3M10 16h4v2h-4zM8 21h8l-1-3H9l-1 3Z",
  lock: "M6 11V8a6 6 0 1 1 12 0v3m-13 0h14v9H5v-9Z",
  x: "M6 6l12 12M18 6 6 18",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  sparkles: "m12 3 1.8 4.6L18 9.5l-4.2 1.9L12 16l-1.8-4.6L6 9.5l4.2-1.9L12 3Z",
};

export function Icon({ name, className, ...props }: { name: keyof typeof paths } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
