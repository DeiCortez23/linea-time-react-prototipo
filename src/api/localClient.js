// 📂 api/localClient.js
// VERSIÓN COMPLETA CON EVENTOS GLOBALES Y PROTECCIÓN CONTRA DUPLICADOS
// ✅ INCLUYE CREACIÓN AUTOMÁTICA DE USUARIOS POR EMAIL

// ✅ SISTEMA DE EVENTOS GLOBAL MEJORADO
const NotificationManager = {
  listeners: new Set(),
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  
  notify(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  },
  
  // Nueva función para forzar actualización
  forceRefresh(userId) {
    this.notify({ type: 'force_refresh', userId });
  }
};

// ✅ FUNCIONES DE FECHA
const formatDateForStorage = (date) => {
  if (!date) return null;
  
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  if (date instanceof Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
};

// ✅ SISTEMA DE NOTIFICACIONES MEJORADO - TIEMPO REAL GARANTIZADO
const createRealTimeNotification = async (notificationData) => {
  try {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: notificationData.user_id,
      type: notificationData.type || 'info',
      title: notificationData.title?.trim() || '',
      message: notificationData.message?.trim() || '',
      project_id: notificationData.project_id || null,
      activity_id: notificationData.activity_id || null,
      read: false,
      created_date: new Date().toISOString(),
      timestamp: Date.now() // Para ordenamiento más preciso
    };
    
    // Agregar al inicio para las más recientes primero
    notifications.unshift(newNotification);
    
    // Guardar inmediatamente
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    console.log('📢 Notificación creada:', newNotification); // Debug
    
    // ✅ NOTIFICACIÓN INMEDIATA A TRAVÉS DEL MANAGER
    NotificationManager.notify({
      type: 'new_notification',
      notification: newNotification,
      userId: notificationData.user_id
    });
    
    // ✅ DISPARAR EVENTO GLOBAL ADICIONAL (backup)
    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
      detail: { 
        notifications, 
        newNotification,
        action: 'created'
      }
    }));
    
    return newNotification;
  } catch (error) {
    console.error('Error creating real-time notification:', error);
    throw error;
  }
};

// ✅ CORRECCIÓN: Función para crear notificación de asignación sin duplicar
const createAssignmentNotification = async (assignedTo, activity) => {
  try {
    // Verificar si ya existe una notificación similar reciente (en los últimos 2 segundos)
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const recentDuplicate = notifications.find(n => 
      n.user_id === assignedTo && 
      n.activity_id === activity.id && 
      n.type === 'activity_assigned' &&
      Date.now() - n.timestamp < 2000 // Últimos 2 segundos
    );
    
    if (recentDuplicate) {
      console.log('⚠️ Notificación de asignación ya fue creada recientemente, omitiendo...');
      return;
    }
    
    const assignedUser = JSON.parse(localStorage.getItem('users') || '[]')
      .find(u => u.id === assignedTo);
    
    if (assignedUser) {
      await createRealTimeNotification({
        user_id: assignedTo,
        type: 'activity_assigned',
        title: 'Nueva actividad asignada 📋',
        message: `Se te asignó: "${activity.title}"`,
        project_id: activity.project_id,
        activity_id: activity.id,
        timestamp: Date.now() // Asegurar timestamp único
      });
    }
  } catch (error) {
    console.error('Error creating assignment notification:', error);
  }
};

// ✅ CORRECCIÓN: Función para crear actividad con validación de duplicados
const createActivityWithValidation = async (data) => {
  try {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    
    // Verificar si ya existe una actividad idéntica reciente (en los últimos 5 segundos)
    const recentDuplicate = activities.find(a => 
      a.title === data.title?.trim() &&
      a.project_id === data.project_id &&
      a.assigned_to === data.assigned_to &&
      new Date().getTime() - new Date(a.created_date).getTime() < 5000 // Últimos 5 segundos
    );
    
    if (recentDuplicate) {
      console.log('⚠️ Actividad duplicada detectada, omitiendo creación...');
      return recentDuplicate; // Retornar la existente
    }
    
    const newActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: data.title?.trim() || '',
      description: data.description?.trim() || '',
      project_id: data.project_id,
      start_date: formatDateForStorage(data.start_date),
      due_date: formatDateForStorage(data.due_date),
      end_date: formatDateForStorage(data.end_date),
      priority: data.priority || 'medium',
      assigned_to: data.assigned_to || null,
      status: data.assigned_to ? 'assigned' : 'pending',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      completed_date: null,
      completed_by: null,
      completed_by_name: null,
      completed_by_avatar: null,
      tags: data.tags || [],
      estimated_hours: data.estimated_hours || null,
      actual_hours: data.actual_hours || null
    };
    
    activities.push(newActivity);
    localStorage.setItem('activities', JSON.stringify(activities));
    
    // ✅ CORRECCIÓN: Retrasar ligeramente la notificación para evitar conflictos
    if (data.assigned_to) {
      setTimeout(() => {
        createAssignmentNotification(data.assigned_to, newActivity);
      }, 100);
    }
    
    // ✅ DISPARAR EVENTO GLOBAL
    window.dispatchEvent(new CustomEvent('activityCreated', {
      detail: { activity: newActivity }
    }));
    
    return newActivity;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw new Error('No se pudo crear la actividad');
  }
};

