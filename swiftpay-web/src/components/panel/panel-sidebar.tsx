"use client";

import { useSidebar } from "@/contexts/sidebar-context";
import type { UserInfo } from "@/types/auth";
import { Sidebar } from "./sidebar/sidebar";
import { SidebarMobileNavbar } from './sidebar/sidebar-mobile-navbar';

interface PanelSidebarProps {
  user: UserInfo;
}

export function PanelSidebar({ user }: PanelSidebarProps) {
  const { isExpanded, isOpen, toggleSidebar } = useSidebar();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      <aside
        className={[
          'shrink-0 z-50',
          'fixed inset-y-0 left-0 h-dvh w-[70%]',
          'transition-transform duration-200 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:inset-auto md:h-full md:translate-x-0',
          'md:transition-[width] md:duration-150 md:ease-out',
          isExpanded ? 'md:w-72' : 'md:w-16',
        ].join(' ')}
      >
        <Sidebar user={user} />
      </aside>

      <SidebarMobileNavbar user={user} />
    </>
  );
}

