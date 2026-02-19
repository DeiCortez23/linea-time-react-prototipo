import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";

export default function TimelineFilters({ filters, onFilterChange, projectTypes }) {
  const clearFilters = () => {
    console.log("🧹 Limpiando filtros");
    onFilterChange({
      busqueda: "",
      tipo: "todos",
      ordenar: "fecha_inicio"
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    console.log(`🔍 Cambio en búsqueda: "${value}"`);
    onFilterChange({ ...filters, busqueda: value });
  };

  const handleTypeChange = (value) => {
    console.log(`🏷️ Cambio en tipo: "${value}"`);
    onFilterChange({ ...filters, tipo: value });
  };

  const handleSortChange = (value) => {
    console.log(`📊 Cambio en orden: "${value}"`);
    onFilterChange({ ...filters, ordenar: value });
  };

  const hasActiveFilters = filters.busqueda || filters.tipo !== "todos";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nombre..."
            value={filters.busqueda}
            onChange={handleSearchChange}
            className="pl-10 pr-10"
          />
          {filters.busqueda && (
            <button
              onClick={() => {
                console.log("❌ Limpiando búsqueda");
                onFilterChange({ ...filters, busqueda: "" });
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtro por Tipo de Proyecto */}
        <Select 
          value={filters.tipo} 
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo de proyecto" />
          </SelectTrigger>
          <SelectContent>
            {projectTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.ordenar} 
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fecha_creacion">Más recientes</SelectItem>
            <SelectItem value="fecha_inicio">Fecha de inicio</SelectItem>
            <SelectItem value="fecha_fin">Fecha de fin</SelectItem>
            <SelectItem value="progreso">Progreso</SelectItem>
            <SelectItem value="nombre">Nombre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="whitespace-nowrap"
          style={{ color: '#7d1128', borderColor: '#7d1128' }}
        >
          <X className="w-4 h-4 mr-1" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}