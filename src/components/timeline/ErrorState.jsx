import { AlertCircle } from "lucide-react";

export default function ErrorState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar proyectos</h2>
        <p className="text-gray-600">Intenta recargar la página</p>
      </div>
    </div>
  );
}
