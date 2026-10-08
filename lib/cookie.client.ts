// Client-side cookie utilities. Server actions handle cookie updates on the server side.

export function setClientCookie(key: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${key}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getClientCookie(key: string) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${key}=`))
    ?.split("=")[1];
}
