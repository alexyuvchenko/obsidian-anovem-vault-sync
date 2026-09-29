const APP_KEY = /^[A-Za-z0-9]{15}$/;

export function normalizeAppKey(value: string): string {
  const token = value
    .trim()
    .split(/\s+/)
    .find((part) => APP_KEY.test(part));
  if (!token) {
    throw new Error(
      "Paste only the Dropbox App key. It is 15 characters, shown next to App secret. Do not paste the App secret or a generated access token.",
    );
  }
  return token;
}
