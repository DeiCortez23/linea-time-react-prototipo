import React, { useState } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, CheckCircle2, X, Loader2, Image as ImageIcon, Calendar, Users, User, Mail, Briefcase, FileText, MapPin } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Custom hook para manejar los datos de la actividad
const useActivityData = (activityId) => {
  const { data: activity, isLoading: loadingActivity, error, refetch } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: async () => {
      const activities = await localClient.entities.Activity.list();
      return activities.find(a => a.id === activityId);
    },
    enabled: !!activityId,
  });

  const { data: project } = useQuery({
    queryKey: ['project', activity?.project_id],
    queryFn: async () => {
      if (!activity?.project_id) return null;
      const projects = await localClient.entities.Project.list();
      return projects.find(p => p.id === activity.project_id);
    },
    enabled: !!activity?.project_id,
  });

  const { data: projectMembers = [] } = useQuery({
    queryKey: ['projectMembers', activity?.project_id],
    queryFn: async () => {
      if (!activity?.project_id) return [];
      const members = await localClient.entities.ProjectMember.list();
      return members.filter(m => m.project_id === activity.project_id);
    },
    enabled: !!activity?.project_id,
  });

  const { data: assignedUser } = useQuery({
    queryKey: ['user', activity?.assigned_to],
    queryFn: async () => {
      if (!activity?.assigned_to) return null;
      const users = await localClient.entities.User.list();
      return users.find(u => u.id === activity.assigned_to);
    },
    enabled: !!activity?.assigned_to,
  });

  const assignedMember = projectMembers.find(m => m.user_id === activity?.assigned_to);

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', activityId],
    queryFn: async () => {
      const allAttachments = await localClient.entities.Attachment.list();
      return allAttachments.filter(a => a.activity_id === activityId);
    },
    enabled: !!activityId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => localClient.auth.me(),
  });

  return {
    activity,
    loadingActivity,
    error,
    refetch,
    project,
    assignedUser,
    assignedMember,
    projectMembers,
    attachments,
    currentUser
  };
};

// Custom hook para manejar las mutaciones - VERSIÓN CORREGIDA
const useActivityMutations = (activityId, project) => {
  const queryClient = useQueryClient();

  const completeActivityMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await localClient.auth.me();
      return await localClient.entities.Activity.completeWithProgressUpdate(
        activityId, 
        currentUser.id
      );
    },
    onSuccess: (data) => {
      console.log('✅ Actividad completada, invalidando queries...');
      
      // ✅ INVALIDAR TODAS LAS QUERIES RELEVANTES
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['project', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectMembers', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      
      // ✅ FORZAR ACTUALIZACIÓN INMEDIATA EN LOCALSTORAGE
      const refreshData = () => {
        const storedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
        queryClient.setQueryData(['activities'], storedActivities);
        queryClient.setQueryData(['activities', project?.id], 
          storedActivities.filter(a => a.project_id === project?.id));
        
        const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        queryClient.setQueryData(['projects'], storedProjects);
        queryClient.setQueryData(['project', project?.id], 
          storedProjects.find(p => p.id === project?.id));
      };
      
      setTimeout(refreshData, 100);
      
      // ✅ DISPARAR EVENTO GLOBAL PARA TIMELINE
      window.dispatchEvent(new CustomEvent('activityUpdated', {
        detail: { 
          activityId, 
          projectId: project?.id, 
          action: 'completed',
          updatedActivity: data
        }
      }));
      
      // ✅ USAR EL NOTIFICATION MANAGER PARA ACTUALIZACIÓN EN TIEMPO REAL
      setTimeout(() => {
        if (localClient?.notificationManager) {
          localClient.notificationManager.forceRefresh(project?.id);
        }
      }, 200);
    },
  });

  const reopenActivityMutation = useMutation({
    mutationFn: async () => {
      return await localClient.entities.Activity.reopenWithProgressUpdate(activityId);
    },
    onSuccess: (data) => {
      console.log('🔄 Actividad reabierta, invalidando queries...');
      
      // ✅ INVALIDAR TODAS LAS QUERIES RELEVANTES
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['project', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectMembers', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      
      // ✅ FORZAR ACTUALIZACIÓN INMEDIATA EN LOCALSTORAGE
      const refreshData = () => {
        const storedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
        queryClient.setQueryData(['activities'], storedActivities);
        queryClient.setQueryData(['activities', project?.id], 
          storedActivities.filter(a => a.project_id === project?.id));
        
        const storedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        queryClient.setQueryData(['projects'], storedProjects);
        queryClient.setQueryData(['project', project?.id], 
          storedProjects.find(p => p.id === project?.id));
      };
      
      setTimeout(refreshData, 100);
      
      // ✅ DISPARAR EVENTO GLOBAL PARA TIMELINE
      window.dispatchEvent(new CustomEvent('activityUpdated', {
        detail: { 
          activityId, 
          projectId: project?.id, 
          action: 'reopened',
          updatedActivity: data
        }
      }));
      
      // ✅ USAR EL NOTIFICATION MANAGER PARA ACTUALIZACIÓN EN TIEMPO REAL
      setTimeout(() => {
        if (localClient?.notificationManager) {
          localClient.notificationManager.forceRefresh(project?.id);
        }
      }, 200);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId) => localClient.entities.Attachment.delete(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', activityId] });
      
      // ✅ DISPARAR EVENTO PARA ACTUALIZACIÓN DE ARCHIVOS
      window.dispatchEvent(new CustomEvent('attachmentsUpdated', {
        detail: { activityId, projectId: project?.id }
      }));
    },
  });

  const createAttachmentMutation = useMutation({
    mutationFn: (attachmentData) => localClient.entities.Attachment.create(attachmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', activityId] });
      
      // ✅ DISPARAR EVENTO PARA ACTUALIZACIÓN DE ARCHIVOS
      window.dispatchEvent(new CustomEvent('attachmentsUpdated', {
        detail: { activityId, projectId: project?.id }
      }));
    },
  });

  return {
    completeActivityMutation,
    reopenActivityMutation,
    deleteAttachmentMutation,
    createAttachmentMutation
  };
};

