import axios from 'axios';
import { getApiBase } from './apiBase';

export const http = axios.create({
  baseURL: getApiBase(),
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);
