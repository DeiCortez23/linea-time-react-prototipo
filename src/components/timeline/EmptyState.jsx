import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function EmptyState({ hasActiveFilters, isUserLeader, onCreateProject, onClearFilters }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-200"
    >
      <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(76, 5, 25, 0.1)' }}>
        <Plus className="w-12 h-12" style={{ color: '#4c0519' }} />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {hasActiveFilters 
          ? "No se encontraron proyectos" 
          : "No hay proyectos aún"}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {hasActiveFilters
          ? "Intenta ajustar los filtros de búsqueda o limpiar los filtros activos"
          : isUserLeader 
            ? "Comienza creando tu primer proyecto para organizar tus actividades"
            : "Los líderes crearán proyectos y te asignarán actividades pronto"}
      </p>
      {!hasActiveFilters && isUserLeader && (
        <Button
          onClick={onCreateProject}
          className="text-white shadow-lg hover:opacity-90 transition-opacity px-6"
          style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear Primer Proyecto
        </Button>
      )}
      {hasActiveFilters && (
        <Button
          onClick={onClearFilters}
          variant="outline"
          className="px-6"
          style={{ color: '#4c0519', borderColor: '#4c0519' }}
        >
          Limpiar Filtros
        </Button>
      )}
    </motion.div>
  );
}
