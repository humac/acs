export const base64UrlToUint8Array = (value) => {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (value instanceof Uint8Array) {
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error('Invalid WebAuthn value: expected a base64url string or byte array');
  }

  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
};

export const uint8ArrayToBase64Url = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const prepareCreationOptions = (options) => ({
  ...options,
  challenge: base64UrlToUint8Array(options?.challenge),
  user: {
    ...options?.user,
    id: base64UrlToUint8Array(options?.user?.id)
  },
  excludeCredentials: (options?.excludeCredentials || []).map((cred) => ({
    ...cred,
    id: base64UrlToUint8Array(cred.id)
  }))
});

export const prepareRequestOptions = (options) => ({
  ...options,
  challenge: base64UrlToUint8Array(options?.challenge),
  allowCredentials: (options?.allowCredentials || []).map((cred) => ({
    ...cred,
    id: base64UrlToUint8Array(cred.id)
  }))
});
