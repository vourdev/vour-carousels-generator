import { CalendarDays, LayoutDashboard, ListTodo, type LucideIcon, PenSquare } from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  /** Single-key jump, shown in the command palette and handled by the sidebar. */
  shortcut?: string;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Konten",
    items: [
      { id: "overview", title: "Overview", url: "/", icon: LayoutDashboard, shortcut: "o" },
      { id: "create", title: "Create", url: "/create", icon: PenSquare, shortcut: "c" },
      { id: "topics", title: "Topics", url: "/topics", icon: ListTodo, shortcut: "t" },
      { id: "calendar", title: "Calendar", url: "/history", icon: CalendarDays, shortcut: "h" },
    ],
  },
];

/** Every link item, flattened — for the shortcut handler and the command palette. */
export const navLinks: NavMainLinkItem[] = sidebarItems.flatMap((group) =>
  group.items.filter((item): item is NavMainLinkItem => !item.subItems),
);
