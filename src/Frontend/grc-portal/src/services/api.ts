import axios from 'axios';
import { apiConfig } from '../auth/authConfig';
export const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  headers: { 'Api-Version': apiConfig.apiVersion },
});
export function setAuthToken(token: string) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
export const riskApi = {
  getAll: () => apiClient.get('/risk/api/risks').then(r => r.data),
  getById: (id: string) => apiClient.get('/risk/api/risks/' + id).then(r => r.data),
  create: (data: unknown) => apiClient.post('/risk/api/risks', data).then(r => r.data),
  update: (id: string, data: unknown) => apiClient.put('/risk/api/risks/' + id, data).then(r => r.data),
  updateAssessment: (id: string, data: unknown) => apiClient.put('/risk/api/risks/' + id + '/assessment', data).then(r => r.data),
  delete: (id: string) => apiClient.delete('/risk/api/risks/' + id).then(r => r.data),
};
export const complianceApi = {
  getFrameworks: () => apiClient.get('/compliance/api/frameworks').then(r => r.data),
  getById: (id: string) => apiClient.get('/compliance/api/frameworks/' + id).then(r => r.data),
  create: (data: unknown) => apiClient.post('/compliance/api/frameworks', data).then(r => r.data),
  update: (id: string, data: unknown) => apiClient.put('/compliance/api/frameworks/' + id, data).then(r => r.data),
  delete: (id: string) => apiClient.delete('/compliance/api/frameworks/' + id).then(r => r.data),
};
export const policyApi = {
  getAll: () => apiClient.get('/policy/api/policies').then(r => r.data),
  getById: (id: string) => apiClient.get('/policy/api/policies/' + id).then(r => r.data),
  create: (data: unknown) => apiClient.post('/policy/api/policies', data).then(r => r.data),
  update: (id: string, data: unknown) => apiClient.put('/policy/api/policies/' + id, data).then(r => r.data),
  delete: (id: string) => apiClient.delete('/policy/api/policies/' + id).then(r => r.data),
};
export const auditApi = {
  getAll: () => apiClient.get('/audit/api/audits').then(r => r.data),
  getById: (id: string) => apiClient.get('/audit/api/audits/' + id).then(r => r.data),
  create: (data: unknown) => apiClient.post('/audit/api/audits', data).then(r => r.data),
  update: (id: string, data: unknown) => apiClient.put('/audit/api/audits/' + id, data).then(r => r.data),
  delete: (id: string) => apiClient.delete('/audit/api/audits/' + id).then(r => r.data),
};

