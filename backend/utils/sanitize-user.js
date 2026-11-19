/**
 * Strip credential and secret fields from a user row before it leaves the API.
 *
 * userDb methods return full `SELECT *` rows, which include the password hash,
 * TOTP secret, backup codes, and OIDC subject. None of these may ever be sent
 * to a client, regardless of the caller's role.
 */

export const SENSITIVE_USER_FIELDS = Object.freeze([
  'password_hash',
  'mfa_secret',
  'mfa_backup_codes',
  'oidc_sub'
]);

export const sanitizeUser = (user) => {
  if (!user || typeof user !== 'object') {
    return user;
  }
  const safe = { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete safe[field];
  }
  return safe;
};
