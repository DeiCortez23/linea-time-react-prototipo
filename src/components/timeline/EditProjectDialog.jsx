import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const colors = [
  { value: "#4c0519", label: "Vino Oscuro" },
  { value: "#7d1128", label: "Vino" },
  { value: "#a01c3a", label: "Rosa Vino" },
  { value: "#c2185b", label: "Rosa Fuerte" },
  { value: "#e91e63", label: "Rosa" },
  { value: "#1a472a", label: "Verde Oscuro" },
  { value: "#2e7d32", label: "Verde" },
  { value: "#388e3c", label: "Verde Claro" },
  { value: "#43a047", label: "Verde Brillante" },
  { value: "#66bb6a", label: "Verde Suave" },
  { value: "#b45f06", label: "Naranja Oscuro" },
  { value: "#e65100", label: "Naranja" },
  { value: "#ff6f00", label: "Naranja Claro" },
  { value: "#ff9800", label: "Naranja Brillante" },
  { value: "#ffa726", label: "Naranja Suave" },
  { value: "#741b47", label: "Púrpura Oscuro" },
  { value: "#8e24aa", label: "Púrpura" },
  { value: "#ab47bc", label: "Púrpura Claro" },
  { value: "#ba68c8", label: "Púrpura Suave" },
  { value: "#ce93d8", label: "Lila" },
  { value: "#0d47a1", label: "Azul Oscuro" },
  { value: "#1976d2", label: "Azul" },
  { value: "#2196f3", label: "Azul Claro" },
  { value: "#42a5f5", label: "Azul Brillante" },
  { value: "#64b5f6", label: "Azul Suave" },
  { value: "#5d4037", label: "Café Oscuro" },
  { value: "#795548", label: "Café" },
  { value: "#8d6e63", label: "Café Claro" },
  { value: "#455a64", label: "Gris Azulado" },
  { value: "#546e7a", label: "Gris" },
  { value: "#78909c", label: "Gris Claro" },
  { value: "#d32f2f", label: "Rojo" },
  { value: "#f44336", label: "Rojo Claro" },
  { value: "#ef5350", label: "Rojo Suave" },
  { value: "#00695c", label: "Turquesa Oscuro" },
  { value: "#00897b", label: "Turquesa" },
  { value: "#26a69a", label: "Turquesa Claro" },
];

const projectTypes = [
  { value: "PVB", label: "PVB" },
  { value: "PVMS", label: "PVMS" },
  { value: "AB", label: "AB" },
  { value: "AMS", label: "AMS" },
  { value: "HA", label: "HA" },
  { value: "PH", label: "PH" },
];

const statusOptions = [
  { value: "planning", label: "Planificación" },
  { value: "in_progress", label: "En Progreso" },
  { value: "completed", label: "Completado" },
  { value: "on_hold", label: "En Pausa" },
  { value: "cancelled", label: "Cancelado" }
];

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

