const API_URL = import.meta.env.VITE_API_URL;

const UNAUTHENTICATED_ERRORS = ['unauthenticated', 'invalid_token', 'expired', 'revoked'];

export async function callApi(action, payload = {}) {
  const token = localStorage.getItem('cashtoken_session');

  const body = { action, ...payload };
  if (token) {
    body.token = token;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.ok === false && UNAUTHENTICATED_ERRORS.includes(data.error)) {
    localStorage.clear();
    window.location.href = '/login';
    return data;
  }

  return data;
}
