import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Optional small badge, e.g. a count. */
  badge?: string | number;
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const Icons = {
  dashboard: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  transactions: (
    <svg {...iconProps}>
      <path d="M7 4v16M7 20l-3-3M7 20l3-3" />
      <path d="M17 20V4M17 4l-3 3M17 4l3 3" />
    </svg>
  ),
  budget: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9l6.5 6.2" />
    </svg>
  ),
  menu: (
    <svg {...iconProps}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  /** Calendar with a plus — "new monthly budget". Distinct from the plain `plus`. */
  calendarPlus: (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M12 13v5M9.5 15.5h5" />
    </svg>
  ),
  plus: (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  filter: (
    <svg {...iconProps}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  ),
  pencil: (
    <svg {...iconProps} width={14} height={14}>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
    </svg>
  ),
  chevronLeft: (
    <svg {...iconProps}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  chevronRight: (
    <svg {...iconProps}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
};

/** Default menu used when a page doesn't pass its own `items`. */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: Icons.dashboard },
  { href: "/transactions", label: "Giao dịch", icon: Icons.transactions },
  { href: "/budgets", label: "Ngân sách", icon: Icons.budget },
];
