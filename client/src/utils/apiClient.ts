import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getAuthHeader(): HeadersInit {
    const { tokens } = useAuthStore.getState();
    return tokens?.accessToken ? { 'Authorization': `Bearer ${tokens.accessToken}` } : {};
  }

  private async refreshToken() {
    const { tokens, refreshAccessToken } = useAuthStore.getState();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new Error('Failed to refresh token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    let response = await fetch(`${API_URL}${endpoint}`, config);

    // If unauthorized, try to refresh the token and retry
    if (response.status === 401) {
      await this.refreshToken();
      // Update the authorization header with the new token
      config.headers = {
        ...config.headers,
        ...this.getAuthHeader(),
      };
      response = await fetch(`${API_URL}${endpoint}`, config);
    }

    return response;
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await this.request(endpoint, { ...options, method: 'GET' });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    const response = await this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    const response = await this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await this.request(endpoint, { ...options, method: 'DELETE' });
    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const error = new Error(data.message || 'Something went wrong');
      (error as any).status = response.status;
      throw error;
    }

    return data as T;
  }
}

export const apiClient = new ApiClient();
