import React, { useState, useMemo } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Calendar, Users, CheckCircle2, Clock, TrendingUp, FolderKanban, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import TimelineView from "@/components/timeline/TimelineView";
import CreateProjectDialog from "@/components/timeline/CreateProjectDialog";
import EditProjectDialog from "@/components/timeline/EditProjectDialog";
import TimelineFilters from "@/components/timeline/TimelineFilters";
import EmptyState from "@/components/timeline/EmptyState";
import LoadingState from "@/components/timeline/LoadingState";
import ErrorState from "@/components/timeline/ErrorState";
import TimelineHeader from "@/components/timeline/TimelineHeader";

// Hook para filtros
const useTimelineFilters = () => {
  const [filters, setFilters] = useState({
    busqueda: "",
    tipo: "todos",
    ordenar: "fecha_inicio"
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      busqueda: "",
      tipo: "todos",
      ordenar: "fecha_inicio"
    });
  };

  return {
    filters,
    handleFilterChange,
    handleClearFilters
  };
};

// Hook para datos
const useTimelineData = () => {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => localClient.auth.me(),
    staleTime: Infinity,
  });

  const { 
    data: projects = [], 
    isLoading: loadingProjects,
    error: projectsError 
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => localClient.entities.Project.list(),
  });

  const { data: allActivities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => localClient.entities.Activity.list(),
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ['project-members'],
    queryFn: () => localClient.entities.ProjectMember.list(),
  });

  return {
    user,
    loadingUser,
    projects,
    loadingProjects,
    projectsError,
    allActivities,
    allMembers
  };
};

// Hook para mutaciones
const useProjectMutations = (user) => {
  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: (projectData) => localClient.entities.Project.create(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId) => localClient.entities.Project.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['project-members'] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    createProjectMutation,
    deleteProjectMutation,
    updateProjectMutation
  };
};

// Tipos de proyecto
const projectTypes = [
  { value: "todos", label: "Todos los tipos" },
  { value: "PVB", label: "PVB" },
  { value: "PVMS", label: "PVMS" },
  { value: "AB", label: "AB" },
  { value: "AMS", label: "AMS" },
  { value: "HA", label: "HA" },
  { value: "PH", label: "PH" },
];

// Función para obtener colores del proyecto
const getProjectColors = (project) => {
  if (!project || !project.color) {
    return {
      gradient: 'linear-gradient(to right, #4c0519, #7d1128)',
      from: '#4c0519',
      to: '#7d1128',
      solid: '#4c0519'
    };
  }
  
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
  
  const mainColor = project.color;
  return {
    gradient: `linear-gradient(to right, ${mainColor}, ${mainColor})`,
    from: mainColor,
    to: mainColor,
    solid: mainColor
  };
};

