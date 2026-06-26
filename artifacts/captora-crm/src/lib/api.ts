export function getToken(): string | null {
  return localStorage.getItem('captora_token');
}

export function setToken(token: string) {
  localStorage.setItem('captora_token', token);
}

export function clearToken() {
  localStorage.removeItem('captora_token');
}
