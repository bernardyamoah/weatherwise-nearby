"use client"

import {
  Cloud,
  History,
  Map,
  Search,
  Settings,
  Star
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  {
    title: "Discover",
    url: "/",
    icon: Search,
  },
  {
    title: "Map View",
    url: "/map",
    icon: Map,
  },
  {
    title: "Weather Details",
    url: "/weather",
    icon: Cloud,
  },
  {
    title: "Favorites",
    url: "/favorites",
    icon: Star,
  },
  {
    title: "Hotels",
    url: "/hotels",
    icon: Map,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border">
        <Link href="/" className="flex w-full items-center gap-2 font-bold text-xl">
          <div className="bg-primary text-primary-foreground p-1 rounded">
             <Cloud className="w-5 h-5" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden">WeatherWise</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
           <SidebarMenuItem>
             <SidebarMenuButton tooltip="Settings">
               <Settings />
               <span>Settings</span>
             </SidebarMenuButton>
           </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
