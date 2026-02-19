import React, { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings as SettingsIcon, Bell, User, Upload, Loader2, CheckCircle, Crown, Users, Lock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// Custom hook para manejar los settings
const useSettings = () => {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => localClient.auth.me(),
    staleTime: Infinity,
  });

  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    full_name: "",
    position: "",
    user_role: "collaborator",
    password: ""
  });

  useEffect(() => {
    if (user) {
      setSettings({
        email_notifications: user.email_notifications ?? true,
        push_notifications: user.push_notifications ?? true,
        full_name: user.full_name || "",
        position: user.position || "",
        user_role: user.user_role || "collaborator",
        password: user.password || ""
      });
    }
  }, [user]);

  return { user, settings, setSettings };
};

// Custom hook para manejar las mutaciones
const useSettingsMutations = () => {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => localClient.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSaved(true);
      setError("");
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSaveSettings = (settings) => {
    // Validar contraseña
    if (settings.user_role === "leader" && settings.password !== "123") {
      setError("Contraseña incorrecta para Líder. Debe ser: 123");
      return false;
    }
    if (settings.user_role === "collaborator" && settings.password !== "1234") {
      setError("Contraseña incorrecta para Colaborador. Debe ser: 1234");
      return false;
    }

    updateSettingsMutation.mutate(settings);
    return true;
  };

  return {
    updateSettingsMutation,
    saved,
    error,
    setError,
    handleSaveSettings
  };
};

// Custom hook para manejar la subida de avatar
const useAvatarUpload = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await localClient.integrations.Core.UploadFile({ file });
      await localClient.auth.updateMe({ avatar_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
    setUploading(false);
  };

  return { uploading, handleAvatarUpload };
};

