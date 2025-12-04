export const base64UrlToUint8Array = (value, label = 'value') => {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (value instanceof Uint8Array) {
    return value;
  }

  if (value?.type === 'Buffer' && Array.isArray(value.data)) {
    return new Uint8Array(value.data);
  }

  if (typeof value !== 'string') {
    throw new Error(`Invalid WebAuthn ${label}: expected a base64url string or byte array`);
  }

  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return Uint8Array.from(atob(normalized), (c) => c.charCodeAt(0));
  } catch (error) {
    throw new Error(`Invalid WebAuthn ${label}: unable to decode base64url string`);
  }
};

export const uint8ArrayToBase64Url = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const prepareCreationOptions = (options) => ({
  ...options,
  challenge: base64UrlToUint8Array(options?.challenge, 'registration challenge'),
  user: {
    ...options?.user,
    id: base64UrlToUint8Array(options?.user?.id, 'user id')
  },
  excludeCredentials: (options?.excludeCredentials || []).map((cred) => ({
    ...cred,
    id: base64UrlToUint8Array(cred.id, 'credential id')
  }))
});

export const prepareRequestOptions = (options) => ({
  ...options,
  challenge: base64UrlToUint8Array(options?.challenge, 'authentication challenge'),
  allowCredentials: (options?.allowCredentials || []).map((cred) => ({
    ...cred,
    id: base64UrlToUint8Array(cred.id, 'credential id')
  }))
});
