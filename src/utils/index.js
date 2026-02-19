export const createPageUrl = (pageName) => {
  const routes = {
    Timeline: "/timeline",
    ProjectDetail: "/project",
    ActivityDetail: "/activity",
    Notifications: "/notifications",
    Settings: "/settings",
  };
  
  if (pageName.includes('?')) {
    const [route, query] = pageName.split('?');
    return `${routes[route]}?${query}`;
  }
  
  return routes[pageName] || "/";
};

export const formatDate = (date, options = {}) => {
  if (!date) return '';
  const defaultOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    ...options 
  };
  return new Date(date).toLocaleDateString('es-ES', defaultOptions);
};

export const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};