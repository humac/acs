import { API_BASE } from './constants.js';

/**
 * Lightweight API client for E2E test seeding and direct API assertions.
 * Uses native fetch — no external dependencies.
 */
export class ApiClient {
  constructor(token = null) {
    this.token = token;
  }

  /** Build headers with optional auth */
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  async _request(method, path, body) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      method,
      headers: this._headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, body: json };
  }

  get(path) { return this._request('GET', path); }
  post(path, body) { return this._request('POST', path, body); }
  put(path, body) { return this._request('PUT', path, body); }
  patch(path, body) { return this._request('PATCH', path, body); }
  delete(path) { return this._request('DELETE', path); }

  /** Register a new user and return { token, user } */
  async register(userData) {
    const res = await this.post('/api/auth/register', userData);
    if (!res.ok) throw new Error(`Registration failed for ${userData.email}: ${JSON.stringify(res.body)}`);
    return res.body;
  }

  /** Login and return { token, user } */
  async login(email, password) {
    const res = await this.post('/api/auth/login', { email, password });
    if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
    return res.body;
  }

  /** Create a company (requires admin token) */
  async createCompany(data) {
    const res = await this.post('/api/companies', data);
    if (!res.ok) throw new Error(`Company creation failed: ${JSON.stringify(res.body)}`);
    return res.body.company;
  }

  /** Update a user's role (requires admin token) */
  async setUserRole(userId, role) {
    const res = await this.put(`/api/auth/users/${userId}/role`, { role });
    if (!res.ok) throw new Error(`Role update failed for user ${userId}: ${JSON.stringify(res.body)}`);
    return res.body;
  }

  /** Create an asset (requires auth token) */
  async createAsset(data) {
    const res = await this.post('/api/assets', data);
    if (!res.ok) throw new Error(`Asset creation failed: ${JSON.stringify(res.body)}`);
    return res.body.asset;
  }

  /** Get all users (requires admin/manager token) */
  async getUsers() {
    const res = await this.get('/api/auth/users');
    if (!res.ok) throw new Error(`Get users failed: ${JSON.stringify(res.body)}`);
    return res.body;
  }

  /** Get all assets */
  async getAssets() {
    const res = await this.get('/api/assets');
    if (!res.ok) throw new Error(`Get assets failed: ${JSON.stringify(res.body)}`);
    // Backend returns array directly, or { assets: [...] } depending on endpoint
    return Array.isArray(res.body) ? res.body : res.body.assets;
  }

  /** Get all companies */
  async getCompanies() {
    const res = await this.get('/api/companies');
    if (!res.ok) throw new Error(`Get companies failed: ${JSON.stringify(res.body)}`);
    return res.body;
  }

  /** Delete a user by ID */
  async deleteUser(userId) {
    return this.delete(`/api/auth/users/${userId}`);
  }

  /** Delete an asset by ID */
  async deleteAsset(assetId) {
    return this.delete(`/api/assets/${assetId}`);
  }

  /** Delete a company by ID */
  async deleteCompany(companyId) {
    return this.delete(`/api/companies/${companyId}`);
  }

  /** Create an OIDC user without manager data (E2E only, requires admin token) */
  async createOIDCUser(userData) {
    const res = await this.post('/api/auth/e2e/create-oidc-user', userData);
    if (!res.ok) throw new Error(`OIDC user creation failed: ${JSON.stringify(res.body)}`);
    return res.body;
  }
}