// Componente para mostrar estadísticas generales
const GeneralDashboard = ({ projects, allActivities, allMembers }) => {
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalActivities = allActivities.length;
    const completedActivities = allActivities.filter(a => a.status === 'completed').length;
    const totalMembers = allMembers.length;
    
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    const overallProgress = totalActivities > 0 
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

    // Proyectos por tipo - AHORA CON NOMBRES COMPLETOS
    const projectsByType = projects.reduce((acc, project) => {
      const type = project.type;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          projects: []
        };
      }
      acc[type].count += 1;
      acc[type].projects.push({
        name: project.name,
        progress: project.progress || 0
      });
      return acc;
    }, {});

    return {
      totalProjects,
      totalActivities,
      completedActivities,
      totalMembers,
      activeProjects,
      completedProjects,
      overallProgress,
      projectsByType
    };
  }, [projects, allActivities, allMembers]);

  return (
    <div className="space-y-6">
      {/* Estadísticas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <FolderKanban className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{stats.totalProjects}</p>
            <p className="text-sm text-blue-600 font-medium">Total Proyectos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">{stats.activeProjects}</p>
            <p className="text-sm text-green-600 font-medium">Proyectos Activos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">{stats.totalActivities}</p>
            <p className="text-sm text-purple-600 font-medium">Total Actividades</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700">{stats.totalMembers}</p>
            <p className="text-sm text-orange-600 font-medium">Miembros</p>
          </CardContent>
        </Card>
      </div>

      {/* Progreso General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progreso General de Todos los Proyectos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {stats.completedActivities} de {stats.totalActivities} actividades completadas
            </span>
            <span className="text-lg font-bold text-blue-600">{stats.overallProgress}%</span>
          </div>
          <Progress value={stats.overallProgress} className="h-3" />
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="font-semibold text-green-600">{stats.completedProjects}</p>
              <p className="text-gray-600">Proyectos Completados</p>
            </div>
            <div>
              <p className="font-semibold text-blue-600">{stats.activeProjects}</p>
              <p className="text-gray-600">En Progreso</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">
                {stats.totalProjects - stats.activeProjects - stats.completedProjects}
              </p>
              <p className="text-gray-600">En Planificación</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ CORREGIDO: Proyectos por Tipo USICAMM - AHORA CON NOMBRES COMPLETOS */}
      <Card>
        <CardHeader>
          <CardTitle>Proyectos por Tipo USICAMM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(stats.projectsByType).map(([type, data]) => (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-800">{type}</h3>
                  <Badge variant="outline" className="text-sm">
                    {data.count} proyecto{data.count !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {data.projects.map((project, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium text-gray-800">{project.name}</span>
                      <span className="text-sm font-semibold text-blue-600">{project.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para mostrar proyectos en vista de iconos
const ProjectsGridView = ({ projects, allActivities, allMembers, onSelectProject, currentUser, onEditProject, onDeleteProject }) => {
  const getProjectStats = (project) => {
    const projectActivities = allActivities.filter(a => a.project_id === project.id);
    const projectMembers = allMembers.filter(m => m.project_id === project.id);
    const completedActivities = projectActivities.filter(a => a.status === 'completed').length;
    const totalActivities = projectActivities.length;
    
    return {
      activities: totalActivities,
      completed: completedActivities,
      members: projectMembers.length,
      progress: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0
    };
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    try {
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const end = new Date(endDate);
      const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      const diffTime = endUTC - todayUTC;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => {
        const stats = getProjectStats(project);
        const daysRemaining = getDaysRemaining(project.end_date);
        const projectColors = getProjectColors(project);
        const isCurrentUserLeader = currentUser?.user_role === 'leader';

        return (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
            onClick={() => onSelectProject(project)}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-2">
              {/* Header con color del proyecto */}
              <div 
                className="h-3 rounded-t-lg" 
                style={{ background: projectColors.gradient }}
              />
              
              <CardContent className="p-4">
                {/* Icono y nombre del proyecto */}
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: projectColors.gradient }}
                  >
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-bold text-lg truncate"
                      style={{ color: projectColors.solid }}
                    >
                      {project.name}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className="text-xs mt-1"
                      style={{ 
                        borderColor: projectColors.solid,
                        color: projectColors.solid
                      }}
                    >
                      {project.type}
                    </Badge>
                  </div>

                  {/* ✅ RESTAURADO: Botones de editar y eliminar */}
                  {isCurrentUserLeader && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProject(project);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Descripción */}
                {project.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}

                {/* Progreso */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Progreso</span>
                    <span className="font-bold" style={{ color: projectColors.solid }}>
                      {stats.progress}%
                    </span>
                  </div>
                  <Progress value={stats.progress} className="h-2" />
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-blue-50 rounded p-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 mx-auto mb-1" />
                    <p className="font-semibold text-blue-700">{stats.completed}</p>
                    <p className="text-blue-600">Hechas</p>
                  </div>
                  <div className="bg-gray-50 rounded p-1">
                    <Users className="w-3 h-3 text-gray-600 mx-auto mb-1" />
                    <p className="font-semibold text-gray-700">{stats.members}</p>
                    <p className="text-gray-600">Miembros</p>
                  </div>
                  <div className="bg-amber-50 rounded p-1">
                    <Clock className="w-3 h-3 text-amber-600 mx-auto mb-1" />
                    <p className="font-semibold text-amber-700">
                      {daysRemaining !== null && daysRemaining >= 0 ? daysRemaining : '-'}
                    </p>
                    <p className="text-amber-600">Días</p>
                  </div>
                </div>

                {/* Fechas */}
                <div className="text-xs text-gray-500 space-y-1">
                  {project.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Inicio: {format(new Date(project.start_date), "d MMM", { locale: es })}</span>
                    </div>
                  )}
                  {project.end_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Fin: {format(new Date(project.end_date), "d MMM", { locale: es })}</span>
                    </div>
                  )}
                </div>

                {/* ❌ ELIMINADO: Estado del proyecto (como solicitaste) */}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

// Componente principal Timeline
export default function Timeline() {
  const { filters, handleFilterChange, handleClearFilters } = useTimelineFilters();
  const { user, loadingUser, projects, loadingProjects, projectsError, allActivities, allMembers } = useTimelineData();
  const { createProjectMutation, deleteProjectMutation, updateProjectMutation } = useProjectMutations(user);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'grid' | 'detail'

  // Filtrar y ordenar proyectos
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filtro por búsqueda (nombre)
    if (filters.busqueda) {
      const searchLower = filters.busqueda.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tipo de proyecto
    if (filters.tipo !== "todos") {
      filtered = filtered.filter(project => project.type === filters.tipo);
    }

    // Ordenar
    filtered = [...filtered].sort((a, b) => {
      switch (filters.ordenar) {
        case "fecha_creacion":
          return new Date(b.created_date) - new Date(a.created_date);
        case "fecha_inicio":
          return new Date(a.start_date) - new Date(b.start_date);
        case "fecha_fin":
          const fechaA = a.end_date ? new Date(a.end_date) : new Date('9999-12-31');
          const fechaB = b.end_date ? new Date(b.end_date) : new Date('9999-12-31');
          return fechaA - fechaB;
        case "progreso":
          return (b.progress || 0) - (a.progress || 0);
        case "nombre":
          return a.name.localeCompare(b.name);
        default:
          return new Date(a.start_date) - new Date(b.start_date);
      }
    });

    return filtered;
  }, [projects, filters]);

  const isUserLeader = user?.user_role === 'leader';
  const hasActiveFilters = filters.busqueda || filters.tipo !== "todos";

  // Manejar la creación de proyectos
  const handleCreateProject = async (projectData) => {
    try {
      await createProjectMutation.mutateAsync(projectData);
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error al crear proyecto:", error);
    }
  };

  // Manejar la eliminación de proyectos
  const handleDeleteProject = async (projectId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      try {
        await deleteProjectMutation.mutateAsync(projectId);
        // Si estamos viendo el proyecto detallado y lo eliminamos, volver a la vista grid
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(null);
          setViewMode('grid');
        }
      } catch (error) {
        console.error("Error al eliminar proyecto:", error);
      }
    }
  };

  // Manejar la edición de proyectos
  const handleEditProject = async (project) => {
    setEditingProject(project);
  };

  // ✅ CORREGIDO: Manejar la actualización de proyectos - ACTUALIZAR selectedProject
  const handleUpdateProject = async (data) => {
    if (editingProject) {
      try {
        const updatedProject = await updateProjectMutation.mutateAsync({
          id: editingProject.id,
          data: data
        });
        setEditingProject(null);
        
        // ✅ ACTUALIZAR EL PROYECTO SELECCIONADO SI ESTÁ SIENDO EDITADO
        if (selectedProject && selectedProject.id === editingProject.id) {
          setSelectedProject(updatedProject);
        }
      } catch (error) {
        console.error("Error al actualizar proyecto:", error);
      }
    }
  };

  // Manejar la selección de un proyecto para ver detalle
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setViewMode('detail');
  };

  // Volver al dashboard/grid
  const handleBackToOverview = () => {
    setSelectedProject(null);
    setViewMode('grid');
  };

  // Estados de carga y error
  if (loadingUser || loadingProjects) {
    return <LoadingState />;
  }

  if (projectsError) {
    return <ErrorState />;
  }

  // Vista detallada de un proyecto
  if (viewMode === 'detail' && selectedProject) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={handleBackToOverview}
              className="flex items-center gap-2"
            >
              ← Volver a todos los proyectos
            </Button>
            <h1 className="text-2xl font-bold" style={{ color: getProjectColors(selectedProject).solid }}>
              {selectedProject.name}
            </h1>
          </div>
          
          <TimelineView
            project={selectedProject}
            allActivities={allActivities}
            allMembers={allMembers}
            currentUser={user}
            onDeleteProject={handleDeleteProject}
            onEditProject={handleEditProject}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <TimelineHeader
          projectCount={filteredProjects.length}
          isUserLeader={isUserLeader}
          onCreateProject={() => setShowCreateDialog(true)}
          isCreating={createProjectMutation.isPending}
        />

        {/* Selector de vista */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewMode === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setViewMode('dashboard')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Dashboard General
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-2"
          >
            <FolderKanban className="w-4 h-4" />
            Vista de Proyectos ({filteredProjects.length})
          </Button>
        </div>

        <TimelineFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          projectTypes={projectTypes}
        />

        {filteredProjects.length === 0 ? (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            isUserLeader={isUserLeader}
            onCreateProject={() => setShowCreateDialog(true)}
            onClearFilters={handleClearFilters}
          />
        ) : viewMode === 'dashboard' ? (
          <GeneralDashboard
            projects={filteredProjects}
            allActivities={allActivities}
            allMembers={allMembers}
          />
        ) : (
          <ProjectsGridView
            projects={filteredProjects}
            allActivities={allActivities}
            allMembers={allMembers}
            onSelectProject={handleSelectProject}
            currentUser={user}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateProject}
          currentUser={user}
          projectTypes={projectTypes.filter(type => type.value !== "todos")}
        />

        <EditProjectDialog
          open={!!editingProject}
          onOpenChange={(open) => {
            if (!open) setEditingProject(null);
          }}
          onSubmit={handleUpdateProject}
          currentUser={user}
          project={editingProject}
          isLoading={updateProjectMutation.isPending}
          projectTypes={projectTypes.filter(type => type.value !== "todos")}
        />
      </div>
    </div>
  );
}