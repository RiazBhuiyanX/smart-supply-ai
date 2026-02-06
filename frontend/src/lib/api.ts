export const BASE_URL = 'http://localhost:8080';



interface ApiOptions extends RequestInit {
  // Add any custom options here if needed later
}

export const api = {
  request: async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
    const token = localStorage.getItem('token');
    
    // Ensure endpoint starts with / if not present (unless it's a full URL, but we assume relative)
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
        // Try to parse error message from backend
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },

  get: <T>(endpoint: string) => api.request<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, body: any) => api.request<T>(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  
  put: <T>(endpoint: string, body: any) => api.request<T>(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  }),

  patch: <T>(endpoint: string, body: any) => api.request<T>(endpoint, { 
    method: 'PATCH', 
    body: JSON.stringify(body) 
  }),

  delete: <T>(endpoint: string) => api.request<T>(endpoint, { method: 'DELETE' })
};
