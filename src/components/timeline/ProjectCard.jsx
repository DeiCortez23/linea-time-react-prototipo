import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, CheckCircle2, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  planning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  on_hold: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const statusLabels = {
  planning: "Planificación",
  in_progress: "En Progreso",
  completed: "Completado",
  on_hold: "En Pausa",
  cancelled: "Cancelado"
};

export default function ProjectCard({ project, members = [], activities = [] }) {
  const daysRemaining = project.end_date 
    ? differenceInDays(new Date(project.end_date), new Date())
    : null;

  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const totalActivities = activities.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 cursor-pointer group">
          <div 
            className="h-2" 
            style={{ backgroundColor: project.color || '#3B82F6' }}
          />
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              <Badge className={`${statusColors[project.status]} border font-medium`}>
                {statusLabels[project.status]}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description || "Sin descripción"}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Progreso</span>
                <span className="font-bold text-blue-600">{project.progress || 0}%</span>
              </div>
              <Progress value={project.progress || 0} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {project.end_date 
                    ? format(new Date(project.end_date), "d MMM", { locale: es })
                    : "Sin fecha"}
                </span>
              </div>
              {daysRemaining !== null && daysRemaining >= 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{daysRemaining} días</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>{completedActivities}/{totalActivities} tareas</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{members.length} miembros</span>
              </div>
            </div>

            {members.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-xs text-gray-500 font-medium">Equipo:</span>
                <div className="flex -space-x-2">
                  {members.slice(0, 4).map((member, idx) => (
                    <Avatar key={idx} className="w-7 h-7 border-2 border-white">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                        {member.full_name?.[0] || member.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-600">
                        +{members.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}