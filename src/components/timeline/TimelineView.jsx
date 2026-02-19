// 📦 src/components/timeline/TimelineView.jsx (VERSIÓN COMPLETA CON TIEMPO REAL)
import React, { useState, useEffect, useCallback } from "react";
import { localClient } from "@/api/localClient";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle2, Clock, AlertCircle, TrendingUp, FolderKanban, Trash2, Plus, Edit, UserPlus, MoreVertical, RefreshCw } from "lucide-react";
import { format, isPast, differenceInDays, parseISO, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EditProjectDialog from "./EditProjectDialog";

// Configuraciones (MANTENIDO)
const STATUS_CONFIG = {
  planning: { 
    label: "Planificación", 
    class: "bg-yellow-100 text-yellow-800 border-yellow-300" 
  },
  in_progress: { 
    label: "En Progreso", 
    class: "border-[#4c0519] text-white" 
  },
  completed: { 
    label: "Completado", 
    class: "bg-green-100 text-green-800 border-green-300" 
  },
  on_hold: { 
    label: "En Pausa", 
    class: "bg-gray-100 text-gray-800 border-gray-300" 
  },
  cancelled: { 
    label: "Cancelado", 
    class: "text-white border-[#7d1128]" 
  }
};

// ✅ CORRECCIÓN COMPLETA: Funciones de fecha usando UTC (MANTENIDO)
const parseDateCorrected = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Para formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      // ✅ CORRECCIÓN: Crear fecha UTC
      return new Date(Date.UTC(year, month - 1, day));
    }
    
    // Para formato ISO
    if (dateString.includes('T')) {
      const date = new Date(dateString);
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

// Hook para utilidades del proyecto (MANTENIDO)
const useProjectUtils = () => {
  // ✅ CORRECCIÓN MEJORADA: Ordenamiento de actividades por fecha de inicio y término
  const getProjectActivities = (projectId, allActivities) => {
    if (!allActivities || !Array.isArray(allActivities)) return [];
    
    return allActivities
      .filter(activity => activity.project_id === projectId)
      .sort((a, b) => {
        // Primero por fecha de inicio (due_date) usando UTC
        const startDateA = a.due_date ? parseDateCorrected(a.due_date) : new Date(a.created_date);
        const startDateB = b.due_date ? parseDateCorrected(b.due_date) : new Date(b.created_date);
        
        // Si las fechas de inicio son diferentes, ordenar por inicio
        if (startDateA - startDateB !== 0) {
          return startDateA - startDateB;
        }
        
        // Si tienen la misma fecha de inicio, ordenar por fecha de término
        const endDateA = a.end_date ? parseDateCorrected(a.end_date) : null;
        const endDateB = b.end_date ? parseDateCorrected(b.end_date) : null;
        
        if (endDateA && endDateB) {
          return endDateA - endDateB;
        }
        
        // Si una tiene fecha de término y otra no, la que tiene fecha va primero
        if (endDateA && !endDateB) return -1;
        if (!endDateA && endDateB) return 1;
        
        // Si no hay fechas de término, ordenar por fecha de creación
        return new Date(a.created_date) - new Date(b.created_date);
      });
  };

  const getProjectMembers = (projectId, allMembers) => {
    if (!allMembers || !Array.isArray(allMembers)) return [];
    return allMembers.filter(member => member.project_id === projectId);
  };

  const getAssignedMember = (activity, projectMembers) => {
    if (!projectMembers || !Array.isArray(projectMembers)) return null;
    return projectMembers.find(member => member.user_id === activity.assigned_to);
  };

  // ✅ CORRECCIÓN COMPLETA: Usar UTC para cálculos consistentes
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    try {
      const today = new Date();
      // ✅ CORRECCIÓN: Usar UTC para cálculos consistentes
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const end = parseDateCorrected(endDate); // Esta función ya usa UTC
      const diffTime = end - todayUTC;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error("Error calculating days remaining:", error);
      return null;
    }
  };

  // ✅ MODIFICADO: Función para detectar actividades pendientes que se activan 5 días antes
  const isActivityPendingRed = (activity) => {
    if (!activity.end_date || activity.status === 'completed') return false;
    
    try {
      const dueDate = parseDateCorrected(activity.end_date);
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      
      // Calcular diferencia en días
      const diffTime = dueDate - todayUTC;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Actividades pendientes que se activan (color rojo): 5 días o menos para la fecha límite
      return diffDays <= 5 && diffDays >= 0;
    } catch (error) {
      console.error("Error checking if activity is pending red:", error);
      return false;
    }
  };

  // ✅ NUEVA FUNCIÓN: Para actividades pendientes normales (más de 5 días)
  const isActivityPendingNormal = (activity) => {
    if (activity.status === 'completed') return false;
    
    try {
      if (!activity.end_date) return true; // Sin fecha = pendiente normal
      
      const dueDate = parseDateCorrected(activity.end_date);
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      
      const diffTime = dueDate - todayUTC;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Pendiente normal: más de 5 días para la fecha límite
      return diffDays > 5;
    } catch (error) {
      console.error("Error checking if activity is pending normal:", error);
      return false;
    }
  };

  const calculateProjectProgress = (activities) => {
    if (!activities || activities.length === 0) return 0;
    const completed = activities.filter(a => a.status === 'completed').length;
    return Math.round((completed / activities.length) * 100);
  };

  // ESPACIADO FIJO Y CONSISTENTE
  const calculateTimelinePositions = (activities) => {
    if (!activities || activities.length === 0) return [];
    
    const FIXED_ACTIVITY_HEIGHT = 180;
    const SPACING_BETWEEN_ACTIVITIES = 80; // Aumentado para más separación
    
    return activities.map((activity, index) => {
      const position = index * (FIXED_ACTIVITY_HEIGHT + SPACING_BETWEEN_ACTIVITIES) + (FIXED_ACTIVITY_HEIGHT / 2);
      return {
        ...activity,
        timelinePosition: position
      };
    });
  };

  return {
    getProjectActivities,
    getProjectMembers,
    getAssignedMember,
    getDaysRemaining,
    isActivityPendingRed, // ✅ MODIFICADO: Pendientes que se activan (rojo)
    isActivityPendingNormal, // ✅ NUEVO: Pendientes normales
    calculateProjectProgress,
    calculateTimelinePositions
  };
};

