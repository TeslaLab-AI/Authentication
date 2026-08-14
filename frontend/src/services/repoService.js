import api from './axiosInstance.js';

export async function connectRepo(payload) {
  const response = await api.post('repos/connect', payload);
  return response.data;
}

export async function getRepos() {
  const response = await api.get('repos/my-repos');
  return response.data;
}

export async function queueScan(repositoryId, repoUrl) {
  const response = await api.post('repos/queue-scan', { repositoryId, repoUrl });
  return response.data;
}

export async function deleteRepo(id) {
  const response = await api.delete(`repos/${id}`);
  return response.data;
}