// Custom hook para manejar la subida de archivos (COMPATIBLE con localClient.js)
const useFileUpload = (activityId, projectId, currentUserId, createAttachment) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("El archivo es demasiado grande. Máximo 10MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const uploadResult = await localClient.integrations.Core.UploadFile({ file });
      
      if (!uploadResult.file_url) {
        throw new Error("No se pudo obtener la URL del archivo");
      }
      
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      
      await createAttachment({
        activity_id: activityId,
        project_id: projectId,
        uploaded_by: currentUserId,
        file_name: file.name,
        file_url: uploadResult.file_url,
        file_size: file.size,
        file_type: fileType,
        uploaded_date: new Date().toISOString()
      });

      e.target.value = '';

    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError("Error al subir el archivo. Intenta nuevamente.");
    } finally {
      setUploading(false);
    }
  };

  return { uploading, handleFileUpload, uploadError };
};

// ✅ NUEVO: Hook para sincronización en tiempo real
const useRealTimeSync = (activityId, projectId) => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const handleActivityUpdated = (event) => {
      if (event.detail.activityId === activityId) {
        console.log('📢 Evento de actividad recibido, refrescando...');
        queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        
        // Forzar recarga inmediata
        const storedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
        const updatedActivity = storedActivities.find(a => a.id === activityId);
        if (updatedActivity) {
          queryClient.setQueryData(['activity', activityId], updatedActivity);
        }
      }
    };

    const handleNotificationsUpdated = () => {
      console.log('📢 Notificación recibida, refrescando actividad...');
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
    };

    const handleAttachmentsUpdated = (event) => {
      if (event.detail.activityId === activityId) {
        console.log('📢 Archivos actualizados, refrescando...');
        queryClient.invalidateQueries({ queryKey: ['attachments', activityId] });
      }
    };

    // Suscribirse a eventos
    window.addEventListener('activityUpdated', handleActivityUpdated);
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    window.addEventListener('attachmentsUpdated', handleAttachmentsUpdated);
    
    // Suscribirse al NotificationManager si existe
    let unsubscribe = () => {};
    if (localClient?.notificationManager?.subscribe) {
      unsubscribe = localClient.notificationManager.subscribe((data) => {
        if (data.type === 'force_refresh' || data.type === 'new_notification') {
          console.log('📢 Manager: refrescando actividad...');
          queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }
      });
    }

    return () => {
      window.removeEventListener('activityUpdated', handleActivityUpdated);
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('attachmentsUpdated', handleAttachmentsUpdated);
      unsubscribe();
    };
  }, [activityId, projectId, queryClient]);

  return null;
};

