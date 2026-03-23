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

export const soaApi = {
  getAll: () => apiClient.get('/soa/api/soa').then(r => r.data),
  getById: (id: string) => apiClient.get('/soa/api/soa/' + id).then(r => r.data),
  getStats: () => apiClient.get('/soa/api/soa/stats').then(r => r.data),
  updateApplicability: (id: string, data: unknown) => apiClient.put('/soa/api/soa/' + id + '/applicability', data).then(r => r.data),
  updateImplementation: (id: string, data: unknown) => apiClient.put('/soa/api/soa/' + id + '/implementation', data).then(r => r.data),
};

export const ncApi = {
  getAll: (params?: { status?: string; severity?: string }) =>
    apiClient.get('/nonconformity/api/nonconformities', { params }).then(r => r.data),
  getById: (id: string) =>
    apiClient.get('/nonconformity/api/nonconformities/' + id).then(r => r.data),
  raise: (data: unknown) =>
    apiClient.post('/nonconformity/api/nonconformities', data).then(r => r.data),
  update: (id: string, data: unknown) =>
    apiClient.put('/nonconformity/api/nonconformities/' + id, data).then(r => r.data),
  delete: (id: string) =>
    apiClient.delete('/nonconformity/api/nonconformities/' + id).then(r => r.data),
  recordRca: (id: string, data: unknown) =>
    apiClient.post('/nonconformity/api/nonconformities/' + id + '/rca', data).then(r => r.data),
  addCorrectiveAction: (id: string, data: unknown) =>
    apiClient.post('/nonconformity/api/nonconformities/' + id + '/corrective-actions', data).then(r => r.data),
  updateCorrectiveAction: (id: string, caId: string, data: unknown) =>
    apiClient.put('/nonconformity/api/nonconformities/' + id + '/corrective-actions/' + caId, data).then(r => r.data),
  markImplemented: (id: string, caId: string, data: unknown) =>
    apiClient.post('/nonconformity/api/nonconformities/' + id + '/corrective-actions/' + caId + '/implement', data).then(r => r.data),
  close: (id: string, data: unknown) =>
    apiClient.post('/nonconformity/api/nonconformities/' + id + '/close', data).then(r => r.data),
};

export const assetApi = {
  getAll: (params?: { type?: string; status?: string; riskRating?: string; customerId?: string }) =>
    apiClient.get('/asset/api/assets', { params }).then(r => r.data),
  getById: (id: string) =>
    apiClient.get('/asset/api/assets/' + id).then(r => r.data),
  getStats: (customerId?: string) =>
    apiClient.get('/asset/api/assets/stats', { params: customerId ? { customerId } : undefined }).then(r => r.data),
  getCustomers: () =>
    apiClient.get('/asset/api/assets/customers').then(r => r.data),
  create: (data: unknown) =>
    apiClient.post('/asset/api/assets', data).then(r => r.data),
  update: (id: string, data: unknown) =>
    apiClient.put('/asset/api/assets/' + id, data).then(r => r.data),
  delete: (id: string) =>
    apiClient.delete('/asset/api/assets/' + id).then(r => r.data),
};

export const incidentApi = {
  getAll: (params?: { type?: string; status?: string; severity?: string; customerId?: string }) =>
    apiClient.get('/incident/api/incidents', { params }).then(r => r.data),
  getById: (id: string) =>
    apiClient.get('/incident/api/incidents/' + id).then(r => r.data),
  getStats: (customerId?: string) =>
    apiClient.get('/incident/api/incidents/stats', { params: customerId ? { customerId } : undefined }).then(r => r.data),
  getCustomers: () =>
    apiClient.get('/incident/api/incidents/customers').then(r => r.data),
  report: (data: unknown) =>
    apiClient.post('/incident/api/incidents', data).then(r => r.data),
  update: (id: string, data: unknown) =>
    apiClient.put('/incident/api/incidents/' + id, data).then(r => r.data),
  delete: (id: string) =>
    apiClient.delete('/incident/api/incidents/' + id).then(r => r.data),
  investigate: (id: string, data: unknown) =>
    apiClient.post('/incident/api/incidents/' + id + '/investigate', data).then(r => r.data),
  contain: (id: string, data: unknown) =>
    apiClient.post('/incident/api/incidents/' + id + '/contain', data).then(r => r.data),
  resolve: (id: string, data: unknown) =>
    apiClient.post('/incident/api/incidents/' + id + '/resolve', data).then(r => r.data),
  close: (id: string, data: unknown) =>
    apiClient.post('/incident/api/incidents/' + id + '/close', data).then(r => r.data),
  addAction: (id: string, data: unknown) =>
    apiClient.post('/incident/api/incidents/' + id + '/actions', data).then(r => r.data),
  updateAction: (id: string, actionId: string, data: unknown) =>
    apiClient.put('/incident/api/incidents/' + id + '/actions/' + actionId, data).then(r => r.data),
  completeAction: (id: string, actionId: string, data: unknown) =>
    apiClient.post('/incident/api/incidents/' + id + '/actions/' + actionId + '/complete', data).then(r => r.data),
  recordReview: (id: string, data: unknown) =>
    apiClient.post('/incident/api/incidents/' + id + '/review', data).then(r => r.data),
};