export default function EditProjectDialog({ open, onOpenChange, onSubmit, currentUser, project, isLoading }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "PVB",
    start_date: null,
    end_date: null,
    color: "#4c0519",
    status: "planning",
    expected_activities: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project && open) {
      // ✅ CORRECCIÓN: Usar la función corregida para parsear fechas (UTC)
      setFormData({
        name: project.name || "",
        description: project.description || "",
        type: project.type || "PVB",
        start_date: parseDateCorrected(project.start_date),
        end_date: parseDateCorrected(project.end_date),
        color: project.color || "#4c0519",
        status: project.status || "planning",
        expected_activities: project.expected_activities || 0
      });
    }
  }, [project, open]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "El nombre del proyecto es requerido";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    }
    
    if (!formData.start_date) {
      newErrors.start_date = "La fecha de inicio es requerida";
    }
    
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "La fecha de fin no puede ser anterior a la fecha de inicio";
    }
    
    if (formData.expected_activities < 0) {
      newErrors.expected_activities = "El número de actividades no puede ser negativo";
    }

    if (formData.expected_activities > 50) {
      newErrors.expected_activities = "El número máximo de actividades es 50";
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
          
          if (field === 'start_date' && prev.end_date && date > prev.end_date) {
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
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // ✅ CORRECCIÓN: Usar la función corregida para formatear fechas (UTC)
      const projectData = {
        id: project.id,
        name: formData.name.trim(),
        description: formData.description,
        type: formData.type,
        start_date: formatDateForStorageCorrected(formData.start_date),
        end_date: formatDateForStorageCorrected(formData.end_date),
        color: formData.color,
        status: formData.status,
        expected_activities: parseInt(formData.expected_activities) || 0,
        updated_by: currentUser?.id
      };

      console.log("Enviando datos de actualización del proyecto:", projectData); // Para debugging
      
      await onSubmit(projectData);
      
      // No resetear el form aquí porque queremos mantener los datos hasta que se cierre el diálogo
    } catch (error) {
      console.error("Error updating project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // Reset form when closing
      setFormData({
        name: "",
        description: "",
        type: "PVB",
        start_date: null,
        end_date: null,
        color: "#4c0519",
        status: "planning",
        expected_activities: 0
      });
      setErrors({});
      setIsSubmitting(false);
    }
    onOpenChange(isOpen);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // Función simplificada para deshabilitar fechas
  const isDateDisabled = (date) => {
    if (!formData.start_date) return false;
    
    try {
      return date < formData.start_date;
    } catch (error) {
      console.error("Error in date disable logic:", error);
      return false;
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center" style={{ 
            background: 'linear-gradient(to right, #4c0519, #7d1128)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Editar Proyecto
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Tipo de Proyecto */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-semibold flex items-center gap-2">
              <span>Tipo de Proyecto USICAMM</span>
              <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-base py-2">
                    <div className="font-semibold">{type.label}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nombre del Proyecto */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
              <span>Nombre del Proyecto</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Convocatoria 2024"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`h-11 text-base ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe los objetivos del proyecto..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="text-base resize-none"
            />
          </div>

          {/* Estado del Proyecto */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold">Estado del Proyecto</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value} className="text-base py-2">
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actividades Esperadas */}
          <div className="space-y-2">
            <Label htmlFor="expected_activities" className="flex items-center gap-2 text-sm font-semibold">
              Número Estimado de Actividades
              <Info className="w-4 h-4 text-gray-400" />
            </Label>
            <Input
              id="expected_activities"
              type="number"
              min="0"
              max="50"
              placeholder="Ej: 10"
              value={formData.expected_activities}
              onChange={(e) => handleInputChange('expected_activities', parseInt(e.target.value) || 0)}
              className={`h-11 text-base ${errors.expected_activities ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {errors.expected_activities && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {errors.expected_activities}
              </p>
            )}
            <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <p className="text-sm text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  La línea de tiempo se dividirá en <strong className="text-amber-900">{formData.expected_activities || 0}</strong> puntos visuales. 
                  Cuando crees actividades, se irán marcando como completadas en la línea.
                </span>
              </p>
            </div>
          </div>

          {/* Secciones de Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de Inicio */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <CalendarIcon className="w-4 h-4" />
                <span>Fecha de Inicio</span>
                <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    type="button"
                    variant="outline" 
                    className={`w-full justify-start text-left font-normal h-11 text-base ${
                      errors.start_date ? 'border-red-500 text-red-600' : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {formatDateForDisplay(formData.start_date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => handleDateSelect('start_date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {errors.start_date}
                </p>
              )}
            </div>

            {/* Fecha de Fin */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <CalendarIcon className="w-4 h-4" />
                Fecha de Fin
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
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => handleDateSelect('end_date', date)}
                    disabled={isDateDisabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>

          {/* Color del Proyecto */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Color del Proyecto</Label>
            <div className="grid grid-cols-6 gap-3 max-h-48 overflow-y-auto p-1">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange('color', color.value)}
                  className={`w-full h-12 rounded-xl transition-all shadow-sm hover:shadow-md ${
                    formData.color === color.value 
                      ? 'ring-4 ring-offset-2 scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ 
                    backgroundColor: color.value,
                    ringColor: formData.color === color.value ? '#4c0519' : 'transparent'
                  }}
                  title={color.label}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 text-center">
              Color seleccionado: <strong style={{ color: formData.color }}>{colors.find(c => c.value === formData.color)?.label}</strong>
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)} 
              className="px-6 h-11 text-base"
              disabled={isSubmitting || isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="text-white shadow-lg hover:opacity-90 transition-opacity px-6 h-11 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
              disabled={!formData.name.trim() || !formData.start_date || isSubmitting || isLoading}
            >
              {(isSubmitting || isLoading) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}