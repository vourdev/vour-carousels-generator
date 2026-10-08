"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight, PlusCircleIcon } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type {
  NavBadge,
  NavGroup,
  NavMainItem,
  NavMainLinkItem,
  NavMainParentItem,
} from "@/navigation/sidebar-items";

interface NavMainProps {
  readonly items: readonly NavGroup[];
}

function hasSubItems(item: NavMainItem): item is NavMainParentItem {
  return Boolean(item.subItems?.length);
}

function isPathActive(path: string, url: string) {
  return url === "/" ? path === "/" : path === url || path.startsWith(`${url}/`);
}

export function NavMain({ items }: NavMainProps) {
  const path = usePathname();
  const { setOpenMobile } = useSidebar();

  const isItemActive = (item: NavMainItem) =>
    hasSubItems(item) ? item.subItems.some((sub) => path.startsWith(sub.url)) : isPathActive(path, item.url);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Buat carousel"
                className="bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <Link href="/create" onClick={() => setOpenMobile(false)}>
                  <PlusCircleIcon />
                  <span>Buat carousel</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {items.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && (
            <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItem key={item.id} item={item} isItemActive={isItemActive} path={path} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

function NavItem({
  item,
  isItemActive,
  path,
}: {
  item: NavMainItem;
  isItemActive: (item: NavMainItem) => boolean;
  path: string;
}) {
  const { state, isMobile } = useSidebar();
  const isCollapsedDesktop = state === "collapsed" && !isMobile;

  if (!hasSubItems(item)) return <NavLinkItem item={item} isActive={isItemActive(item)} />;
  if (isCollapsedDesktop) return <NavDropdownItem item={item} isActive={isItemActive(item)} path={path} />;
  return <NavCollapsibleItem item={item} isActive={isItemActive(item)} path={path} />;
}

function NavLinkItem({ item, isActive }: { item: NavMainLinkItem; isActive: boolean }) {
  const { setOpenMobile } = useSidebar();
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild aria-disabled={item.disabled} tooltip={item.title} isActive={isActive}>
        <Link
          href={item.url}
          aria-current={isActive ? "page" : undefined}
          aria-keyshortcuts={item.shortcut}
          onClick={() => setOpenMobile(false)}
        >
          {Icon && <Icon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {item.shortcut ? (
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1.5 right-2 hidden font-sans text-[11px] text-muted-foreground/70 uppercase md:block group-data-[collapsible=icon]:hidden"
        >
          {item.shortcut}
        </kbd>
      ) : (
        <NavItemBadge badge={item.badge} />
      )}
    </SidebarMenuItem>
  );
}

function NavDropdownItem({ item, isActive, path }: { item: NavMainParentItem; isActive: boolean; path: string }) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive} disabled={item.disabled}>
            {Icon && <Icon />}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={12} className="w-48">
          <DropdownMenuGroup>
            {item.subItems.map((subItem) => (
              <DropdownMenuItem key={subItem.id} asChild disabled={subItem.disabled}>
                <Link
                  href={subItem.url}
                  aria-current={path === subItem.url ? "page" : undefined}
                  className="flex items-center gap-2"
                >
                  {subItem.icon && <subItem.icon />}
                  <span>{subItem.title}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function NavCollapsibleItem({ item, isActive, path }: { item: NavMainParentItem; isActive: boolean; path: string }) {
  const Icon = item.icon;
  return (
    <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive} disabled={item.disabled}>
            {Icon && <Icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <NavItemBadge badge={item.badge} />
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((subItem) => (
              <SidebarMenuSubItem key={subItem.id}>
                <SidebarMenuSubButton asChild aria-disabled={subItem.disabled} isActive={path === subItem.url}>
                  <Link href={subItem.url}>
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavItemBadge({ badge }: { badge?: NavBadge }) {
  if (!badge) return null;
  return (
    <SidebarMenuBadge
      className={cn(
        "rounded-sm border capitalize",
        badge === "new" &&
          "border-green-600 text-green-600 peer-hover/menu-button:text-green-600 peer-data-active/menu-button:text-green-600",
        badge === "soon" && "border-muted-foreground text-muted-foreground",
      )}
    >
      {badge}
    </SidebarMenuBadge>
  );
}
