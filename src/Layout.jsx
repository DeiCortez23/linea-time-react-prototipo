import React from "react";
import { Link, useLocation } from "react-router-dom";
import { localClient } from "@/api/localClient";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Bell,
  Settings,
  LogOut,
  Menu,
  FolderKanban
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigationItems = [
  {
    title: "Timeline",
    url: "/timeline",
    icon: LayoutDashboard,
  },
  {
    title: "Notificaciones",
    url: "/notifications",
    icon: Bell,
  },
  {
    title: "Configuración",
    url: "/settings",
    icon: Settings,
  },
];

export default function Layout({ children }) {
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => localClient.auth.me(),
    staleTime: Infinity,
    retry: false,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      const notifications = await localClient.entities.Notification.filter({
        user_id: user.id,
        read: false
      });
      return notifications.length;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    localClient.auth.logout();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-pink-50 to-red-50">
        <Sidebar className="border-r border-gray-200 bg-white/80 backdrop-blur-lg">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg text-white"
                style={{ 
                  background: 'linear-gradient(to bottom right, #4c0519, #7d1128, #a01c3a)'
                }}
              >
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h2 
                  className="font-bold text-lg"
                  style={{ 
                    background: 'linear-gradient(to right, #4c0519, #7d1128, #a01c3a)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Timeline
                </h2>
                <p className="text-xs text-gray-500">Projects Manager</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel 
                className="text-xs font-semibold uppercase tracking-wider px-3 py-2"
                style={{ 
                  background: 'linear-gradient(to right, #4c0519, #7d1128, #a01c3a)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Menú Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`transition-all duration-300 rounded-lg mb-2 border ${
                          location.pathname === item.url 
                            ? 'text-white shadow-lg hover:shadow-xl' 
                            : 'hover:shadow-md hover:opacity-90'
                        }`}
                        style={
                          location.pathname === item.url 
                            ? { 
                                background: 'linear-gradient(to right, #4c0519, #7d1128, #a01c3a)',
                                borderColor: '#4c0519'
                              }
                            : { 
                                color: '#4c0519',
                                backgroundColor: 'rgba(76, 5, 25, 0.08)',
                                borderColor: 'rgba(76, 5, 25, 0.2)',
                                borderWidth: '1px'
                              }
                        }
                      >
                        <Link 
                          to={item.url} 
                          className="flex items-center gap-3 px-4 py-3 relative"
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                          {item.title === "Notificaciones" && unreadCount > 0 && (
                            <Badge 
                              className="ml-auto text-white text-xs px-2 py-1 min-w-6 h-6 flex items-center justify-center"
                              style={{ 
                                background: location.pathname === item.url 
                                  ? 'rgba(255, 255, 255, 0.3)'
                                  : 'linear-gradient(to right, #7d1128, #a01c3a)',
                                border: location.pathname === item.url ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
                              }}
                            >
                              {unreadCount}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4">
            {user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <Avatar 
                    className="w-10 h-10 border-2" 
                    style={{ 
                      borderColor: '#4c0519',
                      background: 'linear-gradient(to bottom right, #4c0519, #7d1128, #a01c3a)'
                    }}
                  >
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-white font-semibold">
                      {user.full_name?.[0] || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 hover:shadow-xl transition-all duration-300 font-medium text-white shadow-lg"
                  style={{ 
                    background: 'linear-gradient(to right, #4c0519, #7d1128, #a01c3a)',
                    border: 'none'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4 lg:hidden">
            <SidebarTrigger 
              className="hover:shadow-xl transition-all duration-300 text-white shadow-lg rounded-lg p-2"
              style={{ 
                background: 'linear-gradient(to right, #4c0519, #7d1128, #a01c3a)'
              }}
            >
              <Menu className="w-6 h-6" />
            </SidebarTrigger>
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}