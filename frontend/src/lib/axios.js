// import axios from "axios"
// export const axiosInstance = axios.create({
//     baseURL:import.meta.env.MODE === "development" ? "http://localhost:5001/api/":"/api/",
//     withCredentials:true
// })

// src/lib/axios.js
import axios from "axios";

// // 1. Create an axios instance pointing to your backend
export const axiosInstance = axios.create({
  baseURL: 
  // import.meta.env.VITE_API_URL || "http://localhost:5001/api",
   import.meta.env.VITE_API_URL === "development"
    ? "http://localhost:5001/api/" 
    : "/api/",
  withCredentials: true, // ensures cookies (e.g. JWT cookie) are sent as well
});



// 2. Interceptor: attach Authorization header if token is in localStorage
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

export default axiosInstance;
