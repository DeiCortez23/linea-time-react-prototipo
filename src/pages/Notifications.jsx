import React, { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Trash2, Loader2, Inbox, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ✅ HOOK PERSONALIZADO PARA NOTIFICACIONES EN TIEMPO REAL
const useRealTimeNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const allNotifications = await localClient.entities.Notification.filter({ user_id: userId });
      setNotifications(allNotifications);
      
      const unread = allNotifications.filter(n => !n.read);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    loadNotifications();

    // ✅ SUSCRIBIRSE AL SISTEMA DE NOTIFICACIONES EN TIEMPO REAL
    const unsubscribe = localClient.notificationManager.subscribe((data) => {
      console.log('📢 Actualización en tiempo real recibida:', data);
      
      if (data.userId === userId || data.type === 'force_refresh') {
        console.log('🔄 Recargando notificaciones...');
        loadNotifications();
      }
    });

    // ✅ ESCUCHAR EVENTOS GLOBALES ADICIONALES
    const handleGlobalUpdate = (event) => {
      console.log('📢 Evento global recibido:', event.detail);
      loadNotifications();
    };

    window.addEventListener('notificationsUpdated', handleGlobalUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('notificationsUpdated', handleGlobalUpdate);
    };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    try {
      await localClient.entities.Notification.update(notificationId, { read: true });
      // No necesitamos recargar porque el manager lo hará automáticamente
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      await localClient.entities.Notification.markAllAsRead(userId);
      // No necesitamos recargar porque el manager lo hará automáticamente
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await localClient.entities.Notification.delete(notificationId);
      // No necesitamos recargar porque el manager lo hará automáticamente
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const forceRefresh = () => {
    localClient.entities.Notification.forceRefresh(userId);
  };

  return {
    notifications,
    unreadCount,
    loading,
    refreshNotifications: loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    forceRefresh
  };
};

const notificationIcons = {
  activity_assigned: "🎯",
  activity_completed: "✅", 
  activity_overdue: "⚠️",
  project_update: "📊",
  member_added: "👥",
  project_invitation: "🎉",
  info: "📢"
};

const notificationColors = {
  activity_assigned: { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  activity_completed: { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  activity_overdue: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  project_update: { bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
  member_added: { bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  project_invitation: { bg: 'bg-pink-50', border: 'border-pink-200', dot: 'bg-pink-500' },
  info: { bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-500' }
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => localClient.auth.me(),
    staleTime: Infinity,
  });

  // ✅ USAR EL NUEVO HOOK DE NOTIFICACIONES EN TIEMPO REAL
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useRealTimeNotifications(user?.id);

  // ✅ MUTACIONES OPTIMIZADAS - SIN INVALIDACIÓN MANUAL
  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // La actualización se maneja automáticamente por el sistema de eventos
      setLastUpdate(new Date());
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      // La actualización se maneja automáticamente por el sistema de eventos
      setLastUpdate(new Date());
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      // La actualización se maneja automáticamente por el sistema de eventos
      setLastUpdate(new Date());
    },
  });

  const refreshMutation = useMutation({
    mutationFn: refreshNotifications,
    onSuccess: () => {
      setLastUpdate(new Date());
    },
  });

  const getNotificationLink = (notification) => {
    if (notification.activity_id) {
      return createPageUrl(`ActivityDetail?id=${notification.activity_id}`);
    }
    if (notification.project_id) {
      return createPageUrl(`ProjectDetail?id=${notification.project_id}`);
    }
    return null;
  };

  const getNotificationColor = (type) => {
    return notificationColors[type] || notificationColors.info;
  };

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4c0519' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-8 h-8" style={{ color: '#4c0519' }} />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#4c0519' }}>
              Notificaciones
            </h1>
            <p className="text-sm text-gray-500">
              Actualizado {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            style={{ color: '#4c0519', borderColor: '#4c0519' }}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              variant="outline"
              size="sm"
              style={{ color: '#4c0519', borderColor: '#4c0519' }}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay notificaciones
            </h3>
            <p className="text-gray-500 max-w-sm">
              Te notificaremos cuando tengas nuevas actividades, actualizaciones de proyectos o mensajes importantes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const colors = getNotificationColor(notification.type);
              const isUnread = !notification.read;
              
              const NotificationContent = (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 rounded-lg border transition-all duration-200 relative overflow-hidden ${
                    isUnread 
                      ? `${colors.bg} ${colors.border} shadow-sm ring-1 ring-inset ${colors.border.replace('border-', 'ring-')}` 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Punto indicador de no leído */}
                  {isUnread && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.dot}`} />
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl mt-1 flex-shrink-0">
                        {notificationIcons[notification.type] || '📢'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          {isUnread && (
                            <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {notification.message}
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          {formatDistanceToNow(new Date(notification.created_date), {
                            addSuffix: true,
                            locale: es
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Marcar como leída"
                          disabled={markAsReadMutation.isPending}
                        >
                          {markAsReadMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCheck className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Eliminar notificación"
                        disabled={deleteNotificationMutation.isPending}
                      >
                        {deleteNotificationMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );

              return link ? (
                <Link 
                  key={notification.id} 
                  to={link}
                  className="block hover:no-underline"
                >
                  {NotificationContent}
                </Link>
              ) : (
                <div key={notification.id}>
                  {NotificationContent}
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ✅ INDICADOR DE ACTUALIZACIÓN EN TIEMPO REAL */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
          <div className={`w-2 h-2 rounded-full ${unreadCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span>
            {unreadCount > 0 
              ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} no leída${unreadCount !== 1 ? 's' : ''}`
              : 'Todas las notificaciones leídas'
            }
          </span>
        </div>
      </div>
    </div>
  );
}