// ✅ CORRECCIÓN MEJORADA: Función unificada para obtener colores del proyecto (MANTENIDO)
const getProjectColors = (project) => {
  if (!project || !project.color) {
    return {
      gradient: 'linear-gradient(to right, #4c0519, #7d1128)',
      from: '#4c0519',
      to: '#7d1128',
      solid: '#4c0519'
    };
  }
  
  // Si el color es un gradiente, extraer el color principal (primer color)
  if (project.color.includes('gradient')) {
    const colors = project.color.match(/#[0-9a-fA-F]{6}/g);
    const mainColor = colors?.[0] || '#4c0519';
    return {
      gradient: project.color,
      from: mainColor,
      to: colors?.[1] || mainColor,
      solid: mainColor
    };
  }
  
  // Si es un color sólido, crear gradiente basado en ese color
  const mainColor = project.color;
  return {
    gradient: `linear-gradient(to right, ${mainColor}, ${mainColor})`,
    from: mainColor,
    to: mainColor,
    solid: mainColor
  };
};

// ✅ NUEVO: Hook personalizado para sincronización en tiempo real
const useRealTimeDataSync = (projectId, refreshInterval = 2000) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [forceRefresh, setForceRefresh] = useState(false);

  // Suscribirse a actualizaciones del NotificationManager
  useEffect(() => {
    const unsubscribe = localClient.notificationManager.subscribe((data) => {
      if (data.type === 'force_refresh' || 
          data.type === 'new_notification' || 
          data.type === 'notification_updated') {
        console.log('📢 Notificación recibida, forzando actualización:', data.type);
        setForceRefresh(prev => !prev); // Alternar para forzar re-render
        setLastUpdate(Date.now());
      }
    });

    return () => unsubscribe();
  }, []);

  // Polling para verificar cambios en localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      const storedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
      
      // Verificar si hay cambios relevantes
      const hasChanges = storedActivities.some(activity => 
        activity.project_id === projectId && 
        activity.updated_date && 
        new Date(activity.updated_date).getTime() > lastUpdate
      );

      if (hasChanges) {
        console.log('🔄 Cambios detectados en localStorage, actualizando...');
        setLastUpdate(Date.now());
        setForceRefresh(prev => !prev);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [projectId, lastUpdate, refreshInterval]);

  return { forceRefresh, lastUpdate };
};

