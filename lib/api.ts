const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://giro-certo-api.onrender.com';

export interface ApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_URL) {
    this.baseURL = baseURL;
    // Carregar token do localStorage se estiver no cliente
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Adicionar token de autenticação se disponível
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.setToken(null);
        }
        let message = `Erro HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody && typeof errBody.error === 'string') {
            message = errBody.error;
          }
        } catch {
          /* corpo não JSON */
        }
        throw new Error(message);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Upload de imagem (multipart). Reusa o endpoint de imagens da API
   * (Firebase Storage) e retorna a URL absoluta. entityId é apenas o
   * escopo de pasta; o vínculo real é salvar a URL no recurso da loja.
   */
  async uploadImage(file: File, entityId: string = 'store'): Promise<string> {
    const form = new FormData();
    form.append('image', file);
    const url = `${this.baseURL}/api/images/upload/partner/${encodeURIComponent(entityId)}`;
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(url, { method: 'POST', headers, body: form });
    if (!response.ok) {
      let message = `Erro HTTP ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody && typeof errBody.error === 'string') message = errBody.error;
      } catch {
        /* corpo não JSON */
      }
      throw new Error(message);
    }
    const data = await response.json();
    const imageUrl = data?.image?.url as string | undefined;
    if (!imageUrl) throw new Error('Resposta de upload sem URL');
    return imageUrl;
  }

  // Health check
  async health(): Promise<ApiResponse> {
    return this.get<ApiResponse>('/health');
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.post<{ user: any; token: string }>('/api/auth/login', {
      email,
      password,
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setToken(null);
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
