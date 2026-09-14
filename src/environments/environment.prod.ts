export const environment = {
  production: true,
  // Vercel proxies /api to Render so auth cookies remain first-party.
  // Services append their own /api path, so the base must remain empty.
  apiUrl: '',
};