// Componente para el header de settings
const SettingsHeader = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8"
  >
    <h1 
      className="text-3xl md:text-4xl font-bold mb-2" 
      style={{ 
        background: 'linear-gradient(to right, #4c0519, #7d1128, #a01c3a)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}
    >
      Configuración
    </h1>
    <p className="text-gray-600">
      Personaliza tu experiencia en Timeline Projects
    </p>
  </motion.div>
);

// Componente para la sección de perfil de usuario
const UserProfileSection = ({ user, settings, setSettings, uploading, onAvatarUpload, error }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <User className="w-5 h-5" />
        Perfil de Usuario
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <AvatarUpload 
        user={user} 
        uploading={uploading} 
        onAvatarUpload={onAvatarUpload} 
      />
      
      <FormField
        label="Nombre Completo *"
        id="full_name"
        value={settings.full_name}
        onChange={(value) => setSettings({ ...settings, full_name: value })}
        placeholder="Ej: Juan Pérez"
      />

      <FormField
        label="Puesto *"
        id="position"
        value={settings.position}
        onChange={(value) => setSettings({ ...settings, position: value })}
        placeholder="Ej: Desarrollador, Diseñador, Coordinador"
      />

      <RoleSelector 
        value={settings.user_role}
        onChange={(value) => setSettings({ ...settings, user_role: value })}
      />

      <PasswordField 
        value={settings.password}
        onChange={(value) => setSettings({ ...settings, password: value })}
        userRole={settings.user_role}
        error={error}
      />
    </CardContent>
  </Card>
);

// Componente para subir avatar
const AvatarUpload = ({ user, uploading, onAvatarUpload }) => (
  <div className="flex items-center gap-6">
    <div className="relative">
      <Avatar className="w-24 h-24">
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback className="text-2xl text-white" style={{ background: 'linear-gradient(to br, #4c0519, #7d1128)' }}>
          {user.full_name?.[0] || user.email[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {uploading && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}
    </div>
    <div className="flex-1">
      <p className="font-semibold text-lg">{user.full_name || user.email}</p>
      <p className="text-sm text-gray-500 mb-3">{user.email}</p>
      <div>
        <Input
          type="file"
          id="avatar-upload"
          className="hidden"
          accept="image/*"
          onChange={onAvatarUpload}
          disabled={uploading}
        />
        <Button
          onClick={() => document.getElementById('avatar-upload')?.click()}
          variant="outline"
          size="sm"
          disabled={uploading}
          className="hover:opacity-70"
          style={{ color: '#4c0519', borderColor: '#4c0519' }}
        >
          <Upload className="w-4 h-4 mr-2" />
          Cambiar Avatar
        </Button>
      </div>
    </div>
  </div>
);

// Componente reutilizable para campos de formulario
const FormField = ({ label, id, value, onChange, placeholder, type = "text" }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

// Componente para seleccionar rol
const RoleSelector = ({ value, onChange }) => (
  <div className="space-y-2">
    <Label htmlFor="user_role">Rol en la Plataforma *</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-auto py-3">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="leader" className="py-3">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5" style={{ color: '#4c0519' }} />
            <div>
              <div className="font-semibold">Líder</div>
              <div className="text-xs text-gray-500">
                Puede crear proyectos, agregar colaboradores, eliminar actividades
              </div>
            </div>
          </div>
        </SelectItem>
        <SelectItem value="collaborator" className="py-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5" style={{ color: '#7d1128' }} />
            <div>
              <div className="font-semibold">Colaborador</div>
              <div className="text-xs text-gray-500">
                Puede completar y editar actividades asignadas
              </div>
            </div>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// Componente para el campo de contraseña
const PasswordField = ({ value, onChange, userRole, error }) => (
  <div className="space-y-2">
    <Label htmlFor="password" className="flex items-center gap-2">
      <Lock className="w-4 h-4" />
      Contraseña de Rol *
    </Label>
    <Input
      id="password"
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={userRole === "leader" ? "123" : "1234"}
    />
    <div className="p-3 rounded-lg border" style={{ backgroundColor: 'rgba(76, 5, 25, 0.05)', borderColor: 'rgba(76, 5, 25, 0.2)' }}>
      <p className="text-sm" style={{ color: '#4c0519' }}>
        <strong>Contraseñas:</strong><br />
        • Líder: 123<br />
        • Colaborador: 1234
      </p>
    </div>
    {error && (
      <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-sm text-red-600 font-medium">{error}</p>
      </div>
    )}
  </div>
);

// Componente para las notificaciones
const NotificationsSection = ({ settings, setSettings }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bell className="w-5 h-5" />
        Preferencias de Notificaciones
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <NotificationToggle
        id="email-notifications"
        label="Notificaciones por Email"
        description="Recibe notificaciones por correo electrónico"
        checked={settings.email_notifications}
        onChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
      />
      
      <NotificationToggle
        id="push-notifications"
        label="Notificaciones Push"
        description="Recibe notificaciones dentro de la aplicación"
        checked={settings.push_notifications}
        onChange={(checked) => setSettings({ ...settings, push_notifications: checked })}
      />
    </CardContent>
  </Card>
);

// Componente reutilizable para toggles de notificación
const NotificationToggle = ({ id, label, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div className="space-y-0.5">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onChange}
    />
  </div>
);

// Componente para el botón de guardar
const SaveButton = ({ onSave, isLoading, saved }) => (
  <div className="flex justify-end gap-3">
    {saved && (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 mr-3"
        style={{ color: '#7d1128' }}
      >
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Cambios guardados</span>
      </motion.div>
    )}
    <Button
      onClick={onSave}
      className="text-white shadow-lg hover:opacity-90 transition-opacity"
      style={{ background: 'linear-gradient(to right, #4c0519, #7d1128)' }}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Guardando...
        </>
      ) : (
        <>
          <SettingsIcon className="w-4 h-4 mr-2" />
          Guardar Cambios
        </>
      )}
    </Button>
  </div>
);

// Componente principal
export default function Settings() {
  const { user, settings, setSettings } = useSettings();
  const { updateSettingsMutation, saved, error, handleSaveSettings } = useSettingsMutations();
  const { uploading, handleAvatarUpload } = useAvatarUpload();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4c0519' }} />
      </div>
    );
  }

  const handleSave = () => {
    handleSaveSettings(settings);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <SettingsHeader />
        
        <div className="space-y-6">
          <UserProfileSection
            user={user}
            settings={settings}
            setSettings={setSettings}
            uploading={uploading}
            onAvatarUpload={handleAvatarUpload}
            error={error}
          />

          <NotificationsSection 
            settings={settings} 
            setSettings={setSettings} 
          />

          <SaveButton
            onSave={handleSave}
            isLoading={updateSettingsMutation.isPending}
            saved={saved}
          />
        </div>
      </div>
    </div>
  );
}