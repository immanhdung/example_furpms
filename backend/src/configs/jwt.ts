export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_change_in_production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_change_in_production',
  accessExpiresIn: parseInt(process.env.JWT_ACCESS_EXPIRY || '86400', 10),
  refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRY || '604800', 10),
};