// Componente para el header de la actividad
const ActivityHeader = ({ activity, project, onBack }) => {
  const isCompleted = activity.status === 'completed';
  const isOverdue = activity.end_date && new Date(activity.end_date) < new Date() && !isCompleted;

  return (
    <div className="flex items-center gap-4 mb-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-[#4c0519]">{activity.title}</h1>
        {project && (
          <p className="text-sm text-gray-500 mt-1">
            Proyecto: <span className="font-medium">{project.name}</span>
          </p>
        )}
      </div>
      <Badge className={`
        text-sm px-3 py-1
        ${isCompleted ? 'bg-green-100 text-green-800' : 
          isOverdue ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'}
      `}>
        {isCompleted ? 'Completada' : isOverdue ? 'Vencida' : 'En progreso'}
      </Badge>
    </div>
  );
};

// Componente para la descripción de la actividad
const ActivityDescription = ({ description }) => (
  <Card>
    <CardHeader>
      <CardTitle>Descripción</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-700 whitespace-pre-wrap">
        {description || "Sin descripción"}
      </p>
    </CardContent>
  </Card>
);

// Componente para los archivos adjuntos
const AttachmentsSection = ({ 
  attachments, 
  uploading, 
  onFileUpload, 
  onDeleteAttachment,
  uploadError 
}) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-center">
        <CardTitle>Archivos Adjuntos ({attachments.length})</CardTitle>
        <div className="flex flex-col items-end gap-2">
          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}
          <div>
            <Input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={onFileUpload}
              disabled={uploading}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              variant="outline"
              size="sm"
              disabled={uploading}
              style={{ color: '#4c0519', borderColor: '#4c0519' }}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Archivo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {attachments.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No hay archivos adjuntos</p>
          <p className="text-sm text-gray-400 mt-1">Sube imágenes, PDFs o documentos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((attachment) => (
            <AttachmentItem 
              key={attachment.id} 
              attachment={attachment} 
              onDelete={onDeleteAttachment}
            />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

// Componente para un archivo adjunto individual
const AttachmentItem = ({ attachment, onDelete }) => {
  const handlePreview = () => {
    window.open(attachment.file_url, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative group border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      {attachment.file_type === 'image' ? (
        <div className="cursor-pointer" onClick={handlePreview}>
          <img
            src={attachment.file_url}
            alt={attachment.file_name}
            className="w-full h-48 object-cover"
          />
        </div>
      ) : (
        <div 
          className="w-full h-48 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100"
          onClick={handlePreview}
        >
          <FileText className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 text-center px-2 line-clamp-2">
            {attachment.file_name}
          </p>
          {attachment.file_size && (
            <p className="text-xs text-gray-400 mt-1">
              {formatFileSize(attachment.file_size)}
            </p>
          )}
        </div>
      )}
      
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate" title={attachment.file_name}>
          {attachment.file_name}
        </p>
        <p className="text-xs text-gray-500 capitalize">
          {attachment.file_type} • {format(new Date(attachment.uploaded_date), "dd/MM/yy")}
        </p>
      </div>

      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-white"
        style={{ background: '#7d1128' }}
        onClick={() => onDelete(attachment.id)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

// Componente para los botones de acción
const ActivityActions = ({ 
  isCompleted, 
  onComplete, 
  onReopen,
  isCompleting,
  isReopening,
  currentUser
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5" />
        Acciones
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {!isCompleted && (
        <Button 
          onClick={onComplete}
          disabled={isCompleting}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isCompleting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          Marcar como completada
        </Button>
      )}
      
      {isCompleted && (
        <Button 
          onClick={onReopen}
          disabled={isReopening}
          variant="outline"
          className="w-full"
        >
          {isReopening ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          Reabrir actividad
        </Button>
      )}
    </CardContent>
  </Card>
);

// Función auxiliar para formatear fechas
const formatDateDisplay = (dateString) => {
  if (!dateString) return "No definida";
  try {
    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch (error) {
    return "Fecha inválida";
  }
};

// Componente para la información del proyecto
const ProjectInfoSection = ({ project }) => {
  if (!project) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-gray-900 text-lg">{project.name}</p>
            {project.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">{project.description}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Progreso general</span>
              <span className="text-sm font-bold text-[#4c0519]">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#4c0519] h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 font-medium">Estado</p>
              <Badge className={`
                mt-1
                ${project.status === 'active' ? 'bg-green-100 text-green-800 border-green-300' : 
                  project.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-300' : 
                  'bg-gray-100 text-gray-800 border-gray-300'}
              `}>
                {project.status === 'active' ? 'Activo' : 
                 project.status === 'completed' ? 'Completado' : 
                 project.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Prioridad</p>
              <Badge className={`
                mt-1
                ${project.priority === 'high' ? 'bg-red-100 text-red-800 border-red-300' : 
                  project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                  'bg-green-100 text-green-800 border-green-300'}
              `}>
                {project.priority === 'high' ? 'Alta' : 
                 project.priority === 'medium' ? 'Media' : 
                 'Baja'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 font-medium">Fecha inicio</p>
              <p className="text-sm font-medium text-gray-900">
                {project.start_date ? format(new Date(project.start_date), "dd/MM/yy") : 'No definida'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Fecha fin</p>
              <p className="text-sm font-medium text-gray-900">
                {project.end_date ? format(new Date(project.end_date), "dd/MM/yy") : 'No definida'}
              </p>
            </div>
          </div>

          {project.budget && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-medium">Presupuesto</p>
              <p className="text-sm font-medium text-gray-900">
                ${project.budget.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de loading
const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-[#4c0519]" />
  </div>
);

// Componente de error
const ErrorState = ({ onBack }) => (
  <div className="text-center py-8">
    <p className="text-red-600">Error cargando la actividad</p>
    <Button onClick={onBack} className="mt-4">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Volver
    </Button>
  </div>
);

// Componente principal - VERSIÓN ACTUALIZADA
export default function ActivityDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activityId = searchParams.get('id');

  const { 
    activity, 
    loadingActivity, 
    error, 
    project, 
    assignedUser, 
    assignedMember, 
    attachments, 
    currentUser,
    refetch // ✅ Añadir refetch de useActivityData
  } = useActivityData(activityId);
  
  const { 
    completeActivityMutation, 
    reopenActivityMutation, 
    deleteAttachmentMutation,
    createAttachmentMutation 
  } = useActivityMutations(activityId, project);
  
  const { uploading, handleFileUpload, uploadError } = useFileUpload(
    activityId, 
    activity?.project_id,
    currentUser?.id,
    createAttachmentMutation.mutate
  );

  // ✅ USAR SINCRONIZACIÓN EN TIEMPO REAL
  useRealTimeSync(activityId, project?.id);

  // ✅ FUNCIÓN MEJORADA PARA COMPLETAR ACTIVIDAD
  const handleCompleteActivity = async () => {
    try {
      await completeActivityMutation.mutateAsync();
      
      // ✅ FORZAR REFRESH INMEDIATO
      setTimeout(() => {
        refetch(); // Refetch de useActivityData
        // Actualizar datos locales
        const storedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
        const updatedActivity = storedActivities.find(a => a.id === activityId);
        
        if (updatedActivity) {
          console.log('🔄 Actividad actualizada en tiempo real:', updatedActivity.status);
        }
      }, 300);
    } catch (error) {
      console.error('Error completando actividad:', error);
    }
  };

  // ✅ FUNCIÓN MEJORADA PARA REABRIR ACTIVIDAD
  const handleReopenActivity = async () => {
    try {
      await reopenActivityMutation.mutateAsync();
      
      // ✅ FORZAR REFRESH INMEDIATO
      setTimeout(() => {
        refetch(); // Refetch de useActivityData
        // Actualizar datos locales
        const storedActivities = JSON.parse(localStorage.getItem('activities') || '[]');
        const updatedActivity = storedActivities.find(a => a.id === activityId);
        
        if (updatedActivity) {
          console.log('🔄 Actividad reabierta en tiempo real:', updatedActivity.status);
        }
      }, 300);
    } catch (error) {
      console.error('Error reabriendo actividad:', error);
    }
  };

  if (loadingActivity) {
    return <LoadingState />;
  }

  if (error || !activity) {
    return <ErrorState onBack={() => navigate(-1)} />;
  }

  const handleBack = () => {
    if (activity.project_id) {
      navigate(createPageUrl(`ProjectDetail?id=${activity.project_id}`));
    } else {
      navigate(-1);
    }
  };

  const isCompleted = activity.status === 'completed';

  // Mostrar indicador de actualización
  const showUpdateIndicator = completeActivityMutation.isPending || reopenActivityMutation.isPending;

  // Función para obtener la fecha de inicio (actividad o proyecto)
  const getStartDate = () => {
    if (activity.start_date) {
      return {
        date: activity.start_date,
        isProjectDate: false
      };
    } else if (project?.start_date) {
      return {
        date: project.start_date,
        isProjectDate: true
      };
    } else {
      return {
        date: null,
        isProjectDate: false
      };
    }
  };

  const startDateInfo = getStartDate();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {showUpdateIndicator && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg shadow-lg border border-blue-200">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Actualizando...</span>
          </div>
        </div>
      )}
      
      <ActivityHeader 
        activity={activity} 
        project={project} 
        onBack={handleBack}
      />
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* COLUMNA PRINCIPAL - 3/4 del ancho */}
        <div className="xl:col-span-3 space-y-6">
          {/* Descripción */}
          <ActivityDescription description={activity.description} />

          {/* Grid de información principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Fechas de la actividad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Fechas
                  {showUpdateIndicator && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-2"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Fecha de inicio
                    {startDateInfo.isProjectDate && (
                      <span className="text-xs text-blue-600 ml-2">(del proyecto)</span>
                    )}
                  </label>
                  <div className={`mt-1 p-2 rounded border ${startDateInfo.date ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'}`}>
                    {startDateInfo.date ? (
                      <div className="text-gray-900">
                        {formatDateDisplay(startDateInfo.date)}
                        {startDateInfo.isProjectDate && (
                          <p className="text-xs text-blue-600 mt-1">
                            Usando fecha de inicio del proyecto
                          </p>
                        )}
                      </div>
                    ) : (
                      "No definida"
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha de término</label>
                  <div className={`mt-1 p-2 rounded border ${activity.end_date ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'}`}>
                    {formatDateDisplay(activity.end_date)}
                  </div>
                </div>

                {assignedMember?.agreed_delivery_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Fecha pactada de entrega
                    </label>
                    <div className="mt-1 p-2 rounded border bg-blue-50 border-blue-200">
                      <div className="text-gray-900 font-medium">
                        {formatDateDisplay(assignedMember.agreed_delivery_date)}
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Fecha acordada con el colaborador para revisión previa a productivo
                      </p>
                    </div>
                  </div>
                )}

                {activity.completed_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha de completado</label>
                    <div className="mt-1 p-2 rounded border bg-green-50 border-green-200">
                      <div className="text-green-900 font-medium">
                        {formatDateDisplay(activity.completed_date)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información de asignación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Asignación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={assignedUser.avatar_url} />
                        <AvatarFallback className="text-white" style={{ 
                          background: 'linear-gradient(135deg, #4c0519, #7d1128)' 
                        }}>
                          {assignedUser.full_name?.[0]?.toUpperCase() || assignedUser.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {assignedUser.full_name || assignedUser.email}
                          </p>
                          {assignedMember?.role && (
                            <Badge className={`text-xs ${assignedMember.role === 'leader' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {assignedMember.role === 'leader' ? 'Líder' : 'Colaborador'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{assignedUser.email}</p>
                        {assignedUser.position && (
                          <p className="text-xs text-gray-500 mt-1">{assignedUser.position}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-blue-600" />
                          <a 
                            href={`mailto:${assignedUser.email}`}
                            className="text-sm text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            {assignedUser.email}
                          </a>
                        </div>
                        {assignedUser.phone && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-3 h-3 text-blue-600" />
                            <span className="text-sm text-blue-700">{assignedUser.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-400">Sin asignar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Archivos adjuntos */}
          <AttachmentsSection
            attachments={attachments}
            uploading={uploading}
            onFileUpload={handleFileUpload}
            onDeleteAttachment={deleteAttachmentMutation.mutate}
            uploadError={uploadError}
          />
        </div>

        {/* SIDEBAR - 1/4 del ancho */}
        <div className="space-y-6">
          <ActivityActions 
            isCompleted={isCompleted}
            onComplete={handleCompleteActivity} // ✅ Usar función mejorada
            onReopen={handleReopenActivity} // ✅ Usar función mejorada
            isCompleting={completeActivityMutation.isPending}
            isReopening={reopenActivityMutation.isPending}
            currentUser={currentUser}
          />
          
          {project && (
            <ProjectInfoSection project={project} />
          )}
        </div>
      </div>
    </div>
  );
}