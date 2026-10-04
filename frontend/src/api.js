async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'The request failed');
  }
  return data;
}

export const api = {
  list() {
    return request('/api/tasks');
  },
  create(body) {
    return request('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
  },
  update(id, body) {
    return request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  },
  remove(id) {
    return request(`/api/tasks/${id}`, { method: 'DELETE' });
  },
};
