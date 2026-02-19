// 📦 src/components/project/AddMemberDialog.jsx (Versión Completa con Corrección)
import React, { useState, useEffect, useCallback } from "react";
import { localClient } from "@/api/localClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, UserPlus, Mail, Briefcase, Clock, Info, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ✅ Funciones de fecha usando UTC
const formatDateForDisplay = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "Seleccionar fecha";
  }
  try {
    const utcDate = new Date(Date.UTC(
      date.getUTCFullYear(), 
      date.getUTCMonth(), 
      date.getUTCDate()
    ));
    return format(utcDate, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Fecha inválida";
  }
};

const formatDateForStorageCorrected = (date) => {
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

export default function AddMemberDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  project, 
  editingMember = null, 
  currentUser 
}) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    position: "",
    role: "collaborator",
    responsibilities: "",
    agreed_delivery_date: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ✅ Validación robusta del formulario
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.full_name?.trim()) {
      newErrors.full_name = "El nombre del colaborador es requerido";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "El nombre debe tener al menos 2 caracteres";
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El formato del correo no es válido";
    }
    
    if (!formData.responsibilities?.trim()) {
      newErrors.responsibilities = "Las responsabilidades son requeridas";
    } else if (formData.responsibilities.trim().length < 10) {
      newErrors.responsibilities = "Describe con más detalle las responsabilidades (mínimo 10 caracteres)";
    }

    if (!formData.agreed_delivery_date) {
      newErrors.agreed_delivery_date = "La fecha pactada de entrega es requerida";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.agreed_delivery_date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.agreed_delivery_date = "La fecha no puede ser anterior a hoy";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ✅ Efecto para validación automática después del primer intento
  useEffect(() => {
    if (submitAttempted) {
      validateForm();
    }
  }, [formData, submitAttempted, validateForm]);

  // Inicializar formulario para edición
  useEffect(() => {
    if (editingMember && open) {
      // Cargar datos del miembro existente
      setFormData({
        full_name: editingMember.name || editingMember.full_name || "",
        email: editingMember.email || "",
        position: editingMember.position || "",
        role: editingMember.role || "collaborator",
        responsibilities: editingMember.responsibilities || "",
        agreed_delivery_date: editingMember.agreed_delivery_date ? 
          new Date(editingMember.agreed_delivery_date) : null
      });
    } else if (!open) {
      // Resetear formulario al cerrar
      resetForm();
    }
  }, [editingMember, open]);

  // ✅ Función para resetear el formulario
  const resetForm = useCallback(() => {
    setFormData({
      full_name: "",
      email: "",
      position: "",
      role: "collaborator",
      responsibilities: "",
      agreed_delivery_date: null
    });
    setErrors({});
    setSubmitAttempted(false);
    setIsSubmitting(false);
  }, []);

  // ✅ CORRECCIÓN APLICADA: Manejo de envío con campos requeridos
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const memberData = {
        // ✅ Asegurar que estos campos se envíen:
        full_name: formData.full_name,
        email: formData.email,
        position: formData.position,
        role: formData.role,
        responsibilities: formData.responsibilities,
        agreed_delivery_date: formatDateForStorageCorrected(formData.agreed_delivery_date),
        project_id: project.id, // ✅ IMPORTANTE
        added_by: currentUser?.id, // ✅ IMPORTANTE
        // Campos adicionales para consistencia
        name: formData.full_name,
        status: "active",
        joined_date: new Date().toISOString().split('T')[0]
      };

      console.log('Enviando datos:', memberData); // Para debug
      
      await onSubmit(memberData);
      
      // Cerrar diálogo
      handleOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Error al agregar el miembro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleDateSelect = (date) => {
    try {
      if (date instanceof Date && !isNaN(date.getTime())) {
        setFormData(prev => ({
          ...prev,
          agreed_delivery_date: date
        }));
        
        if (errors.agreed_delivery_date) {
          setErrors(prev => ({ ...prev, agreed_delivery_date: "" }));
        }
      }
    } catch (error) {
      console.error("Error handling date selection:", error);
      setErrors(prev => ({ 
        ...prev, 
        agreed_delivery_date: "Fecha inválida seleccionada" 
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // ✅ Manejar tecla Enter en el formulario
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center" style={{ 
            background: 'linear-gradient(to right, #4c0519, #7d1128, #a01c3a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {editingMember ? 'Editar Miembro del Equipo' : 'Agregar Miembro al Equipo'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4" noValidate>
          {/* Información del Proyecto */}
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-2">Proyecto: {project?.name}</h4>
            <p className="text-sm text-gray-600">
              {editingMember ? 'Actualizar información del colaborador' : 'Agregar un nuevo colaborador al equipo del proyecto'}
            </p>
          </div>

          {/* Información Básica del Colaborador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre del Colaborador */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-semibold flex items-center gap-2">
                <span>Nombre del Colaborador *</span>
              </Label>
              <Input
                id="full_name"
                placeholder="Ej: María Fernández Soler"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className={`h-11 ${errors.full_name ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.full_name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.full_name}
                </p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Correo Electrónico *</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@empresa.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Posición/Rol */}
          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>Posición o Cargo</span>
            </Label>
            <Input
              id="position"
              placeholder="Ej: Desarrollador Frontend, Diseñador UX, etc."
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className="h-11"
              disabled={isSubmitting}
            />
          </div>

          {/* Rol en el Proyecto */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Rol en el Proyecto</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleInputChange('role', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collaborator">Colaborador</SelectItem>
                <SelectItem value="leader">Líder</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {formData.role === 'leader' 
                ? 'El líder puede gestionar el proyecto, miembros y actividades'
                : 'El colaborador puede ver y completar actividades asignadas'
              }
            </p>
          </div>

          {/* Fecha Pactada de Entrega */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="w-4 h-4" />
              <span>Fecha Pactada de Entrega *</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild disabled={isSubmitting}>
                <Button 
                  type="button"
                  variant="outline" 
                  className={`w-full justify-start text-left font-normal h-11 text-base ${
                    errors.agreed_delivery_date ? 'border-red-500 text-red-600' : 'border-gray-300 text-gray-700'
                  }`}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {formatDateForDisplay(formData.agreed_delivery_date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={formData.agreed_delivery_date}
                  onSelect={handleDateSelect}
                  locale={es}
                  initialFocus
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
            {errors.agreed_delivery_date && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.agreed_delivery_date}
              </p>
            )}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Nota:</strong> Esta fecha la determina el líder con el colaborador, está prevista para revisar el desarrollo completo antes de que salga a productivo.
                </span>
              </p>
            </div>
          </div>

          {/* Responsabilidades y Entregables */}
          <div className="space-y-2">
            <Label htmlFor="responsibilities" className="text-sm font-semibold">
              Responsabilidades y Entregables *
            </Label>
            <Textarea
              id="responsibilities"
              value={formData.responsibilities}
              onChange={(e) => handleInputChange('responsibilities', e.target.value)}
              placeholder="Describe las responsabilidades específicas, tareas y entregables que tendrá este miembro en el proyecto..."
              rows={4}
              className={`resize-none ${errors.responsibilities ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
            {errors.responsibilities && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.responsibilities}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Especifica claramente qué se espera que entregue o realice este miembro en el proyecto
            </p>
          </div>

          {/* Estado de envío */}
          {isSubmitting && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800 text-center">
                Procesando solicitud...
              </p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="h-11 min-w-[100px]"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="text-white shadow-lg hover:opacity-90 transition-opacity h-11 min-w-[150px]"
              style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Guardando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {editingMember ? 'Guardar Cambios' : 'Agregar al Equipo'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}