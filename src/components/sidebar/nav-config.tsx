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
  check: (
    <svg {...iconProps} width={16} height={16}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  trash: (
    <svg {...iconProps} width={16} height={16}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
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
  users: (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c1.9.8 3.1 2.6 3.5 5.2" />
    </svg>
  ),
  logout: (
    <svg {...iconProps} width={18} height={18}>
      <path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
      <path d="M10 16l-4-4 4-4M6 12h10" />
    </svg>
  ),
  key: (
    <svg {...iconProps} width={16} height={16}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l3 3M15 8l2 2" />
    </svg>
  ),
  lock: (
    <svg {...iconProps} width={16} height={16}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  ),
  unlock: (
    <svg {...iconProps} width={16} height={16}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 017.5-2" />
    </svg>
  ),
  database: (
    <svg {...iconProps}>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" />
      <path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13" />
      <path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" />
    </svg>
  ),
  search: (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  ),
  login: (
    <svg {...iconProps}>
      <path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4" />
      <path d="M14 16l4-4-4-4M18 12H8" />
    </svg>
  ),
  account: (
    <svg {...iconProps} width={18} height={18}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c.8-3.6 3.8-6 7.5-6s6.7 2.4 7.5 6" />
    </svg>
  ),
  chevronDown: (
    <svg {...iconProps} width={16} height={16}>
      <path d="M6 9l6 6 6-6" />
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
  { href: "/dashboard", label: "Tổng quan", icon: Icons.dashboard },
  { href: "/transactions", label: "Giao dịch", icon: Icons.transactions },
  { href: "/budgets", label: "Ngân sách", icon: Icons.budget },
];

/** Added automatically to the sidebar and account menu for admins. */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Người dùng", icon: Icons.users },
  { href: "/data", label: "Dữ liệu", icon: Icons.database },
];