// ✅ FUNCIÓN PARA ACTUALIZAR PROGRESO DEL PROYECTO
const updateProjectProgress = async (projectId) => {
  try {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    const projectActivities = activities.filter(a => a.project_id === projectId);
    
    if (projectActivities.length === 0) {
      await localClient.entities.Project.update(projectId, { progress: 0 });
      return;
    }
    
    const completedActivities = projectActivities.filter(a => a.status === 'completed').length;
    const progress = Math.round((completedActivities / projectActivities.length) * 100);
    
    await localClient.entities.Project.update(projectId, { progress });
    
    return progress;
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
};

// ✅ FUNCIÓN PARA COMPLETAR ACTIVIDAD CON NOTIFICACIONES INMEDIATAS Y EVENTO GLOBAL
const completeActivityWithProgressUpdate = async (activityId, completedBy) => {
  try {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    const activityIndex = activities.findIndex(a => a.id === activityId);
    
    if (activityIndex === -1) {
      throw new Error('Actividad no encontrada');
    }
    
    const user = await localClient.auth.me();
    const completedByName = user.full_name || 'Usuario';
    const completedByAvatar = user.avatar_url || '';
    
    const updatedActivity = {
      ...activities[activityIndex],
      status: 'completed',
      completed_date: new Date().toISOString(),
      completed_by: completedBy,
      completed_by_name: completedByName,
      completed_by_avatar: completedByAvatar,
      updated_date: new Date().toISOString()
    };
    
    activities[activityIndex] = updatedActivity;
    localStorage.setItem('activities', JSON.stringify(activities));
    
    // ✅ NOTIFICACIÓN INMEDIATA PARA LÍDERES
    const projectMembers = JSON.parse(localStorage.getItem('projectMembers') || '[]')
      .filter(m => m.project_id === updatedActivity.project_id && m.role === 'leader');
    
    for (const leader of projectMembers) {
      if (leader.user_id !== completedBy) {
        await createRealTimeNotification({
          user_id: leader.user_id,
          type: 'activity_completed',
          title: 'Actividad completada ✅',
          message: `"${updatedActivity.title}" fue completada por ${completedByName}`,
          project_id: updatedActivity.project_id,
          activity_id: activityId
        });
      }
    }
    
    await updateProjectProgress(updatedActivity.project_id);
    
    // ✅ DISPARAR EVENTO GLOBAL
    window.dispatchEvent(new CustomEvent('activityCompleted', {
      detail: { activityId, projectId: updatedActivity.project_id }
    }));
    
    return updatedActivity;
  } catch (error) {
    console.error('Error completing activity:', error);
    throw new Error('No se pudo completar la actividad');
  }
};

// ✅ FUNCIÓN PARA REABRIR ACTIVIDAD CON EVENTO GLOBAL
const reopenActivityWithProgressUpdate = async (activityId) => {
  try {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    const activityIndex = activities.findIndex(a => a.id === activityId);
    
    if (activityIndex === -1) {
      throw new Error('Actividad no encontrada');
    }
    
    activities[activityIndex] = {
      ...activities[activityIndex],
      status: 'in_progress',
      completed_date: null,
      completed_by: null,
      completed_by_name: null,
      completed_by_avatar: null,
      updated_date: new Date().toISOString()
    };
    
    localStorage.setItem('activities', JSON.stringify(activities));
    
    await updateProjectProgress(activities[activityIndex].project_id);
    
    // ✅ DISPARAR EVENTO GLOBAL
    window.dispatchEvent(new CustomEvent('activityReopened', {
      detail: { activityId, projectId: activities[activityIndex].project_id }
    }));
    
    return activities[activityIndex];
  } catch (error) {
    console.error('Error reopening activity:', error);
    throw new Error('No se pudo reabrir la actividad');
  }
};

// ✅ FUNCIONES AUXILIARES MEJORADAS
const handleActivityNotifications = async (activity, previousAssignedTo, previousStatus) => {
  try {
    // Notificación de asignación con protección contra duplicados
    if (activity.assigned_to && activity.assigned_to !== previousAssignedTo) {
      await createAssignmentNotification(activity.assigned_to, activity);
    }
    
    // Notificación de completado para líderes
    if (activity.status === 'completed' && previousStatus !== 'completed') {
      const projectMembers = JSON.parse(localStorage.getItem('projectMembers') || '[]')
        .filter(m => m.project_id === activity.project_id && m.role === 'leader');
      
      for (const leader of projectMembers) {
        if (leader.user_id !== activity.completed_by) {
          await createRealTimeNotification({
            user_id: leader.user_id,
            type: 'activity_completed',
            title: 'Actividad completada ✅',
            message: `"${activity.title}" fue completada por ${activity.completed_by_name}`,
            project_id: activity.project_id,
            activity_id: activity.id
          });
        }
      }
    }
  } catch (error) {
    console.error('Error handling activity notifications:', error);
  }
};

const deleteActivityAttachments = async (activityId) => {
  try {
    const attachments = JSON.parse(localStorage.getItem('attachments') || '[]');
    const filtered = attachments.filter(a => a.activity_id !== activityId);
    localStorage.setItem('attachments', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting activity attachments:', error);
  }
};

// ✅ FUNCIÓN ACTUALIZADA: Crear nuevo usuario SIEMPRE
const createProjectMember = async (data) => {
  try {
    console.log("🚀 CREANDO MIEMBRO CON DATOS:", data);
    
    const members = JSON.parse(localStorage.getItem('projectMembers') || '[]');
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 1. CREAR NUEVO USUARIO SIEMPRE
    const newUserId = `user_${Date.now()}`;
    const newUser = {
      id: newUserId,
      email: data.email,
      full_name: data.full_name,
      avatar_url: '',
      user_role: 'collaborator',
      position: data.position || '',
      department: '',
      phone: '',
      is_active: true,
      created_date: new Date().toISOString()
    };
    
    // Agregar usuario a la lista
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    console.log("✅ Usuario creado:", newUser);
    
    // 2. CREAR MIEMBRO DEL PROYECTO
    const newMember = {
      id: `member_${Date.now()}`,
      project_id: data.project_id,
      user_id: newUserId,
      role: data.role || 'collaborator',
      responsibilities: data.responsibilities || '',
      agreed_delivery_date: data.agreed_delivery_date,
      joined_date: new Date().toISOString(),
      added_by: data.added_by || 'system'
    };
    
    members.push(newMember);
    localStorage.setItem('projectMembers', JSON.stringify(members));
    console.log("✅ Miembro creado:", newMember);
    
    // 3. NOTIFICACIÓN (OPCIONAL)
    try {
      const project = await localClient.entities.Project.get(data.project_id);
      await createRealTimeNotification({
        user_id: newUserId,
        type: 'project_invitation',
        title: 'Invitación a proyecto 🎉',
        message: `Te han agregado al proyecto: "${project?.name || 'Proyecto'}"`,
        project_id: data.project_id
      });
    } catch (notifError) {
      console.log("⚠️ Notificación no enviada, pero miembro creado");
    }
    
    // 4. RETORNAR RESULTADO
    return {
      ...newMember,
      name: data.full_name,
      email: data.email,
      avatar_url: '',
      position: data.position,
      user_role: 'collaborator'
    };
    
  } catch (error) {
    console.error("❌ ERROR CRÍTICO en createProjectMember:", error);
    throw new Error('No se pudo agregar el miembro. Error: ' + error.message);
  }
};

export const localClient = {
  auth: {
    me: async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      const defaultUser = {
        id: '1',
        email: 'usuario@ejemplo.com',
        full_name: 'Usuario Demo',
        user_role: 'leader',
        avatar_url: '',
        position: 'Desarrollador',
        email_notifications: true,
        push_notifications: true
      };
      localStorage.setItem('currentUser', JSON.stringify(defaultUser));
      return defaultUser;
    },
    updateMe: async (data) => {
      const currentUser = await localClient.auth.me();
      const updatedUser = { ...currentUser, ...data };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return updatedUser;
    },
    logout: () => {
      console.log('Logging out...');
      window.location.href = '/login';
    }
  },

  entities: {
    Project: {
      list: async () => {
        try {
          const projects = JSON.parse(localStorage.getItem('projects') || '[]');
          return projects;
        } catch (error) {
          console.error('Error loading projects:', error);
          return [];
        }
      },
      filter: async (filters) => {
        try {
          let projects = JSON.parse(localStorage.getItem('projects') || '[]');
          if (filters.status && filters.status !== 'all') {
            projects = projects.filter(p => p.status === filters.status);
          }
          if (filters.user_id) {
            const members = JSON.parse(localStorage.getItem('projectMembers') || '[]');
            const userProjectIds = members
              .filter(m => m.user_id === filters.user_id)
              .map(m => m.project_id);
            projects = projects.filter(p => userProjectIds.includes(p.id));
          }
          return projects;
        } catch (error) {
          console.error('Error filtering projects:', error);
          return [];
        }
      },
      get: async (id) => {
        try {
          const projects = JSON.parse(localStorage.getItem('projects') || '[]');
          return projects.find(p => p.id === id) || null;
        } catch (error) {
          console.error('Error getting project:', error);
          return null;
        }
      },
      create: async (data) => {
        try {
          const projects = JSON.parse(localStorage.getItem('projects') || '[]');
          
          const newProject = {
            id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: data.name?.trim() || '',
            description: data.description?.trim() || '',
            type: data.type || 'PVB',
            status: data.status || 'active',
            priority: data.priority || 'medium',
            start_date: formatDateForStorage(data.start_date),
            end_date: formatDateForStorage(data.end_date),
            budget: data.budget || null,
            progress: data.progress || 0,
            created_by: data.created_by,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            color: data.color || '#3B82F6',
            expected_activities: data.expected_activities || 0
          };
          
          projects.push(newProject);
          localStorage.setItem('projects', JSON.stringify(projects));
          
          if (data.created_by) {
            await localClient.entities.ProjectMember.create({
              project_id: newProject.id,
              user_id: data.created_by,
              role: 'leader',
              joined_date: new Date().toISOString()
            });
          }
          
          return newProject;
        } catch (error) {
          console.error('Error creating project:', error);
          throw new Error('No se pudo crear el proyecto');
        }
      },
      update: async (id, data) => {
        try {
          const projects = JSON.parse(localStorage.getItem('projects') || '[]');
          const index = projects.findIndex(p => p.id === id);
          
          if (index === -1) {
            throw new Error('Proyecto no encontrado');
          }
          
          projects[index] = {
            ...projects[index],
            ...data,
            color: data.color !== undefined ? data.color : projects[index].color,
            start_date: data.start_date ? formatDateForStorage(data.start_date) : projects[index].start_date,
            end_date: data.end_date ? formatDateForStorage(data.end_date) : projects[index].end_date,
            updated_date: new Date().toISOString()
          };
          
          localStorage.setItem('projects', JSON.stringify(projects));
          return projects[index];
        } catch (error) {
          console.error('Error updating project:', error);
          throw new Error('No se pudo actualizar el proyecto');
        }
      },
      delete: async (id) => {
        try {
          const projects = JSON.parse(localStorage.getItem('projects') || '[]');
          const projectToDelete = projects.find(p => p.id === id);
          
          if (!projectToDelete) {
            throw new Error('Proyecto no encontrado');
          }
          
          const filtered = projects.filter(p => p.id !== id);
          localStorage.setItem('projects', JSON.stringify(filtered));
          
          const activities = JSON.parse(localStorage.getItem('activities') || '[]');
          const filteredActivities = activities.filter(a => a.project_id !== id);
          localStorage.setItem('activities', JSON.stringify(filteredActivities));
          
          const members = JSON.parse(localStorage.getItem('projectMembers') || '[]');
          const filteredMembers = members.filter(m => m.project_id !== id);
          localStorage.setItem('projectMembers', JSON.stringify(filteredMembers));
          
          return { 
            success: true, 
            message: 'Proyecto eliminado correctamente',
            deletedProject: projectToDelete
          };
        } catch (error) {
          console.error('Error deleting project:', error);
          throw new Error('No se pudo eliminar el proyecto');
        }
      },
    },

    Activity: {
      list: async () => {
        try {
          const activities = JSON.parse(localStorage.getItem('activities') || '[]');
          return activities;
        } catch (error) {
          console.error('Error loading activities:', error);
          return [];
        }
      },
      
      filter: async (filters) => {
        try {
          let activities = JSON.parse(localStorage.getItem('activities') || '[]');
          
          if (filters.project_id) {
            activities = activities.filter(a => a.project_id === filters.project_id);
          }
          if (filters.status && filters.status !== 'all') {
            activities = activities.filter(a => a.status === filters.status);
          }
          if (filters.assigned_to) {
            activities = activities.filter(a => a.assigned_to === filters.assigned_to);
          }
          if (filters.priority && filters.priority !== 'all') {
            activities = activities.filter(a => a.priority === filters.priority);
          }
          
          return activities;
        } catch (error) {
          console.error('Error filtering activities:', error);
          return [];
        }
      },
      
      get: async (id) => {
        try {
          const activities = JSON.parse(localStorage.getItem('activities') || '[]');
          return activities.find(a => a.id === id) || null;
        } catch (error) {
          console.error('Error getting activity:', error);
          return null;
        }
      },
      
      create: async (data) => {
        // ✅ USAR LA FUNCIÓN CON VALIDACIÓN DE DUPLICADOS
        return await createActivityWithValidation(data);
      },
      
      update: async (id, data) => {
        try {
          const activities = JSON.parse(localStorage.getItem('activities') || '[]');
          const index = activities.findIndex(a => a.id === id);
          
          if (index === -1) {
            throw new Error('Actividad no encontrada');
          }
          
          const previousAssignedTo = activities[index].assigned_to;
          const previousStatus = activities[index].status;
          
          activities[index] = {
            ...activities[index],
            ...data,
            start_date: data.start_date ? formatDateForStorage(data.start_date) : activities[index].start_date,
            due_date: data.due_date ? formatDateForStorage(data.due_date) : activities[index].due_date,
            end_date: data.end_date ? formatDateForStorage(data.end_date) : activities[index].end_date,
            updated_date: new Date().toISOString()
          };
          
          localStorage.setItem('activities', JSON.stringify(activities));
          
          await handleActivityNotifications(
            activities[index], 
            previousAssignedTo, 
            previousStatus
          );

          if (data.status && data.status !== previousStatus) {
            await updateProjectProgress(activities[index].project_id);
          }
          
          return activities[index];
        } catch (error) {
          console.error('Error updating activity:', error);
          throw new Error('No se pudo actualizar la actividad');
        }
      },
      
      delete: async (id) => {
        try {
          const activities = JSON.parse(localStorage.getItem('activities') || '[]');
          const activityToDelete = activities.find(a => a.id === id);
          
          if (!activityToDelete) {
            throw new Error('Actividad no encontrada');
          }
          
          const projectId = activityToDelete.project_id;
          const filtered = activities.filter(a => a.id !== id);
          localStorage.setItem('activities', JSON.stringify(filtered));
          
          await deleteActivityAttachments(id);
          await updateProjectProgress(projectId);
          
          return { 
            success: true, 
            message: 'Actividad eliminada correctamente',
            deletedActivity: activityToDelete
          };
        } catch (error) {
          console.error('Error deleting activity:', error);
          throw new Error('No se pudo eliminar la actividad');
        }
      },

      completeWithProgressUpdate: completeActivityWithProgressUpdate,
      reopenWithProgressUpdate: reopenActivityWithProgressUpdate
    },

    ProjectMember: {
      list: async () => {
        try {
          const members = JSON.parse(localStorage.getItem('projectMembers') || '[]');
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          return members.map(member => {
            const user = users.find(u => u.id === member.user_id);
            return {
              ...member,
              name: user?.full_name || 'Usuario no encontrado',
              email: user?.email || '',
              avatar_url: user?.avatar_url || '',
              position: user?.position || '',
              user_role: user?.user_role || 'collaborator'
            };
          });
        } catch (error) {
          console.error('Error loading project members:', error);
          return [];
        }
      },
      
      filter: async (filters) => {
        try {
          let members = JSON.parse(localStorage.getItem('projectMembers') || '[]');
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          
          if (filters.project_id) {
            members = members.filter(m => m.project_id === filters.project_id);
          }
          if (filters.user_id) {
            members = members.filter(m => m.user_id === filters.user_id);
          }
          if (filters.role && filters.role !== 'all') {
            members = members.filter(m => m.role === filters.role);
          }
          
          return members.map(member => {
            const user = users.find(u => u.id === member.user_id);
            return {
              ...member,
              name: user?.full_name || 'Usuario no encontrado',
              email: user?.email || '',
              avatar_url: user?.avatar_url || '',
              position: user?.position || '',
              user_role: user?.user_role || 'collaborator'
            };
          });
        } catch (error) {
          console.error('Error filtering project members:', error);
          return [];
        }
      },
      
      get: async (id) => {
        try {
          const members = JSON.parse(localStorage.getItem('projectMembers') || '[]');
          const member = members.find(m => m.id === id);
          if (!member) return null;
          
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const user = users.find(u => u.id === member.user_id);
          
          return {
            ...member,
            name: user?.full_name || 'Usuario no encontrado',
            email: user?.email || '',
            avatar_url: user?.avatar_url || '',
            position: user?.position || '',
            user_role: user?.user_role || 'collaborator'
          };
        } catch (error) {
          console.error('Error getting project member:', error);
          return null;
        }
      },
      
      create: createProjectMember, // ✅ USANDO LA FUNCIÓN ACTUALIZADA
      
      update: async (id, data) => {
        try {
          const members = JSON.parse(localStorage.getItem('projectMembers') || '[]');
          const index = members.findIndex(m => m.id === id);
          
          if (index === -1) {
            throw new Error('Miembro no encontrado');
          }
          
          const allowedFields = ['role', 'responsibilities', 'agreed_delivery_date'];
          const updateData = {};
          
          Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) {
              updateData[key] = data[key];
            }
          });
          
          if (updateData.agreed_delivery_date) {
            updateData.agreed_delivery_date = formatDateForStorage(updateData.agreed_delivery_date);
          }
          
          members[index] = { 
            ...members[index], 
            ...updateData 
          };
          
          localStorage.setItem('projectMembers', JSON.stringify(members));
          
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const user = users.find(u => u.id === members[index].user_id);
          
          return {
            ...members[index],
            name: user?.full_name || 'Usuario no encontrado',
            email: user?.email || '',
            avatar_url: user?.avatar_url || '',
            position: user?.position || '',
            user_role: user?.user_role || 'collaborator'
          };
        } catch (error) {
          console.error('Error updating project member:', error);
          throw new Error('No se pudo actualizar el miembro');
        }
      },
      
      delete: async (id) => {
        try {
          const members = JSON.parse(localStorage.getItem('projectMembers') || '[]');
          const memberToDelete = members.find(m => m.id === id);
          
          if (!memberToDelete) {
            throw new Error('Miembro no encontrado');
          }
          
          if (memberToDelete.role === 'leader') {
            throw new Error('No se puede eliminar al líder del proyecto');
          }
          
          const filtered = members.filter(m => m.id !== id);
          localStorage.setItem('projectMembers', JSON.stringify(filtered));
          
          return { 
            success: true, 
            message: 'Miembro eliminado correctamente',
            deletedMember: memberToDelete
          };
        } catch (error) {
          console.error('Error deleting project member:', error);
          throw new Error(error.message || 'No se pudo eliminar el miembro');
        }
      }
    },

    Notification: {
      list: async () => {
        try {
          const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
          // Ordenar por timestamp (más recientes primero)
          return notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } catch (error) {
          console.error('Error loading notifications:', error);
          return [];
        }
      },
      
      filter: async (filters) => {
        try {
          let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
          if (filters.user_id) {
            notifications = notifications.filter(n => n.user_id === filters.user_id);
          }
          if (filters.read !== undefined) {
            notifications = notifications.filter(n => n.read === filters.read);
          }
          if (filters.type && filters.type !== 'all') {
            notifications = notifications.filter(n => n.type === filters.type);
          }
          // Ordenar por timestamp (más recientes primero)
          return notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } catch (error) {
          console.error('Error filtering notifications:', error);
          return [];
        }
      },
      
      get: async (id) => {
        try {
          const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
          return notifications.find(n => n.id === id) || null;
        } catch (error) {
          console.error('Error getting notification:', error);
          return null;
        }
      },
      
      create: async (data) => {
        try {
          return await createRealTimeNotification(data);
        } catch (error) {
          console.error('Error creating notification:', error);
          throw new Error('No se pudo crear la notificación');
        }
      },
      
      update: async (id, data) => {
        try {
          const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
          const index = notifications.findIndex(n => n.id === id);
          
          if (index === -1) {
            throw new Error('Notificación no encontrada');
          }
          
          notifications[index] = { 
            ...notifications[index], 
            ...data 
          };
          localStorage.setItem('notifications', JSON.stringify(notifications));
          
          // ✅ NOTIFICAR ACTUALIZACIÓN
          NotificationManager.notify({
            type: 'notification_updated',
            notification: notifications[index],
            userId: notifications[index].user_id
          });
          
          return notifications[index];
        } catch (error) {
          console.error('Error updating notification:', error);
          throw new Error('No se pudo actualizar la notificación');
        }
      },
      
      delete: async (id) => {
        try {
          const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
          const notificationToDelete = notifications.find(n => n.id === id);
          
          if (!notificationToDelete) {
            throw new Error('Notificación no encontrada');
          }
          
          const filtered = notifications.filter(n => n.id !== id);
          localStorage.setItem('notifications', JSON.stringify(filtered));
          
          // ✅ NOTIFICAR ELIMINACIÓN
          NotificationManager.notify({
            type: 'notification_deleted',
            notificationId: id,
            userId: notificationToDelete.user_id
          });
          
          return { 
            success: true, 
            message: 'Notificación eliminada correctamente',
            deletedNotification: notificationToDelete
          };
        } catch (error) {
          console.error('Error deleting notification:', error);
          throw new Error('No se pudo eliminar la notificación');
        }
      },
      
      markAllAsRead: async (userId) => {
        try {
          const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
          const updatedNotifications = notifications.map(n => 
            n.user_id === userId ? { ...n, read: true } : n
          );
          localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
          
          // ✅ NOTIFICAR ACTUALIZACIÓN MASIVA
          NotificationManager.notify({
            type: 'all_notifications_read',
            userId: userId
          });
          
          return { success: true, message: 'Todas las notificaciones marcadas como leídas' };
        } catch (error) {
          console.error('Error marking notifications as read:', error);
          throw new Error('No se pudieron marcar las notificaciones como leídas');
        }
      },
      
      // ✅ NUEVA FUNCIÓN: Obtener notificaciones no leídas en tiempo real
      getUnreadCount: async (userId) => {
        try {
          const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
          const unread = notifications.filter(n => n.user_id === userId && !n.read);
          return unread.length;
        } catch (error) {
          console.error('Error getting unread count:', error);
          return 0;
        }
      },
      
      // ✅ NUEVA FUNCIÓN: Forzar actualización
      forceRefresh: (userId) => {
        NotificationManager.forceRefresh(userId);
      }
    },

    Attachment: {
      list: async () => {
        try {
          const attachments = JSON.parse(localStorage.getItem('attachments') || '[]');
          return attachments;
        } catch (error) {
          console.error('Error loading attachments:', error);
          return [];
        }
      },
      filter: async (filters) => {
        try {
          let attachments = JSON.parse(localStorage.getItem('attachments') || '[]');
          if (filters.activity_id) {
            attachments = attachments.filter(a => a.activity_id === filters.activity_id);
          }
          if (filters.project_id) {
            attachments = attachments.filter(a => a.project_id === filters.project_id);
          }
          return attachments;
        } catch (error) {
          console.error('Error filtering attachments:', error);
          return [];
        }
      },
      get: async (id) => {
        try {
          const attachments = JSON.parse(localStorage.getItem('attachments') || '[]');
          return attachments.find(a => a.id === id) || null;
        } catch (error) {
          console.error('Error getting attachment:', error);
          return null;
        }
      },
      create: async (data) => {
        try {
          const attachments = JSON.parse(localStorage.getItem('attachments') || '[]');
          
          const newAttachment = {
            id: `attach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file_name: data.file_name,
            file_url: data.file_url,
            file_size: data.file_size,
            file_type: data.file_type,
            activity_id: data.activity_id,
            project_id: data.project_id,
            uploaded_by: data.uploaded_by,
            uploaded_date: new Date().toISOString()
          };
          
          attachments.push(newAttachment);
          localStorage.setItem('attachments', JSON.stringify(attachments));
          return newAttachment;
        } catch (error) {
          console.error('Error creating attachment:', error);
          throw new Error('No se pudo subir el archivo');
        }
      },
      delete: async (id) => {
        try {
          const attachments = JSON.parse(localStorage.getItem('attachments') || '[]');
          const attachmentToDelete = attachments.find(a => a.id === id);
          
          if (!attachmentToDelete) {
            throw new Error('Archivo no encontrado');
          }
          
          const filtered = attachments.filter(a => a.id !== id);
          localStorage.setItem('attachments', JSON.stringify(filtered));
          
          return { 
            success: true, 
            message: 'Archivo eliminada correctamente',
            deletedAttachment: attachmentToDelete
          };
        } catch (error) {
          console.error('Error deleting attachment:', error);
          throw new Error('No se pudo eliminar el archivo');
        }
      }
    },

    User: {
      list: async () => {
        try {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          if (users.length === 0) {
            const defaultUsers = [
              {
                id: '1',
                email: 'usuario@ejemplo.com',
                full_name: 'Usuario Demo',
                avatar_url: '',
                user_role: 'leader',
                position: 'Desarrollador',
                department: 'Tecnología',
                phone: '',
                is_active: true,
                created_date: new Date().toISOString()
              },
              {
                id: '2', 
                email: 'colaborador@ejemplo.com',
                full_name: 'Colaborador Demo',
                avatar_url: '',
                user_role: 'collaborator',
                position: 'Diseñador',
                department: 'Diseño',
                phone: '',
                is_active: true,
                created_date: new Date().toISOString()
              }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            return defaultUsers;
          }
          return users;
        } catch (error) {
          console.error('Error loading users:', error);
          return [];
        }
      },
      filter: async (filters) => {
        try {
          let users = JSON.parse(localStorage.getItem('users') || '[]');
          if (filters.user_role && filters.user_role !== 'all') {
            users = users.filter(u => u.user_role === filters.user_role);
          }
          if (filters.is_active !== undefined) {
            users = users.filter(u => u.is_active === filters.is_active);
          }
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            users = users.filter(u => 
              u.full_name.toLowerCase().includes(searchTerm) ||
              u.email.toLowerCase().includes(searchTerm) ||
              u.position.toLowerCase().includes(searchTerm)
            );
          }
          return users;
        } catch (error) {
          console.error('Error filtering users:', error);
          return [];
        }
      },
      get: async (id) => {
        try {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          return users.find(u => u.id === id) || null;
        } catch (error) {
          console.error('Error getting user:', error);
          return null;
        }
      },
      create: async (data) => {
        try {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          
          const existingUser = users.find(u => u.email === data.email);
          if (existingUser) {
            throw new Error('Ya existe un usuario con este email');
          }
          
          const newUser = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: data.email,
            full_name: data.full_name?.trim() || '',
            avatar_url: data.avatar_url || '',
            user_role: data.user_role || 'collaborator',
            position: data.position || '',
            department: data.department || '',
            phone: data.phone || '',
            is_active: true,
            created_date: new Date().toISOString()
          };
          
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));
          return newUser;
        } catch (error) {
          console.error('Error creating user:', error);
          throw new Error(error.message || 'No se pudo crear el usuario');
        }
      },
      update: async (id, data) => {
        try {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const index = users.findIndex(u => u.id === id);
          
          if (index === -1) {
            throw new Error('Usuario no encontrado');
          }
          
          users[index] = { 
            ...users[index], 
            ...data 
          };
          localStorage.setItem('users', JSON.stringify(users));
          return users[index];
        } catch (error) {
          console.error('Error updating user:', error);
          throw new Error('No se pudo actualizar el usuario');
        }
      }
    }
  },

  integrations: {
    Core: {
      UploadFile: ({ file }) => {
        return Promise.resolve({
          file_url: URL.createObjectURL(file),
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        });
      }
    }
  },

  // ✅ EXPORTAR EL MANAGER PARA USO EN COMPONENTES
  notificationManager: NotificationManager,

  refreshData: async () => {
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const activities = JSON.parse(localStorage.getItem('activities') || '[]');
      const members = JSON.parse(localStorage.getItem('projectMembers') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const attachments = JSON.parse(localStorage.getItem('attachments') || '[]');
      
      return {
        projects,
        activities, 
        members,
        users,
        notifications,
        attachments
      };
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw new Error('No se pudieron refrescar los datos');
    }
  },

  initializeSampleData: async () => {
    try {
      const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      if (existingProjects.length > 0) {
        return { success: true, message: 'Los datos ya están inicializados' };
      }

      const sampleUsers = [
        {
          id: '1',
          email: 'lider@empresa.com',
          full_name: 'Ana García López',
          avatar_url: '',
          user_role: 'leader',
          position: 'Project Manager',
          department: 'Gestión de Proyectos',
          phone: '+34 612 345 678',
          is_active: true,
          created_date: new Date().toISOString()
        },
        {
          id: '2',
          email: 'desarrollador@empresa.com',
          full_name: 'Carlos Rodríguez Martín',
          avatar_url: '',
          user_role: 'collaborator',
          position: 'Desarrollador Full Stack',
          department: 'Tecnología',
          phone: '+34 623 456 789',
          is_active: true,
          created_date: new Date().toISOString()
        },
        {
          id: '3',
          email: 'disenador@empresa.com',
          full_name: 'María Fernández Soler',
          avatar_url: '',
          user_role: 'collaborator',
          position: 'Diseñadora UX/UI',
          department: 'Diseño',
          phone: '+34 634 567 890',
          is_active: true,
          created_date: new Date().toISOString()
        }
      ];
      localStorage.setItem('users', JSON.stringify(sampleUsers));
      localStorage.setItem('currentUser', JSON.stringify(sampleUsers[0]));

      const sampleProjects = [
        {
          id: 'proj_1',
          name: 'Sistema de Gestión de Proyectos',
          description: 'Desarrollo de una plataforma web para la gestión eficiente de proyectos y equipos.',
          type: 'PVB',
          status: 'active',
          priority: 'high',
          start_date: '2024-01-15',
          end_date: '2024-06-30',
          budget: 50000,
          progress: 65,
          created_by: '1',
          created_date: new Date('2024-01-15').toISOString(),
          updated_date: new Date().toISOString(),
          color: '#3B82F6',
          expected_activities: 10
        },
        {
          id: 'proj_2',
          name: 'App Móvil de Tareas',
          description: 'Creación de una aplicación móvil para gestión de tareas personales y profesionales.',
          type: 'PVMS',
          status: 'active',
          priority: 'medium',
          start_date: '2024-02-01',
          end_date: '2024-05-15',
          budget: 25000,
          progress: 30,
          created_by: '1',
          created_date: new Date('2024-02-01').toISOString(),
          updated_date: new Date().toISOString(),
          color: '#10B981',
          expected_activities: 8
        }
      ];
      localStorage.setItem('projects', JSON.stringify(sampleProjects));

      const sampleMembers = [
        {
          id: 'member_1',
          project_id: 'proj_1',
          user_id: '1',
          role: 'leader',
          responsibilities: 'Gestión general del proyecto y coordinación del equipo',
          agreed_delivery_date: '2024-06-30',
          joined_date: new Date('2024-01-15').toISOString(),
          added_by: '1'
        },
        {
          id: 'member_2',
          project_id: 'proj_1',
          user_id: '2',
          role: 'collaborator',
          responsibilities: 'Desarrollo frontend y backend de la aplicación',
          agreed_delivery_date: '2024-06-15',
          joined_date: new Date('2024-01-20').toISOString(),
          added_by: '1'
        },
        {
          id: 'member_3',
          project_id: 'proj_1',
          user_id: '3',
          role: 'collaborator',
          responsibilities: 'Diseño de interfaces y experiencia de usuario',
          agreed_delivery_date: '2024-05-30',
          joined_date: new Date('2024-01-25').toISOString(),
          added_by: '1'
        }
      ];
      localStorage.setItem('projectMembers', JSON.stringify(sampleMembers));

      const sampleActivities = [
        {
          id: 'act_1',
          title: 'Diseñar interfaz de usuario',
          description: 'Crear wireframes y mockups para las principales pantallas del sistema.',
          project_id: 'proj_1',
          start_date: '2024-01-20',
          due_date: '2024-01-25',
          end_date: '2024-03-15',
          priority: 'high',
          assigned_to: '3',
          status: 'in_progress',
          created_date: new Date('2024-01-20').toISOString(),
          updated_date: new Date().toISOString(),
          completed_date: null,
          completed_by: null,
          completed_by_name: null,
          completed_by_avatar: null,
          tags: ['design', 'ui', 'ux'],
          estimated_hours: 40,
          actual_hours: 25
        },
        {
          id: 'act_2',
          title: 'Desarrollar módulo de autenticación',
          description: 'Implementar sistema de login, registro y recuperación de contraseñas.',
          project_id: 'proj_1',
          start_date: '2024-01-18',
          due_date: '2024-01-22',
          end_date: '2024-02-28',
          priority: 'high',
          assigned_to: '2',
          status: 'completed',
          created_date: new Date('2024-01-18').toISOString(),
          updated_date: new Date('2024-02-25').toISOString(),
          completed_date: new Date('2024-02-25').toISOString(),
          completed_by: '2',
          completed_by_name: 'Carlos Rodríguez Martín',
          completed_by_avatar: '',
          tags: ['development', 'auth', 'security'],
          estimated_hours: 35,
          actual_hours: 32
        }
      ];
      localStorage.setItem('activities', JSON.stringify(sampleActivities));

      return { 
        success: true, 
        message: 'Datos de ejemplo inicializados correctamente',
        data: {
          users: sampleUsers.length,
          projects: sampleProjects.length,
          activities: sampleActivities.length
        }
      };
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw new Error('No se pudieron inicializar los datos de ejemplo');
    }
  },

  clearAllData: async () => {
    try {
      localStorage.removeItem('projects');
      localStorage.removeItem('activities');
      localStorage.removeItem('projectMembers');
      localStorage.removeItem('users');
      localStorage.removeItem('notifications');
      localStorage.removeItem('attachments');
      localStorage.removeItem('currentUser');
      
      return { success: true, message: 'Todos los datos han sido eliminados' };
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('No se pudieron eliminar los datos');
    }
  }
};