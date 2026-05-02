const AUTH_KEY = "dl-auth";
const SECRET = import.meta.env.VITE_API_SECRET;

export function login(password) {
  if (!SECRET || password !== SECRET) return false;
  sessionStorage.setItem(AUTH_KEY, "1");
  return true;
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}
