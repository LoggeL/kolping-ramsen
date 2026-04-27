import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function IconHome(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
    </svg>
  );
}
export function IconNews(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 4h12a2 2 0 0 1 2 2v12a2 2 0 0 0 2-2V8" />
      <path d="M4 4v14a2 2 0 0 0 2 2h12" />
      <path d="M8 9h6M8 13h6M8 17h4" />
    </svg>
  );
}
export function IconCalendar(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
export function IconPage(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}
export function IconImages(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 16-5-5-4 4-2-2-7 7" />
    </svg>
  );
}
export function IconFolder(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}
export function IconChat(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.8-5.5A8 8 0 1 1 21 12Z" />
    </svg>
  );
}
export function IconExternal(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" />
    </svg>
  );
}
export function IconLogout(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  );
}
export function IconChevronUp(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}
export function IconChevronDown(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
export function IconChevronRight(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
export function IconPlus(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function IconLock(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
export function IconUpload(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5M12 3v12" />
    </svg>
  );
}
export function IconDownload(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </svg>
  );
}
export function IconChart(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 3v18h18" />
      <path d="M7 15v2M11 11v6M15 7v10M19 13v4" />
    </svg>
  );
}
export function IconSearch(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}
export function IconClose(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}
export function IconArrowLeft(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
export function IconPin(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 21s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
      <circle cx="12" cy="8" r="2.5" />
    </svg>
  );
}
export function IconList(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}
export function IconPencil(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 3 22l1.5-4.5Z" />
    </svg>
  );
}