// Componente de línea de tiempo vertical - AISLADO COMPLETAMENTE (MANTENIDO)
const TimelineWithDots = ({ activities, project, onActivityClick, projectMembers }) => {
  const { isActivityPendingRed, isActivityPendingNormal, calculateTimelinePositions } = useProjectUtils();
  
  // ✅ CORRECCIÓN: Usar la función unificada de colores
  const projectColors = getProjectColors(project);

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mx-auto my-8">
        {/* CORRECCIÓN: Línea central usa colores del proyecto */}
        <div 
          className="w-1 bg-gradient-to-b h-full rounded-full" 
          style={{ background: projectColors.gradient }}
        />
        <div className="mt-4 text-center text-gray-500">
          <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No hay actividades</p>
          <p className="text-xs">Agrega actividades para ver la línea de tiempo</p>
        </div>
      </div>
    );
  }

  const activitiesWithPositions = calculateTimelinePositions(activities);

  // ALTURA FIJA Y PREDECIBLE
  const getTimelineHeight = () => {
    const FIXED_ACTIVITY_HEIGHT = 180;
    const SPACING_BETWEEN_ACTIVITIES = 80;
    
    const calculatedHeight = (activities.length * FIXED_ACTIVITY_HEIGHT) + 
                           ((activities.length - 1) * SPACING_BETWEEN_ACTIVITIES);
    
    return Math.max(600, calculatedHeight); // Altura mínima aumentada
  };

  const timelineHeight = getTimelineHeight();

  return (
    <div className="relative w-full flex justify-center isolate" style={{ height: `${timelineHeight}px` }}>
      {/* CORRECCIÓN: LÍNEA CENTRAL USA COLORES DEL PROYECTO */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 shadow-lg rounded-full z-10" 
        style={{ background: projectColors.gradient }}
      />
      
      {activitiesWithPositions.map((activity, index) => {
        const isCompleted = activity.status === 'completed';
        const isInProgress = activity.status === 'in_progress';
        const isPendingRed = isActivityPendingRed(activity); // ✅ MODIFICADO: Pendientes activas (rojo)
        const isPendingNormal = isActivityPendingNormal(activity); // ✅ NUEVO: Pendientes normales
        
        // ✅ MODIFICADO: Lógica de colores simplificada
        let dotColor = 'bg-blue-500';
        let dotGlow = 'shadow-blue-500/50';
        if (isCompleted) {
          dotColor = 'bg-green-500';
          dotGlow = 'shadow-green-500/50';
        } else if (isPendingRed) {
          dotColor = 'bg-red-500'; // ✅ ROJO para pendientes activas
          dotGlow = 'shadow-red-500/50';
        } else if (isInProgress) {
          dotColor = 'bg-yellow-500';
          dotGlow = 'shadow-yellow-500/50';
        } else if (isPendingNormal) {
          dotColor = 'bg-blue-500'; // ✅ AZUL para pendientes normales
          dotGlow = 'shadow-blue-500/50';
        }

        // ✅ MODIFICADO: Alturas de progreso actualizadas
        const getProgressHeight = () => {
          if (isCompleted) return '100%';
          if (isInProgress) return '50%';
          if (isPendingRed) return '25%'; // ✅ Menos progreso para pendientes activas
          return '10%'; // ✅ Mínimo progreso para pendientes normales
        };

        // ✅ MODIFICADO: Colores de progreso actualizados
        const getProgressColor = () => {
          if (isCompleted) return projectColors.solid; // ✅ Usar color sólido
          if (isPendingRed) return '#ef4444'; // ✅ ROJO para pendientes activas
          if (isInProgress) return '#f59e0b';
          return projectColors.solid; // ✅ Usar color sólido para pendientes normales
        };

        const topPosition = `${activity.timelinePosition}px`;

        return (
          <motion.div
            key={activity.id}
            className="absolute left-0 right-0 flex justify-center items-center z-20 cursor-pointer group isolate"
            style={{ top: topPosition }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
          >
            {/* CONTENEDOR COMPLETAMENTE SEPARADO */}
            <div className="flex items-center justify-center w-full max-w-4xl px-8 mx-auto">
              {/* Tarjeta de actividad IZQUIERDA */}
              <div 
                className="bg-white p-4 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 w-80 mr-4 transform group-hover:scale-105 border-l-4"
                onClick={() => onActivityClick(activity)}
                style={{ 
                  borderLeftColor: isCompleted ? projectColors.solid : // ✅ Usar color sólido
                                 isPendingRed ? '#ef4444' : // ✅ ROJO para pendientes activas
                                 isInProgress ? '#f59e0b' : projectColors.solid // ✅ Usar color sólido
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="border border-gray-300 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ 
                          background: projectColors.gradient,
                          borderColor: projectColors.solid // ✅ Usar color sólido
                        }}
                      >
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                      <div className="font-semibold text-gray-900 text-sm leading-tight">
                        {activity.title}
                      </div>
                    </div>
                    
                    {/* ✅ NUEVO: Sección de Fechas Mejorada */}
                    <div className="space-y-2 text-xs text-gray-600 mb-3">
                      {activity.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>Inicio: {format(parseDateCorrected(activity.start_date), "d MMM yyyy", { locale: es })}</span>
                        </div>
                      )}
                      
                      {activity.end_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className={isPendingRed && !isCompleted ? "text-red-600 font-semibold" : ""}>
                            Término: {format(parseDateCorrected(activity.end_date), "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                      )}
                      
                      {/* ✅ NUEVO: Mostrar Fecha Pactada si existe */}
                      {activity.assigned_to && projectMembers && (() => {
                        const assignedMember = projectMembers.find(m => m.user_id === activity.assigned_to);
                        if (assignedMember?.agreed_delivery_date) {
                          return (
                            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-200">
                              <Users className="w-3 h-3 flex-shrink-0 text-blue-600" />
                              <span className="text-blue-600 font-medium">
                                Pactada: {format(new Date(assignedMember.agreed_delivery_date), "d MMM yyyy", { locale: es })}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {/* ✅ MODIFICADO: Badges simplificados */}
                      <Badge 
                        className={`text-xs font-medium ${
                          isCompleted ? 'bg-green-100 text-green-800 border-green-200' : 
                          isPendingRed ? 'bg-red-100 text-red-800 border-red-200' : // ✅ ROJO para pendientes activas
                          isInProgress ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                          'bg-yellow-100 text-yellow-800 border-yellow-200' // ✅ AMARILLO para pendientes normales
                        }`}
                      >
                        {isCompleted ? 'Completada' : 
                         isInProgress ? 'En Progreso' : 'Pendiente'} {/* ✅ SOLO tres estados */}
                      </Badge>
                      
                      <div className={`text-xs font-bold ${
                        isCompleted ? 'text-green-600' : 
                        isPendingRed ? 'text-red-600' : // ✅ ROJO para pendientes activas
                        isInProgress ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        {isCompleted ? '100%' : isInProgress ? '50%' : '0%'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LÍNEA DE PROGRESO CENTRAL */}
              <div className="relative flex flex-col items-center z-30">
                <div className="w-2 h-16 bg-gray-200 rounded-full overflow-hidden relative">
                  <div 
                    className="w-full transition-all duration-1000 ease-out absolute bottom-0"
                    style={{ 
                      height: getProgressHeight(),
                      backgroundColor: getProgressColor()
                    }}
                  />
                </div>
                
                {/* PUNTO CENTRAL */}
                <div className={`w-6 h-6 rounded-full border-3 border-white shadow-lg ${dotColor} ${dotGlow} shadow-xl z-40 mt-2`} />
              </div>

              {/* ESPACIO DERECHO PARA BALANCE */}
              <div className="w-80 ml-4 opacity-0">Balance</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Punto del proyecto en la línea de tiempo (MANTENIDO)
const ProjectTimelineDot = ({ project, isCurrentUserLeader, onEdit, onDelete }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // ✅ CORRECCIÓN: Usar la función unificada de colores
  const projectColors = getProjectColors(project);

  const handleDelete = () => {
    onDelete(project.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      {/* CORRECCIÓN: Punto usa colores del proyecto */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full border-4 border-white shadow-2xl flex items-center justify-center z-30"
        style={{ background: projectColors.gradient }}
      >
        <FolderKanban className="w-7 h-7 text-white" />
        
        {isCurrentUserLeader && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-16 top-1/2 transform -translate-y-1/2 w-9 h-9 bg-white border shadow-lg hover:bg-gray-50"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onEdit(project)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Proyecto
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Proyecto
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto completo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el proyecto <strong>"{project.name}"</strong>, 
              todas sus {project.activitiesCount || 0} actividades, y todos los miembros del equipo. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Proyecto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ✅ NUEVO: Componente optimizado con memo para evitar re-renders innecesarios
const MemoizedProjectTimelineItem = React.memo(({ 
  project, 
  allActivities, 
  allMembers, 
  currentUser, 
  onDeleteProject,
  onEditProject,
  forceRefreshKey // Nueva prop para forzar actualizaciones
}) => {
  console.log('🔄 Renderizando ProjectTimelineItem para:', project?.name);
  
  const { 
    getProjectActivities, 
    getProjectMembers, 
    getDaysRemaining, 
    calculateProjectProgress, 
    isActivityPendingRed, 
    isActivityPendingNormal 
  } = useProjectUtils();
  
  // Usar useMemo para cálculos costosos
  const projectActivities = React.useMemo(() => 
    getProjectActivities(project.id, allActivities),
    [project.id, allActivities, forceRefreshKey]
  );

  const projectMembers = React.useMemo(() => 
    getProjectMembers(project.id, allMembers),
    [project.id, allMembers, forceRefreshKey]
  );

  // ✅ MODIFICADO: Nuevos cálculos de estadísticas simplificados
  const completedActivities = React.useMemo(() => 
    projectActivities.filter(a => a.status === 'completed').length,
    [projectActivities, forceRefreshKey]
  );
  
  const inProgressActivities = React.useMemo(() => 
    projectActivities.filter(a => a.status === 'in_progress').length,
    [projectActivities, forceRefreshKey]
  );
  
  const pendingRedActivities = React.useMemo(() => 
    projectActivities.filter(a => isActivityPendingRed(a)).length,
    [projectActivities, forceRefreshKey]
  );
  
  const pendingNormalActivities = React.useMemo(() => 
    projectActivities.filter(a => isActivityPendingNormal(a)).length,
    [projectActivities, forceRefreshKey]
  );

  const totalActivities = React.useMemo(() => 
    projectActivities.length,
    [projectActivities, forceRefreshKey]
  );

  const progress = React.useMemo(() => 
    calculateProjectProgress(projectActivities),
    [projectActivities, forceRefreshKey]
  );

  const daysRemaining = React.useMemo(() => 
    getDaysRemaining(project.end_date),
    [project.end_date, forceRefreshKey]
  );

  const isCurrentUserLeader = currentUser?.user_role === 'leader';

  // ✅ CORRECCIÓN: Usar la función unificada de colores
  const projectColors = getProjectColors(project);

  const handleActivityClick = (activity) => {
    window.location.href = createPageUrl(`ActivityDetail?id=${activity.id}`);
  };

  // ALTURA COMPLETAMENTE SEPARADA
  const getTimelineContainerHeight = () => {
    const FIXED_ACTIVITY_HEIGHT = 180;
    const SPACING_BETWEEN_ACTIVITIES = 80;
    const MIN_HEIGHT = 600;
    
    const calculatedHeight = (projectActivities.length * FIXED_ACTIVITY_HEIGHT) + 
                           ((projectActivities.length - 1) * SPACING_BETWEEN_ACTIVITIES);
    
    return Math.max(MIN_HEIGHT, calculatedHeight);
  };

  const timelineContainerHeight = getTimelineContainerHeight();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-32 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-2xl border border-gray-200 mx-auto w-full max-w-7xl isolate"
    >
      {/* Punto del proyecto CENTRADO Y SEPARADO */}
      <div className="flex justify-center mb-12">
        <ProjectTimelineDot 
          project={{...project, activitiesCount: totalActivities}}
          isCurrentUserLeader={isCurrentUserLeader}
          onEdit={onEditProject}
          onDelete={onDeleteProject}
        />
      </div>

      {/* Línea de tiempo COMPLETAMENTE AISLADA */}
      <div className="flex justify-center my-12">
        <div className="relative isolate" style={{ 
          height: `${timelineContainerHeight}px`, 
          width: '100%', 
          maxWidth: '1200px' 
        }}>
          <TimelineWithDots 
            activities={projectActivities}
            project={project}
            onActivityClick={handleActivityClick}
            projectMembers={projectMembers} // ✅ NUEVO: Pasar miembros
          />
        </div>
      </div>

      {/* Información del proyecto - COMPLETAMENTE SEPARADA */}
      <div className="flex justify-center mt-16">
        <div className="w-full max-w-4xl">
          <Card className="hover:shadow-2xl transition-all duration-300 border-2 transform hover:-translate-y-1 isolate">
            {/* CORRECCIÓN: Barra de color usando el color del proyecto */}
            <div 
              className="h-3 rounded-t-xl" 
              style={{ background: projectColors.gradient }}
            />
            
            <CardHeader className="pb-6 text-center">
              <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                <CardTitle 
                  className="text-3xl font-bold hover:opacity-70 transition-colors cursor-pointer mb-4"
                  style={{ 
                    background: projectColors.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {project.name || project.title || 'Proyecto sin nombre'}
                </CardTitle>
              </Link>
              <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
                {project.description || "Sin descripción"}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-semibold text-gray-700 flex items-center gap-3">
                    <TrendingUp className="w-5 h-5" />
                    Progreso del Proyecto
                  </span>
                  <span 
                    className="text-2xl font-bold"
                    style={{ 
                      background: projectColors.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-4" />
                <div className="flex justify-between mt-3 text-sm text-gray-500">
                  <span className="font-medium">{completedActivities}/{totalActivities} actividades completadas</span>
                  {project.expected_activities > 0 && (
                    <span className="font-medium">Meta: {project.expected_activities} actividades</span>
                  )}
                </div>
              </div>

              {/* ✅ MODIFICADO: Cuadrícula de estadísticas simplificada - SOLO 3 CATEGORÍAS */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">{completedActivities}</p>
                  <p className="text-sm text-green-600 font-medium">Completadas</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{inProgressActivities}</p>
                  <p className="text-sm text-blue-600 font-medium">En Progreso</p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <Clock className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  {/* ✅ MODIFICADO: Total de pendientes (normales + activas) */}
                  <p className="text-2xl font-bold text-red-700">{pendingNormalActivities + pendingRedActivities}</p>
                  <p className="text-sm text-red-600 font-medium">Pendientes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Users className="w-6 h-6 flex-shrink-0" style={{ color: projectColors.solid }} /> {/* ✅ Usar color sólido */}
                  <div className="text-center">
                    <p className="text-gray-500 font-medium">Miembros del equipo</p>
                    <p className="text-xl font-bold" style={{ color: projectColors.solid }}>{projectMembers.length} colaboradores</p> {/* ✅ Usar color sólido */}
                  </div>
                </div>

                {daysRemaining !== null && daysRemaining >= 0 && (
                  <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-6 h-6 flex-shrink-0" style={{ color: projectColors.solid }} /> {/* ✅ Usar color sólido */}
                    <div className="text-center">
                      <p className="text-gray-500 font-medium">Días restantes</p>
                      <p 
                        className="text-xl font-bold" 
                        style={{ 
                          color: daysRemaining < 7 ? '#ef4444' : projectColors.solid // ✅ Usar color sólido
                        }}
                      >
                        {daysRemaining} días
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
});

// ✅ COMPONENTE PRINCIPAL TIMELINEVIEW CORREGIDO
export default function TimelineView({ 
  project,
  allActivities: initialActivities,
  allMembers: initialMembers,
  currentUser,
  onDeleteProject,
  onEditProject
}) {
  const queryClient = useQueryClient();
  const [activities, setActivities] = useState(initialActivities || []);
  const [members, setMembers] = useState(initialMembers || []);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  // ✅ NUEVO: Sincronización en tiempo real
  const { forceRefresh } = useRealTimeDataSync(project?.id);

  // ✅ FUNCIÓN PARA REFRESCAR DATOS EN TIEMPO REAL
  const refreshData = useCallback(async () => {
    try {
      console.log('🔄 Refrescando datos de timeline...');
      
      // Obtener datos actualizados de localStorage
      const updatedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
      const updatedMembers = JSON.parse(localStorage.getItem('projectMembers') || '[]');
      
      setActivities(updatedActivities);
      setMembers(updatedMembers);
      setLastRefresh(Date.now());
      
      // Invalidar queries de React Query si se está usando
      queryClient.invalidateQueries(['activities']);
      queryClient.invalidateQueries(['projectMembers']);
      queryClient.invalidateQueries(['timeline']);
      
    } catch (error) {
      console.error('Error refrescando datos:', error);
    }
  }, [queryClient]);

  // ✅ EFECTO PARA SUSCRIBIRSE A EVENTOS DE ACTUALIZACIÓN
  useEffect(() => {
    // Suscribirse a eventos de actualización de actividades
    const handleActivitiesUpdated = () => {
      console.log('📢 Evento de actividades recibido, refrescando...');
      refreshData();
    };

    // Escuchar eventos personalizados
    window.addEventListener('activitiesUpdated', handleActivitiesUpdated);
    window.addEventListener('notificationsUpdated', handleActivitiesUpdated);
    
    // Suscribirse al NotificationManager
    const unsubscribe = localClient.notificationManager.subscribe((data) => {
      if (data.type === 'new_notification' || 
          data.type === 'notification_updated' ||
          data.type === 'force_refresh') {
        console.log('📢 Notificación del manager, refrescando timeline...');
        refreshData();
      }
    });

    return () => {
      window.removeEventListener('activitiesUpdated', handleActivitiesUpdated);
      window.removeEventListener('notificationsUpdated', handleActivitiesUpdated);
      unsubscribe();
    };
  }, [refreshData]);

  // ✅ EFECTO PARA REFRESCAR CUANDO CAMBIA project O forceRefresh
  useEffect(() => {
    if (project?.id) {
      refreshData();
    }
  }, [project?.id, forceRefresh, refreshData]);

  // ✅ EFECTO PARA SINCORNIZAR CON PROPS INICIALES
  useEffect(() => {
    setActivities(initialActivities || []);
    setMembers(initialMembers || []);
  }, [initialActivities, initialMembers]);

  // ✅ NUEVO: Función para forzar actualización de datos
  const refreshAllData = useCallback(() => {
    queryClient.invalidateQueries(['projects']);
    queryClient.invalidateQueries(['activities']);
    queryClient.invalidateQueries(['projectMembers']);
    queryClient.invalidateQueries(['timeline']);
    refreshData();
  }, [queryClient, refreshData]);

  // ✅ NUEVO: Función para manejar la edición del proyecto
  const handleEditProject = (project) => {
    setProjectToEdit(project);
    setEditDialogOpen(true);
  };

  // ✅ NUEVO: Función para enviar la edición
  const handleSubmitEdit = async (projectData) => {
    try {
      await onEditProject(projectData);
      setEditDialogOpen(false);
      setProjectToEdit(null);
      refreshAllData();
    } catch (error) {
      console.error('Error editing project:', error);
    }
  };

  // ✅ RENDERIZAR ESTADO VACÍO
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="w-40 h-40 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center mb-8 shadow-2xl">
          <FolderKanban className="w-20 h-20 text-gray-400" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4 text-center">Selecciona un proyecto</h3>
        <p className="text-gray-600 text-center text-xl mb-8 max-w-md leading-relaxed">
          Elige un proyecto de la lista para ver su línea de tiempo y progreso detallado
        </p>
      </div>
    );
  }

  // ✅ BOTÓN DE REFRESCAR MANUAL (útil para debugging)
  const RefreshButton = () => (
    <div className="fixed bottom-8 right-8 z-40">
      <Button
        onClick={refreshData}
        className="rounded-full shadow-xl hover:shadow-2xl transition-all p-0"
        style={{ 
          background: 'linear-gradient(to right, #4c0519, #7d1128)',
          width: '56px',
          height: '56px'
        }}
        title="Refrescar línea de tiempo"
      >
        <RefreshCw className={`w-6 h-6 text-white ${lastRefresh ? 'animate-spin-once' : ''}`} />
      </Button>
      <style jsx>{`
        @keyframes spinOnce {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-once {
          animation: spinOnce 0.6s ease-out;
        }
      `}</style>
    </div>
  );

  return (
    <>
      <div className="relative space-y-32 py-16 bg-gradient-to-br from-gray-50 to-white min-h-screen w-full max-w-7xl mx-auto px-4 isolate">
        <MemoizedProjectTimelineItem
          key={`${project.id}_${lastRefresh}`} // Forzar re-render cuando cambia lastRefresh
          project={project}
          allActivities={activities}
          allMembers={members}
          currentUser={currentUser}
          onDeleteProject={onDeleteProject}
          onEditProject={handleEditProject}
          forceRefreshKey={lastRefresh} // Pasar clave de actualización
        />
      </div>
      
      {/* ✅ AGREGAR: Diálogo de edición */}
      {projectToEdit && (
        <EditProjectDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleSubmitEdit}
          project={projectToEdit}
          currentUser={currentUser}
        />
      )}
      
      <RefreshButton />
    </>
  );
}