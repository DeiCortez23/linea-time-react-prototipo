import React, { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ✅ CORRECCIÓN COMPLETA: Funciones de fecha usando UTC
const formatDateForDisplay = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "Seleccionar fecha";
  }
  try {
    // ✅ CORRECCIÓN: Usar métodos UTC para mostrar el día correcto
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

// ✅ CORRECCIÓN: Función para formatear fecha para almacenamiento usando UTC
const formatDateForStorageCorrected = (date) => {
  if (!date) return null;
  
  // Si ya es string en formato correcto, devolverlo
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Si es Date, extraer componentes UTC
  if (date instanceof Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
};

// ✅ CORRECCIÓN: Función para parsear fechas desde almacenamiento usando UTC
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

export default function CreateActivityDialog({ open, onOpenChange, onSubmit, members = [], currentUser, editingActivity = null }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: null, // Fecha de inicio
    end_date: null, // Fecha de término
    priority: "medium",
    assigned_to: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NUEVO: Estado para prevenir doble envío

  useEffect(() => {
    if (editingActivity) {
      // ✅ CORRECCIÓN: Usar la función corregida para parsear fechas (UTC)
      setFormData({
        title: editingActivity.title || "",
        description: editingActivity.description || "",
        due_date: parseDateCorrected(editingActivity.due_date),
        end_date: parseDateCorrected(editingActivity.end_date),
        priority: editingActivity.priority || "medium",
        assigned_to: editingActivity.assigned_to || ""
      });
    } else if (!open) {
      // Reset form when closing
      setFormData({
        title: "",
        description: "",
        due_date: null,
        end_date: null,
        priority: "medium",
        assigned_to: ""
      });
      setErrors({});
    }
  }, [editingActivity, open]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "El título de la actividad es requerido";
    }
    
    if (!formData.due_date) {
      newErrors.due_date = "La fecha de inicio es requerida";
    }
    
    if (formData.end_date && formData.due_date && formData.end_date < formData.due_date) {
      newErrors.end_date = "La fecha de fin no puede ser anterior a la fecha de inicio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejo simplificado de fechas
  const handleDateSelect = (field, date) => {
    try {
      if (date instanceof Date && !isNaN(date.getTime())) {
        setFormData(prev => {
          const newData = {
            ...prev,
            [field]: date
          };
          
          if (field === 'due_date' && prev.end_date && date > prev.end_date) {
            newData.end_date = null;
          }
          
          return newData;
        });
        
        if (errors[field]) {
          setErrors(prev => ({
            ...prev,
            [field]: ""
          }));
        }
      }
    } catch (error) {
      console.error("Error handling date selection:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ NUEVO: Prevenir propagación
    
    if (!validateForm() || isSubmitting) { // ✅ NUEVO: Verificar si ya está enviando
      return;
    }

    setIsSubmitting(true); // ✅ NUEVO: Marcar como enviando

    try {
      // ✅ CORRECCIÓN: Usar la función corregida para formatear fechas (UTC)
      const activityData = {
        ...formData,
        due_date: formatDateForStorageCorrected(formData.due_date),
        end_date: formatDateForStorageCorrected(formData.end_date)
      };

      await onSubmit(activityData); // ✅ NUEVO: Usar await
      
      // ✅ DISPARAR EVENTO PARA ACTUALIZAR TIMELINE
      setTimeout(() => {
        const action = editingActivity ? 'updated' : 'created';
        window.dispatchEvent(new CustomEvent('activitiesUpdated', {
          detail: { action }
        }));
        
        // También notificar al NotificationManager
        if (localClient?.notificationManager) {
          localClient.notificationManager.notify({
            type: 'force_refresh',
            message: editingActivity ? 'Actividad actualizada' : 'Nueva actividad creada',
            timestamp: new Date().toISOString()
          });
        }
      }, 500);
      
      // ✅ NUEVO: Cerrar diálogo después de éxito
      handleOpenChange(false);
      
    } catch (error) {
      console.error("Error creating activity:", error);
      alert(error.message || "Error al crear la actividad");
    } finally {
      setIsSubmitting(false); // ✅ NUEVO: Resetear estado de envío
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        due_date: null,
        end_date: null,
        priority: "medium",
        assigned_to: ""
      });
      setErrors({});
      setIsSubmitting(false); // ✅ NUEVO: Resetear estado de envío
    }
    onOpenChange(isOpen);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // Función mejorada para deshabilitar fechas
  const isEndDateDisabled = (date) => {
    if (!formData.due_date) return false;
    
    try {
      // Crear fechas UTC para comparación exacta
      const dueDate = new Date(Date.UTC(
        formData.due_date.getUTCFullYear(),
        formData.due_date.getUTCMonth(),
        formData.due_date.getUTCDate()
      ));
      
      const compareDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
      ));
      
      return compareDate < dueDate;
    } catch (error) {
      console.error("Error in date disable logic:", error);
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center" style={{ 
            background: 'linear-gradient(to right, #4c0519, #7d1128, #a01c3a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">Título de la Actividad *</Label>
            <Input
              id="title"
              placeholder="Ej: Revisar propuesta de diseño"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              className="h-11"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Detalles de la actividad..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Fecha de Inicio - MÁS CLARO */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <CalendarIcon className="w-4 h-4" />
                <span>Fecha de Inicio de la Actividad *</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    type="button"
                    variant="outline" 
                    className={`w-full justify-start text-left font-normal h-11 text-base ${
                      errors.due_date ? 'border-red-500 text-red-600' : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {formatDateForDisplay(formData.due_date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 z-[100]" 
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => handleDateSelect('due_date', date)}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.due_date && (
                <p className="text-sm text-red-600">{errors.due_date}</p>
              )}
              <p className="text-xs text-gray-500">
                Fecha en la que comienza el trabajo en esta actividad
              </p>
            </div>

            {/* Fecha de Fin - MÁS CLARO */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <CalendarIcon className="w-4 h-4" />
                Fecha de Término / Entrega
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    type="button"
                    variant="outline" 
                    className={`w-full justify-start text-left font-normal h-11 text-base ${
                      errors.end_date ? 'border-red-500 text-red-600' : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {formatDateForDisplay(formData.end_date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 z-[100]" 
                  align="start"
                  style={{ 
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                  }}
                >
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => handleDateSelect('end_date', date)}
                    locale={es}
                    disabled={isEndDateDisabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && (
                <p className="text-sm text-red-600">{errors.end_date}</p>
              )}
              <p className="text-xs text-gray-500">
                Fecha límite para completar la actividad
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Asignar a</Label>
            <Select 
              value={formData.assigned_to}
              onValueChange={(value) => handleInputChange('assigned_to', value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Seleccionar miembro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.user_id || member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="text-xs text-white" style={{ background: 'linear-gradient(to br, #4c0519, #7d1128)' }}>
                          {member.name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="h-11"
              disabled={isSubmitting} // ✅ NUEVO: Deshabilitar durante envío
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="text-white shadow-lg hover:opacity-90 transition-opacity h-11"
              style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
              disabled={!formData.title || !formData.due_date || isSubmitting} // ✅ NUEVO: Deshabilitar durante envío
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingActivity ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                editingActivity ? 'Guardar Cambios' : 'Crear Actividad'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}