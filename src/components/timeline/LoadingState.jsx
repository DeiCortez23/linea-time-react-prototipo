import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4c0519' }} />
    </div>
  );
}
