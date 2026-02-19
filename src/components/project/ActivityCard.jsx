import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, AlertCircle, Edit, Trash2, RotateCcw, Users, Mail, Briefcase, User } from "lucide-react";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { localClient } from "@/api/localClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusColors = {
  pending: "bg-gray-100 text-gray-800 border-gray-300",
  assigned: "bg-amber-100 text-amber-800 border-amber-300",
  in_progress: "text-white border-[#4c0519]",
  completed: "bg-green-100 text-green-800 border-green-300",
  overdue: "text-white border-[#7d1128]"
};

const statusLabels = {
  pending: "Pendiente",
  assigned: "Asignada",
  in_progress: "En Progreso",
  completed: "Completada",
  overdue: "Vencida"
};

export default function ActivityCard({ 
  activity, 
  assignedMember, 
  onComplete, 
  onEdit, 
  onDelete, 
  onReopen, 
  isLeader,
  isCompleting = false,
  isReopening = false,
  isDeleting = false,
  onActivityUpdate,
  projectMembers = []
}) {
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [isProcessingReopen, setIsProcessingReopen] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  const isOverdue = activity.end_date && isPast(new Date(activity.end_date)) && activity.status !== 'completed';
  const displayStatus = isOverdue ? 'overdue' : activity.status;
  const isCompleted = activity.status === 'completed';

  const getAssignedMemberInfo = () => {
    if (!activity.assigned_to) return null;
    
    const member = projectMembers.find(m => m.user_id === activity.assigned_to);
    if (!member) return null;
    
    return {
      name: member.name,
      email: member.email,
      position: member.position,
      avatar_url: member.avatar_url,
      agreed_delivery_date: member.agreed_delivery_date
    };
  };

  const assignedMemberInfo = getAssignedMemberInfo();

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "No definida";
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const handleComplete = async (activity) => {
    if (onComplete && !isProcessingComplete) {
      try {
        setIsProcessingComplete(true);
        await onComplete(activity);
        
        window.dispatchEvent(new CustomEvent('activitiesUpdated', {
          detail: { activityId: activity.id, action: 'completed' }
        }));
        
        if (localClient?.notificationManager) {
          localClient.notificationManager.notify({
            type: 'force_refresh',
            message: 'Actividad completada',
            timestamp: new Date().toISOString()
          });
        }
        
        if (onActivityUpdate) {
          onActivityUpdate();
        }
      } catch (error) {
        console.error('Error completing activity:', error);
      } finally {
        setIsProcessingComplete(false);
      }
    }
  };

  const handleReopen = async (activity) => {
    if (onReopen && !isProcessingReopen) {
      try {
        setIsProcessingReopen(true);
        await onReopen(activity);
        
        window.dispatchEvent(new CustomEvent('activitiesUpdated', {
          detail: { activityId: activity.id, action: 'reopened' }
        }));
        
        if (localClient?.notificationManager) {
          localClient.notificationManager.notify({
            type: 'force_refresh',
            message: 'Actividad reabierta',
            timestamp: new Date().toISOString()
          });
        }
        
        if (onActivityUpdate) {
          onActivityUpdate();
        }
      } catch (error) {
        console.error('Error reopening activity:', error);
      } finally {
        setIsProcessingReopen(false);
      }
    }
  };

  const handleDelete = async (activityId) => {
    if (onDelete && !isProcessingDelete) {
      try {
        setIsProcessingDelete(true);
        await onDelete(activityId);
        
        window.dispatchEvent(new CustomEvent('activitiesUpdated', {
          detail: { activityId: activityId, action: 'deleted' }
        }));
        
        if (localClient?.notificationManager) {
          localClient.notificationManager.notify({
            type: 'force_refresh',
            message: 'Actividad eliminada',
            timestamp: new Date().toISOString()
          });
        }
        
        if (onActivityUpdate) {
          onActivityUpdate();
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
      } finally {
        setIsProcessingDelete(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="hover:shadow-lg transition-all border-l-4" style={{ borderLeftColor: '#4c0519' }}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <Link to={createPageUrl(`ActivityDetail?id=${activity.id}`)}>
                <h4 className="font-semibold text-gray-900 hover:opacity-70 transition-colors cursor-pointer mb-1 truncate" style={{ color: '#4c0519' }}>
                  {activity.title}
                </h4>
              </Link>
              {activity.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {activity.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <Badge 
                className={`${statusColors[displayStatus]} border font-medium`}
                style={
                  displayStatus === 'in_progress' ? { 
                    background: 'linear-gradient(to right, #4c0519, #7d1128)',
                    color: 'white'
                  } : displayStatus === 'overdue' ? {
                    background: 'linear-gradient(to right, #7d1128, #a01c3a)',
                    color: 'white'
                  } : {}
                }
              >
                {statusLabels[displayStatus]}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-gray-700 font-medium">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Fecha de inicio</span>
                </div>
                <div className={`text-sm ${activity.start_date ? 'text-gray-900' : 'text-gray-500 italic'}`}>
                  {activity.start_date ? formatDateDisplay(activity.start_date) : 'No definida'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-gray-700 font-medium">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Fecha de término</span>
                </div>
                <div className={`text-sm ${activity.end_date ? 'text-gray-900' : 'text-gray-500 italic'}`}>
                  {activity.end_date ? formatDateDisplay(activity.end_date) : 'No definida'}
                </div>
              </div>
            </div>

            {assignedMemberInfo?.agreed_delivery_date && (
              <div className="mt-2 pt-2 border-t border-gray-300">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-gray-700 font-medium">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Fecha pactada de entrega</span>
                  </div>
                  <div className="text-sm text-gray-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    {formatDateDisplay(assignedMemberInfo.agreed_delivery_date)}
                  </div>
                  <p className="text-xs text-blue-600">
                    Fecha acordada con el colaborador para revisión previa a productivo
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            {assignedMemberInfo ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 flex-1 min-w-0">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={assignedMemberInfo.avatar_url} />
                  <AvatarFallback className="text-xs text-white" style={{ background: 'linear-gradient(to br, #4c0519, #7d1128)' }}>
                    {assignedMemberInfo.name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {assignedMemberInfo.name}
                    </p>
                  </div>
                  
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1 min-w-0">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{assignedMemberInfo.email}</span>
                    </div>
                    
                    <div className="hidden xs:block text-gray-300">•</div>
                    
                    <div className="flex items-center gap-1 min-w-0">
                      <Briefcase className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{assignedMemberInfo.position || 'Colaborador'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 flex-1">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 italic">Sin asignar</span>
              </div>
            )}

            <div className="flex gap-1 self-end sm:self-center flex-shrink-0">
              {isCompleted && isLeader && onReopen && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleReopen(activity)}
                  className="hover:opacity-70 h-9"
                  style={{ color: '#4c0519' }}
                  title="Reabrir actividad"
                  disabled={isReopening || isProcessingReopen}
                >
                  {isReopening || isProcessingReopen ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#4c0519] mr-1"></div>
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span className="ml-1 hidden xs:inline">Reabrir</span>
                </Button>
              )}

              {!isCompleted && onComplete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleComplete(activity)}
                  className="hover:opacity-70 h-9"
                  style={{ color: '#4c0519' }}
                  disabled={isCompleting || isProcessingComplete}
                >
                  {isCompleting || isProcessingComplete ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#4c0519] mr-1"></div>
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span className="ml-1 hidden xs:inline">Completar</span>
                </Button>
              )}

              {isLeader && onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(activity)}
                  className="h-9 w-9 hover:opacity-70"
                  style={{ color: '#4c0519' }}
                  title="Editar"
                  disabled={isDeleting || isProcessingDelete}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 hover:opacity-70"
                    style={{ color: '#7d1128' }}
                    title="Eliminar"
                    disabled={isDeleting || isProcessingDelete}
                  >
                    {isDeleting || isProcessingDelete ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#7d1128]"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La actividad "{activity.title}" será eliminada permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(activity.id)}
                      className="text-white hover:opacity-90"
                      style={{ background: 'linear-gradient(to right, #7d1128, #a01c3a)' }}
                      disabled={isDeleting || isProcessingDelete}
                    >
                      {isDeleting || isProcessingDelete ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Eliminando...
                        </>
                      ) : (
                        'Eliminar Actividad'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {isCompleted && activity.completed_by_name && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Completada por:</span>
                <Avatar className="w-5 h-5">
                  <AvatarImage src={activity.completed_by_avatar} />
                  <AvatarFallback className="text-xs bg-green-600 text-white">
                    {activity.completed_by_name[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{activity.completed_by_name}</span>
                {activity.completed_date && (
                  <span className="text-gray-500">
                    el {format(new Date(activity.completed_date), "d MMM", { locale: es })}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}