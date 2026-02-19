// 📦 src/components/project/TeamManagement.jsx (Actualizado para mostrar fecha pactada)
import React, { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Crown, Trash2, Edit, Mail, Briefcase, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TeamManagement({
  members = [],
  project,
  currentUser,
  onAddMember,
  onEditMember,
  onRemoveMember
}) {
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ NUEVO: Función para formatear fecha
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "No especificada";
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Cargar todos los usuarios
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const users = await localClient.entities.User.list();
        setAllUsers(users);
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const isCurrentUserLeader = currentUser?.user_role === 'leader';

  // Verificar si el usuario actual es el líder del proyecto
  const isProjectLeader = (member) => {
    return member.role === 'leader';
  };

  // Verificar permisos para gestionar miembros
  const canManageMembers = (member) => {
    if (!isCurrentUserLeader) return false;
    // No permitir que los miembros se eliminen a sí mismos
    if (member.user_id === currentUser?.id) return false;
    // El líder del proyecto no puede ser eliminado
    if (isProjectLeader(member)) return false;
    return true;
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await onRemoveMember(memberId);
      setMemberToRemove(null);
    } catch (error) {
      console.error("Error removing member:", error);
      alert(error.message || "Error al eliminar el miembro");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4c0519]"></div>
            <span className="ml-2">Cargando equipo...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Equipo del Proyecto ({members.length})
            </CardTitle>
            {isCurrentUserLeader && (
              <Button
                onClick={onAddMember}
                variant="outline"
                size="sm"
                className="gap-2 hover:opacity-70"
                style={{ color: '#4c0519', borderColor: '#4c0519' }}
              >
                <UserPlus className="w-4 h-4" />
                Agregar Miembro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-lg font-medium mb-1">No hay miembros en el equipo</p>
                <p className="text-sm">Agrega miembros para colaborar en el proyecto</p>
              </div>
            ) : (
              members.map((member) => {
                const memberIsLeader = isProjectLeader(member);
                const canManage = canManageMembers(member);
                const isCurrentUser = member.user_id === currentUser?.id;

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-lg border transition-all ${
                      memberIsLeader 
                        ? 'border-[#4c0519] bg-gradient-to-r from-[#4c0519]/5 to-[#7d1128]/5' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14 flex-shrink-0">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="text-white text-lg" style={{ 
                          background: memberIsLeader 
                            ? 'linear-gradient(to br, #4c0519, #7d1128)' 
                            : 'linear-gradient(to br, #6b7280, #9ca3af)'
                        }}>
                          {member.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-gray-900 text-lg">
                            {member.name}
                            {isCurrentUser && (
                              <span className="text-sm text-gray-500 ml-2">(Tú)</span>
                            )}
                          </p>
                          {memberIsLeader && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-[#4c0519] text-white rounded-full text-xs">
                              <Crown className="w-3 h-3" />
                              <span>Líder</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 mb-3">
                          {member.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{member.email}</span>
                            </div>
                          )}

                          {member.position && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Briefcase className="w-4 h-4" />
                              <span>{member.position}</span>
                            </div>
                          )}

                          {member.role && (
                            <Badge
                              variant="outline"
                              className={memberIsLeader
                                ? 'text-white border-0'
                                : 'border-gray-300 text-gray-700'
                              }
                              style={memberIsLeader ? { background: '#4c0519' } : {}}
                            >
                              {member.role === 'leader' ? 'Líder' : 'Colaborador'}
                            </Badge>
                          )}

                          {/* ✅ NUEVO: Fecha Pactada de Entrega */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              <strong>Fecha pactada:</strong> {formatDateDisplay(member.agreed_delivery_date)}
                            </span>
                          </div>
                        </div>

                        {member.responsibilities && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 font-medium mb-1">Responsabilidades:</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {member.responsibilities}
                            </p>
                          </div>
                        )}
                      </div>

                      {canManage && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditMember(member)}
                            className="hover:opacity-70"
                            style={{ color: '#4c0519' }}
                            title="Editar miembro"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMemberToRemove(member)}
                            className="hover:opacity-70"
                            style={{ color: '#7d1128' }}
                            title="Eliminar miembro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!isCurrentUserLeader && members.length > 0 && (
            <div className="mt-4 p-3 rounded-lg border" style={{ 
              backgroundColor: 'rgba(76, 5, 25, 0.05)', 
              borderColor: 'rgba(76, 5, 25, 0.2)' 
            }}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#4c0519' }} />
                <p className="text-xs" style={{ color: '#4c0519' }}>
                  <strong>Nota:</strong> Solo los líderes del proyecto pueden agregar, editar o remover miembros del equipo.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Confirmación para Eliminar Miembro */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro del proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar a <strong>{memberToRemove?.name}</strong> del proyecto?
              <br /><br />
              <span className="text-red-600 font-medium">
                Esta acción no se puede deshacer. El miembro perderá acceso al proyecto y todas sus actividades asignadas.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRemoveMember(memberToRemove?.id)}
              className="text-white hover:opacity-90"
              style={{ background: 'linear-gradient(to right, #7d1128, #a01c3a)' }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Miembro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}