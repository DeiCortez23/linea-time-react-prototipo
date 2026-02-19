import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export default function TimelineHeader({ projectCount, isUserLeader, onCreateProject, isCreating }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ 
          background: 'linear-gradient(to right, #4c0519, #7d1128, #a01c3a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Timeline de Proyectos
        </h1>
        <p className="text-gray-600">
          {projectCount} proyecto{projectCount !== 1 ? 's' : ''} encontrado{projectCount !== 1 ? 's' : ''}
        </p>
      </div>
      {isUserLeader && (
        <Button
          onClick={onCreateProject}
          className="text-white shadow-lg hover:opacity-90 transition-opacity px-6 py-2 h-auto"
          style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Proyecto
            </>
          )}
        </Button>
      )}
    </div>
  );
}
