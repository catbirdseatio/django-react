import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";

export interface ITokenStorage {
  access: string | null;
  refresh: string | null;
}

// Retrieve baseURL from process.env
export const baseURL: string | undefined = import.meta.env.VITE_BASE_URL;

if (!baseURL) {
  throw new Error("VITE_BASE_URL is not defined in the environment variables.");
}

// Create Axios instance with generics
export const axiosInstance: AxiosInstance = axios.create({
  baseURL,
});

// Add a request interceptor to attach the token to outgoing requests
axiosInstance.interceptors.request.use(
  <T extends AxiosRequestConfig>(config: T) => {
    const token = localStorage.getItem("access");
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }

      config.headers.Authorization = `JWT ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  <T>(response: AxiosResponse<T>) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // If the error is due to an expired token
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Call your endpoint to refresh the token
      const tokenStorage: ITokenStorage = {
        access: localStorage.getItem("access"),
        refresh: localStorage.getItem("refresh"),
      };

      if (!tokenStorage.refresh) {
        // Handle the case where refresh token is not available, redirect to login or handle as needed
        console.error("Refresh token is not available");
        return Promise.reject(error);
      }

      try {
        const response: AxiosResponse<ITokenStorage> =
          await axios.post<ITokenStorage>(`${baseURL}/accounts/jwt/refresh`, {
            refresh: tokenStorage.refresh,
          });

        // If refresh successful, update tokens and retry original request
        localStorage.setItem("access", response.data.access || "");
        localStorage.setItem("refresh", response.data.refresh || "");
        originalRequest.headers = originalRequest.headers || {}; // Ensure headers exist
        originalRequest.headers.Authorization = `JWT ${response.data.access}`;
        console.log("Tokens refreshed.");
        return axios(originalRequest);
      } catch (error) {
        // If refresh fails, redirect to login or handle as needed
        console.error("Token refresh failed:", error);
        localStorage.clear();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

class APIClient<T> {
  protected axiosInstance: AxiosInstance;
  protected endpoint: string;

  constructor(endpoint: string, axiosInstance: AxiosInstance) {
    this.endpoint = endpoint;
    this.axiosInstance = axiosInstance;
  }

  // GET method
  async get(): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get<T>(
        this.endpoint
      );
      return response.data;
    } catch (error) {
      // Handle error
      console.error("GET request error:", error);
      throw error;
    }
  }

  // GET all method
  async getAll(): Promise<T[]> {
    try {
      const response: AxiosResponse<T[]> = await this.axiosInstance.get<T[]>(
        this.endpoint
      );
      return response.data;
    } catch (error) {
      // Handle error
      console.error("GET all request error:", error);
      throw error;
    }
  }

  // POST method
  async post(data: T): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post<T>(
        this.endpoint,
        data
      );
      return response.data;
    } catch (error) {
      // Handle error
      console.error("POST request error:", error);
      throw error;
    }
  }
}

export default APIClient;
