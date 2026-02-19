import React, { useState, useCallback, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Calendar, Users, TrendingUp, Loader2, Activity, BarChart3, Trash2, Edit, CheckCircle2, RotateCcw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";

// IMPORTANTE: ActivityCard SIMPLIFICADO PERO COMPATIBLE
const ActivityCard = ({ 
  activity, 
  assignedMember, 
  onComplete, 
  onEdit, 
  onDelete, 
  onReopen, 
  isLeader,
  isCompleting = false,
  isReopening = false,
  isDeleting = false 
}) => {
  const isOverdue = activity.end_date && isPast(new Date(activity.end_date)) && activity.status !== 'completed';
  const displayStatus = isOverdue ? 'overdue' : activity.status;
  const isCompleted = activity.status === 'completed';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: '#4c0519' }}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1" style={{ color: '#4c0519' }}>
            {activity.title}
          </h4>
          {activity.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {activity.description}
            </p>
          )}
        </div>
        <Badge className={
          displayStatus === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
          displayStatus === 'overdue' ? 'text-white border-[#7d1128]' :
          displayStatus === 'in_progress' ? 'text-white border-[#4c0519]' :
          'bg-gray-100 text-gray-800 border-gray-300'
        }>
          {displayStatus === 'completed' ? 'Completada' : 
           displayStatus === 'overdue' ? 'Vencida' : 
           displayStatus === 'in_progress' ? 'En Progreso' : 'Pendiente'}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3 text-sm mb-3">
        {activity.start_date && (
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Inicio: {format(new Date(activity.start_date), "d MMM", { locale: es })}</span>
          </div>
        )}
        {activity.end_date && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'font-semibold' : 'text-gray-600'}`} style={isOverdue ? { color: '#7d1128' } : {}}>
            <Calendar className="w-4 h-4" />
            <span>Fin: {format(new Date(activity.end_date), "d MMM", { locale: es })}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        {assignedMember ? (
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(76, 5, 25, 0.05)' }}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4c0519] to-[#7d1128] flex items-center justify-center text-xs text-white font-bold">
              {assignedMember.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {assignedMember.name}
              </p>
              <p className="text-xs text-gray-600 truncate">{assignedMember.position || 'Colaborador'}</p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-500 italic">Sin asignar</span>
        )}

        <div className="flex gap-1">
          {/* Botón Reabrir */}
          {isCompleted && isLeader && onReopen && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReopen(activity)}
              style={{ color: '#4c0519' }}
              title="Reabrir actividad"
              disabled={isReopening}
            >
              {isReopening ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Botón Completar */}
          {!isCompleted && onComplete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onComplete(activity)}
              style={{ color: '#4c0519' }}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              <span className="hidden sm:inline">Completar</span>
            </Button>
          )}

          {/* Botón Editar */}
          {isLeader && onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(activity)}
              style={{ color: '#4c0519' }}
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}

          {/* 🔥 BOTÓN ELIMINAR - MEJORADO */}
          {isLeader && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (window.confirm(`¿Estás seguro de eliminar "${activity.title}"?\nEsta acción no se puede deshacer.`)) {
                  onDelete(activity.id);
                }
              }}
              style={{ color: '#dc2626' }}
              disabled={isDeleting}
              title="Eliminar"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mostrar quién completó la actividad */}
      {isCompleted && activity.completed_by_name && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Completada por:</span>
            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-xs text-white">
              {activity.completed_by_name[0]?.toUpperCase() || '?'}
            </div>
            <span className="font-medium">{activity.completed_by_name}</span>
            {activity.completed_date && (
              <span className="text-gray-500">
                el {format(new Date(activity.completed_date), "d MMM", { locale: es })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import CreateActivityDialog from "../components/project/CreateActivityDialog";
import TeamManagement from "../components/project/TeamManagement";
import AddMemberDialog from "../components/project/AddMemberDialog";

// Componente de Tabs simplificado para evitar dependencias
const Tabs = ({ value, onValueChange, children }) => {
  return (
    <div className="tabs">
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeValue: value, onValueChange })
      )}
    </div>
  );
};

const TabsList = ({ children, activeValue, onValueChange, className }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeValue, onValueChange })
      )}
    </div>
  );
};

const TabsTrigger = ({ value, children, activeValue, onValueChange, className }) => {
  const isActive = activeValue === value;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white text-[#4c0519] shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, activeValue }) => {
  if (activeValue !== value) return null;

  return (
    <div className="mt-2">
      {children}
    </div>
  );
};

// ✅ FUNCIÓN AUXILIAR para calcular progreso
const calculateProjectProgress = (activities) => {
  if (!activities || activities.length === 0) return 0;
  
  const completedCount = activities.filter(a => a.status === 'completed').length;
  const progress = Math.round((completedCount / activities.length) * 100);
  
  return progress;
};

export default function ProjectDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("activities");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const queryClient = useQueryClient();

  const projectId = searchParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => localClient.auth.me(),
    staleTime: Infinity,
  });

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await localClient.entities.Project.list();
      return projects.find(p => p.id === projectId);
    },
    enabled: !!projectId,
  });

  const { data: activities = [], isLoading: loadingActivities, refetch: refetchActivities } = useQuery({
    queryKey: ['activities', projectId],
    queryFn: async () => {
      const allActivities = await localClient.entities.Activity.list();
      return allActivities
        .filter(a => a.project_id === projectId)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!projectId,
  });

  const { data: members = [], refetch: refetchMembers } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const allMembers = await localClient.entities.ProjectMember.list();
      return allMembers.filter(m => m.project_id === projectId);
    },
    enabled: !!projectId,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => localClient.entities.User.list(),
  });

  // Determinar si el usuario actual es miembro del proyecto
  const isProjectMember = members.some(member => member.user_id === user?.id);
  const isCurrentUserLeader = user?.user_role === 'leader';

  // ✅ FUNCIÓN MEJORADA para actualizar el progreso del proyecto
  const updateProjectProgress = useCallback(async () => {
    try {
      const currentProgress = calculateProjectProgress(activities);
      
      console.log('🔄 Actualizando progreso del proyecto:', {
        projectId,
        actividadesTotales: activities.length,
        completadas: activities.filter(a => a.status === 'completed').length,
        progresoCalculado: currentProgress
      });

      // Actualizar el proyecto
      await localClient.entities.Project.update(projectId, { 
        progress: currentProgress 
      });

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      
      // 🔥 DISPARAR EVENTO GLOBAL para actualizar timeline
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('projectUpdated', {
          detail: { 
            projectId, 
            progress: currentProgress,
            action: 'progress_updated'
          }
        }));
      }, 100);

    } catch (error) {
      console.error('❌ Error al actualizar el progreso del proyecto:', error);
    }
  }, [projectId, activities, queryClient]);

  // ✅ FUNCIÓN handleAddMember CORREGIDA (como se solicita)
  const handleAddMember = async (memberData) => {
    try {
      console.log('Agregando miembro:', memberData);
      const result = await localClient.entities.ProjectMember.create({
        ...memberData,
        project_id: projectId,
        joined_date: new Date().toISOString().split('T')[0]
      });
      console.log('Miembro agregado:', result);
      
      // Refrescar la lista de miembros
      await refetchMembers();
      
      // También invalidar queries para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      
      return result;
    } catch (error) {
      console.error('Error al agregar miembro:', error);
      throw error; // Esto mostrará el error en el diálogo
    }
  };

  // ✅ MUTACIÓN MEJORADA para completar actividades (USANDO EL MÉTODO CORRECTO)
  const completeActivityMutation = useMutation({
    mutationFn: async (activity) => {
      console.log('✅ Completando actividad:', activity.id);
      
      // Usar el mismo método que ActivityDetail.jsx
      const updatedActivity = await localClient.entities.Activity.completeWithProgressUpdate(
        activity.id, 
        user.id
      );
      
      // 🔥 DISPARAR EVENTO GLOBAL
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('activityUpdated', {
          detail: { 
            activityId: activity.id, 
            projectId: projectId, 
            action: 'completed',
            updatedActivity: updatedActivity
          }
        }));
      }, 200);
      
      return updatedActivity;
    },
    onSuccess: (updatedActivity) => {
      console.log('✅ Actividad completada, actualizando queries...');
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      
      // Forzar recarga inmediata
      setTimeout(() => {
        refetchActivities();
        updateProjectProgress();
      }, 300);
    },
    onError: (error) => {
      console.error('❌ Error completando actividad:', error);
    }
  });

  // ✅ MUTACIÓN MEJORADA para reabrir actividades (USANDO EL MÉTODO CORRECTO)
  const reopenActivityMutation = useMutation({
    mutationFn: async (activity) => {
      console.log('🔄 Reabriendo actividad:', activity.id);
      
      const updatedActivity = await localClient.entities.Activity.reopenWithProgressUpdate(activity.id);
      
      // 🔥 DISPARAR EVENTO GLOBAL
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('activityUpdated', {
          detail: { 
            activityId: activity.id, 
            projectId: projectId, 
            action: 'reopened',
            updatedActivity: updatedActivity
          }
        }));
      }, 200);
      
      return updatedActivity;
    },
    onSuccess: (updatedActivity) => {
      console.log('🔄 Actividad reabierta, actualizando queries...');
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      
      // Forzar recarga inmediata
      setTimeout(() => {
        refetchActivities();
        updateProjectProgress();
      }, 300);
    },
    onError: (error) => {
      console.error('❌ Error reabriendo actividad:', error);
    }
  });

  // ✅ MUTACIÓN MEJORADA para crear o actualizar actividades
  const createOrUpdateActivityMutation = useMutation({
    mutationFn: async (activityData) => {
      let activity;
      
      if (editingActivity) {
        console.log('✏️ Editando actividad:', editingActivity.id);
        activity = await localClient.entities.Activity.update(editingActivity.id, {
          ...activityData,
          project_id: projectId,
          status: activityData.assigned_to ? 'assigned' : 'pending'
        });
      } else {
        console.log('➕ Creando nueva actividad');
        activity = await localClient.entities.Activity.create({
          ...activityData,
          project_id: projectId,
          status: activityData.assigned_to ? 'assigned' : 'pending',
          created_date: new Date().toISOString()
        });
      }

      return activity;
    },
    onSuccess: (activity) => {
      console.log('✅ Actividad guardada, actualizando queries...');
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      
      // Actualizar progreso
      updateProjectProgress();
      
      // Cerrar diálogo
      setShowCreateDialog(false);
      setEditingActivity(null);
      
      // 🔥 DISPARAR EVENTO GLOBAL
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('activityUpdated', {
          detail: { 
            activityId: activity.id, 
            projectId: projectId, 
            action: editingActivity ? 'updated' : 'created',
            updatedActivity: activity
          }
        }));
      }, 200);
    },
  });

  // ✅ MUTACIÓN MEJORADA para eliminar actividades
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId) => {
      console.log('🗑️ Eliminando actividad:', activityId);
      
      const result = await localClient.entities.Activity.delete(activityId);
      
      // 🔥 DISPARAR EVENTO GLOBAL
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('activityUpdated', {
          detail: { 
            activityId: activityId, 
            projectId: projectId, 
            action: 'deleted'
          }
        }));
      }, 200);
      
      return result;
    },
    onSuccess: () => {
      console.log('✅ Actividad eliminada, actualizando queries...');
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      
      // Actualizar progreso
      updateProjectProgress();
      
      // Forzar recarga
      setTimeout(() => {
        refetchActivities();
      }, 300);
    },
    onError: (error) => {
      console.error('❌ Error eliminando actividad:', error);
      alert('Error al eliminar la actividad');
    }
  });

  // ✅ MUTACIÓN ACTUALIZADA para agregar o actualizar miembros (USANDO LA NUEVA FUNCIÓN)
  const addOrUpdateMemberMutation = useMutation({
    mutationFn: async (memberData) => {
      if (editingMember) {
        // Actualizar miembro existente
        console.log('✏️ Editando miembro:', editingMember.id);
        const result = await localClient.entities.ProjectMember.update(editingMember.id, {
          ...memberData,
          project_id: projectId
        });
        console.log('Miembro actualizado:', result);
        return result;
      } else {
        // Agregar nuevo miembro usando la función handleAddMember
        console.log('➕ Agregando nuevo miembro');
        return await handleAddMember(memberData);
      }
    },
    onSuccess: () => {
      console.log('✅ Miembro guardado, actualizando queries...');
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      refetchMembers();
      setShowAddMemberDialog(false);
      setEditingMember(null);
    },
    onError: (error) => {
      console.error('❌ Error al guardar miembro:', error);
    }
  });

  // Mutación para eliminar miembros
  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => localClient.entities.ProjectMember.delete(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      refetchMembers();
    },
  });

  // Handlers para actividades
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setShowCreateDialog(true);
  };

  const handleCreateActivity = () => {
    setEditingActivity(null);
    setShowCreateDialog(true);
  };

  // Handler para eliminar actividades - CON CONFIRMACIÓN
  const handleDeleteActivity = (activityId) => {
    deleteActivityMutation.mutate(activityId);
  };

  // Handlers para miembros
  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowAddMemberDialog(true);
  };

  const handleOpenAddMemberDialog = () => {
    setEditingMember(null);
    setShowAddMemberDialog(true);
  };

  // Cálculos para estadísticas - MODIFICADO
  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const pendingActivities = activities.filter(a => a.status === 'pending').length;
  const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
  const notCompletedActivities = activities.filter(a => a.status !== 'completed').length;

  // ✅ USAR EFECTO para actualizar progreso cuando cambien las actividades
  useEffect(() => {
    if (activities.length > 0) {
      const currentProgress = calculateProjectProgress(activities);
      const storedProject = JSON.parse(localStorage.getItem('projects') || '[]')
        .find(p => p.id === projectId);
      
      // Si el progreso es diferente, actualizar
      if (storedProject && storedProject.progress !== currentProgress) {
        console.log('🔄 Sincronizando progreso del proyecto...');
        updateProjectProgress();
      }
    }
  }, [activities, projectId, updateProjectProgress]);

  // Estados de carga
  if (loadingProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4c0519' }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Proyecto no encontrado</h2>
          <Button
            onClick={() => navigate(createPageUrl("Timeline"))}
            style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
          >
            Volver al Timeline
          </Button>
        </div>
      </div>
    );
  }

  if (!isProjectMember && !isCurrentUserLeader) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso denegado</h2>
          <p className="text-gray-600 mb-4">No eres miembro de este proyecto.</p>
          <Button
            onClick={() => navigate(createPageUrl("Timeline"))}
            style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
          >
            Volver al Timeline
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-[#fdf2f4] via-[#f7f7f7] to-[#fdf2f4]">
      <div className="max-w-7xl mx-auto">
        {/* Header y Botón de volver */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Timeline"))}
            className="hover:bg-[#fdf2f4]"
            style={{ color: '#4c0519' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Timeline
          </Button>
          
          {isCurrentUserLeader && activeTab === "activities" && (
            <Button
              onClick={handleCreateActivity}
              className="text-white shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Nueva Actividad
            </Button>
          )}
        </div>

        {/* Información del Proyecto */}
        <Card className="mb-6 border-t-4 shadow-lg" style={{ borderTopColor: project.color || '#4c0519' }}>
          <CardHeader className="text-white rounded-t-lg" style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold mb-2">{project.name}</CardTitle>
                <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {project.description || "Sin descripción"}
                </p>
              </div>
              <Badge 
                className={`font-semibold ${
                  project.status === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-[#fdf2f4] text-[#4c0519]'
                }`}
              >
                {project.status === 'completed' ? 'Completado' : 'Activo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 mt-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#4c0519]">Progreso del Proyecto</span>
                <span className="text-2xl font-bold" style={{ 
                  background: 'linear-gradient(to right, #4c0519, #7d1128)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {project.progress || 0}%
                </span>
              </div>
              <Progress value={project.progress || 0} className="h-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.start_date && (
                <div className="flex items-center gap-2 p-3 bg-[#fdf2f4] rounded-lg">
                  <Calendar className="w-5 h-5 text-[#7d1128]" />
                  <div>
                    <p className="text-xs text-[#4c0519]">Inicio</p>
                    <p className="font-medium text-[#4c0519]">
                      {format(new Date(project.start_date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
              {project.end_date && (
                <div className="flex items-center gap-2 p-3 bg-[#fdf2f4] rounded-lg">
                  <Calendar className="w-5 h-5 text-[#7d1128]" />
                  <div>
                    <p className="text-xs text-[#4c0519]">Fin</p>
                    <p className="font-medium text-[#4c0519]">
                      {format(new Date(project.end_date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-[#fdf2f4] rounded-lg">
                <Activity className="w-5 h-5 text-[#7d1128]" />
                <div>
                  <p className="text-xs text-[#4c0519]">Actividades</p>
                  <p className="font-medium text-[#4c0519]">{activities.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-[#fdf2f4] rounded-lg">
                <Users className="w-5 h-5 text-[#7d1128]" />
                <div>
                  <p className="text-xs text-[#4c0519]">Miembros</p>
                  <p className="font-medium text-[#4c0519]">{members.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actividades ({activities.length})
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Equipo ({members.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          {/* Contenido de Actividades */}
          <TabsContent value="activities" activeValue={activeTab}>
            {loadingActivities ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4c0519' }} />
              </div>
            ) : activities.length === 0 ? (
              <Card className="p-12 shadow-lg text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(76, 5, 25, 0.1)' }}>
                  <Plus className="w-10 h-10" style={{ color: '#4c0519' }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hay actividades aún
                </h3>
                <p className="text-gray-600 mb-4">
                  {isCurrentUserLeader 
                    ? "Comienza agregando la primera actividad al proyecto"
                    : "El líder del proyecto agregará actividades pronto"}
                </p>
                {isCurrentUserLeader && (
                  <Button
                    onClick={handleCreateActivity}
                    className="text-white hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Primera Actividad
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {activities.map((activity) => {
                  const assignedMember = members.find(m => m.user_id === activity.assigned_to);
                  const isAssignedToCurrentUser = activity.assigned_to === user?.id;
                  
                  return (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      assignedMember={assignedMember}
                      onComplete={
                        (isAssignedToCurrentUser || isCurrentUserLeader) && activity.status !== 'completed' 
                          ? () => completeActivityMutation.mutate(activity) 
                          : undefined
                      }
                      onReopen={
                        isCurrentUserLeader && activity.status === 'completed'
                          ? () => reopenActivityMutation.mutate(activity)
                          : undefined
                      }
                      onEdit={
                        isCurrentUserLeader
                          ? () => handleEditActivity(activity)
                          : undefined
                      }
                      onDelete={
                        isCurrentUserLeader
                          ? (id) => handleDeleteActivity(id)
                          : undefined
                      }
                      isLeader={isCurrentUserLeader}
                      isCompleting={completeActivityMutation.isPending}
                      isReopening={reopenActivityMutation.isPending}
                      isDeleting={deleteActivityMutation.isPending}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Contenido de Equipo */}
          <TabsContent value="team" activeValue={activeTab}>
            <TeamManagement
              members={members}
              project={project}
              currentUser={user}
              onAddMember={isCurrentUserLeader ? handleOpenAddMemberDialog : undefined}
              onEditMember={isCurrentUserLeader ? handleEditMember : undefined}
              onRemoveMember={isCurrentUserLeader ? (memberId) => removeMemberMutation.mutate(memberId) : undefined}
            />
          </TabsContent>

          {/* Contenido de Estadísticas - MODIFICADO */}
          <TabsContent value="stats" activeValue={activeTab}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card className="text-center shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-green-100">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{completedActivities}</p>
                  <p className="text-sm text-gray-600">Completadas</p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-blue-100">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{inProgressActivities}</p>
                  <p className="text-sm text-gray-600">En Progreso</p>
                </CardContent>
              </Card>

              {/* TARJETA MODIFICADA - TODAS LAS NO COMPLETADAS */}
              <Card className="text-center shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-red-100">
                    <Calendar className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{notCompletedActivities}</p>
                  <p className="text-sm text-gray-600">Pendientes</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Resumen de Progreso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progreso General</span>
                      <span className="text-lg font-bold text-[#4c0519]">{project.progress || 0}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-3" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700">Completadas</span>
                        <span className="font-bold text-green-700">{completedActivities}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700">En Progreso</span>
                        <span className="font-bold text-blue-700">{inProgressActivities}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">Pendientes</span>
                        <span className="font-bold text-red-700">{notCompletedActivities}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Diálogos */}
        <CreateActivityDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) setEditingActivity(null);
          }}
          onSubmit={(data) => createOrUpdateActivityMutation.mutate(data)}
          members={members}
          currentUser={user}
          editingActivity={editingActivity}
        />

        <AddMemberDialog
          open={showAddMemberDialog}
          onOpenChange={(open) => {
            setShowAddMemberDialog(open);
            if (!open) setEditingMember(null);
          }}
          onSubmit={(data) => addOrUpdateMemberMutation.mutate(data)}
          project={project}
          editingMember={editingMember}
          allUsers={allUsers}
          currentMembers={members}
        />
      </div>
    </div>
  );
}