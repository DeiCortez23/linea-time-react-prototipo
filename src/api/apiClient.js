// Configuración base del API Client
const createApiClient = () => {
  const baseURL = 'https://your-api-domain.com'; // Cambiar por tu API real
  
  const request = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // Entities
  const entities = {
    Project: {
      list: () => request('/projects'),
      filter: (filters) => request('/projects?' + new URLSearchParams(filters)),
      get: (id) => request(`/projects/${id}`),
      create: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
    },
    Activity: {
      list: () => request('/activities'),
      filter: (filters) => request('/activities?' + new URLSearchParams(filters)),
      get: (id) => request(`/activities/${id}`),
      create: (data) => request('/activities', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/activities/${id}`, { method: 'DELETE' }),
    },
    ProjectMember: {
      list: () => request('/project-members'),
      filter: (filters) => request('/project-members?' + new URLSearchParams(filters)),
      create: (data) => request('/project-members', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/project-members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/project-members/${id}`, { method: 'DELETE' }),
    },
    Notification: {
      list: () => request('/notifications'),
      filter: (filters) => request('/notifications?' + new URLSearchParams(filters)),
      update: (id, data) => request(`/notifications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
    },
    Attachment: {
      filter: (filters) => request('/attachments?' + new URLSearchParams(filters)),
      create: (data) => request('/attachments', { method: 'POST', body: JSON.stringify(data) }),
      delete: (id) => request(`/attachments/${id}`, { method: 'DELETE' }),
    },
    User: {
      list: () => request('/users'),
      filter: (filters) => request('/users?' + new URLSearchParams(filters)),
    }
  };

  // Auth
  const auth = {
    me: () => ({
      id: '1',
      email: 'usuario@ejemplo.com',
      full_name: 'Usuario Demo',
      avatar_url: '',
      user_role: 'leader', // Cambiar a 'collaborator' para probar ambos roles
      position: 'Desarrollador',
      email_notifications: true,
      push_notifications: true
    }),
    updateMe: (data) => {
      console.log('Updating user:', data);
      return Promise.resolve(data);
    },
    logout: () => {
      console.log('Logging out...');
      window.location.href = '/login';
    }
  };

  // Integrations
  const integrations = {
    Core: {
      UploadFile: ({ file }) => {
        // Simulación de subida de archivo
        return Promise.resolve({
          file_url: URL.createObjectURL(file)
        });
      }
    }
  };

  return {
    entities,
    auth,
    integrations
  };
};

const apiClient = createApiClient();

export { apiClient };