export const C = {
  bg: "#10141B",
  panel: "#171D26",
  panelAlt: "#1D2430",
  raised: "#232B38",
  border: "#2A3242",
  text: "#E7EAEE",
  textDim: "#8A94A6",
  textFaint: "#5C6577",
  amber: "#E5A63C",
  teal: "#4FB8AE",
  coral: "#E2604F",
  violet: "#8C82E0",
};

export const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: C.coral,
  HIGH: C.amber,
  MEDIUM: C.teal,
  LOW: C.textFaint,
};

export const STATUS_LABEL: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
