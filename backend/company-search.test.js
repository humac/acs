/**
 * Company Search API Tests
 * Tests for the /api/companies/search endpoint
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { companyDb, assetDb } from './database.js';

// Initialize database before all tests
beforeAll(async () => {
    await assetDb.init();
});

// Simple mock authentication middleware
const mockAuth = (req, res, next) => {
    req.user = { id: 1, email: 'test@example.com', role: 'admin' };
    next();
};

// Create test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Mock the search endpoint
    app.get('/api/companies/search', mockAuth, async (req, res) => {
        try {
            const { q = '', limit = '20' } = req.query;
            const maxLimit = Math.min(parseInt(limit) || 20, 50);
            const companies = await companyDb.search(q, maxLimit);
            res.json(companies);
        } catch (error) {
            res.status(500).json({ error: 'Failed to search companies' });
        }
    });

    return app;
};

describe('Company Search API', () => {
    let app;
    let testCompanyIds = [];

    beforeAll(async () => {
        app = createTestApp();

        // Create test companies
        // Create test companies with unique prefix to avoid interference
        const prefix = `UnitSearchTest-${Date.now()}`;
        const testCompanies = [
            { name: `${prefix} Alpha Corp`, description: 'Test company A' },
            { name: `${prefix} Beta Inc`, description: 'Test company B' },
            { name: `${prefix} Gamma LLC`, description: 'Test company C' },
            { name: `Acme Industries ${Date.now()}`, description: 'Different name' },
        ];

        for (const company of testCompanies) {
            const result = await companyDb.create(company);
            company.id = result.id; // Store ID for potential verification
            testCompanyIds.push(result.id);
        }
    });

    afterAll(async () => {
        // Clean up test companies
        for (const id of testCompanyIds) {
            try {
                await companyDb.delete(id);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    describe('GET /api/companies/search', () => {
        test('should return companies matching query', async () => {
            const response = await request(app)
                .get('/api/companies/search')
                .query({ q: 'UnitSearchTest' });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body.every(c => c.name.toLowerCase().includes('unitsearchtest'))).toBe(true);
        });

        test('should return all companies when query is empty', async () => {
            const response = await request(app)
                .get('/api/companies/search')
                .query({ q: '' });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('should respect limit parameter', async () => {
            const response = await request(app)
                .get('/api/companies/search')
                .query({ q: '', limit: '2' });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeLessThanOrEqual(2);
        });

        test('should cap limit at 50', async () => {
            const response = await request(app)
                .get('/api/companies/search')
                .query({ q: '', limit: '100' });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeLessThanOrEqual(50);
        });

        test('should handle case-insensitive search', async () => {
            const response = await request(app)
                .get('/api/companies/search')
                .query({ q: 'UnitSearchTest' });

            expect(response.status).toBe(200);

            const upperResponse = await request(app)
                .get('/api/companies/search')
                .query({ q: 'UNITSEARCHTEST' });

            expect(upperResponse.status).toBe(200);
            expect(upperResponse.body.length).toBe(response.body.length);
        });

        test('should return empty array for no matches', async () => {
            const response = await request(app)
                .get('/api/companies/search')
                .query({ q: 'xyznonexistent123456' });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        test('should return companies with id and name fields', async () => {
            const response = await request(app)
                .get('/api/companies/search')
                .query({ q: 'UnitSearchTest', limit: '1' });

            expect(response.status).toBe(200);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('id');
                expect(response.body[0]).toHaveProperty('name');
            }
        });
    });
});

describe('companyDb.search', () => {
    let testCompanyId;

    beforeAll(async () => {
        const result = await companyDb.create({
            name: `SearchTest Company ${Date.now()}`,
            description: 'For testing search'
        });
        testCompanyId = result.id;
    });

    afterAll(async () => {
        if (testCompanyId) {
            try {
                await companyDb.delete(testCompanyId);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    test('should search companies by name', async () => {
        const results = await companyDb.search('SearchTest');
        expect(Array.isArray(results)).toBe(true);
        expect(results.some(c => c.id === testCompanyId)).toBe(true);
    });

    test('should respect limit parameter', async () => {
        const results = await companyDb.search('', 5);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(5);
    });

    test('should use default limit of 20', async () => {
        const results = await companyDb.search('');
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(20);
    });
});
