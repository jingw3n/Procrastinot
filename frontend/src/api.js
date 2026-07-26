const API_URL = "https://procrastinot-wnj2.onrender.com";

export function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  }).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return res;
  });
}

export default API_URL;