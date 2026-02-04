import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock dependencies
const mockAttestationRecordDb = {
    getById: jest.fn(),
    update: jest.fn()
};

const mockAttestationCampaignDb = {
    getById: jest.fn(),
};

const mockAttestationNewAssetDb = {
    getByRecordId: jest.fn() // Return empty array safely
};

const mockUserDb = {
    getById: jest.fn(),
    getByRole: jest.fn()
};

const mockAuditDb = {
    log: jest.fn()
};

const mockSmtpMailer = {
    sendAttestationCompleteAdminNotification: jest.fn()
};

// Mock the services/smtpMailer module using unstable_mockModule because it's imported dynamically in the route
jest.unstable_mockModule('./services/smtpMailer.js', () => mockSmtpMailer);

// Import the router factory (using dynamic import to ensure mocks are applied)
const { default: createAttestationRouter } = await import('./routes/attestation.js');

describe('Attestation Notification Tests', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Express app
        app = express();
        app.use(express.json());

        // Mock middleware
        const mockAuthenticate = (req, res, next) => {
            req.user = { id: 'current-user-id', email: 'user@example.com', first_name: 'Test', last_name: 'User' };
            next();
        };
        const mockAuthorize = () => (req, res, next) => next();

        // Create router with mocked deps
        const router = createAttestationRouter({
            attestationRecordDb: mockAttestationRecordDb,
            attestationCampaignDb: mockAttestationCampaignDb,
            attestationNewAssetDb: mockAttestationNewAssetDb,
            attestationAssetDb: {}, // Not used in this specific path
            attestationPendingInviteDb: {},
            userDb: mockUserDb,
            assetDb: {},
            companyDb: {},
            auditDb: mockAuditDb,
            oidcSettingsDb: {},
            authenticate: mockAuthenticate,
            authorize: mockAuthorize,
            sanitizeDateValue: (v) => v
        });

        app.use('/api/attestation', router);
    });

    it('should send notification to campaign creator on completion', async () => {
        const recordId = 'record-123';
        const campaignId = 'campaign-123';
        const creatorId = 'creator-456';
        const creatorEmail = 'creator@example.com';

        // Mock Record
        mockAttestationRecordDb.getById.mockResolvedValue({
            id: recordId,
            campaign_id: campaignId,
            user_id: 'current-user-id', // Matches req.user.id
            status: 'in_progress'
        });

        // Mock Campaign
        mockAttestationCampaignDb.getById.mockResolvedValue({
            id: campaignId,
            name: 'Test Campaign',
            created_by: creatorId
        });

        // Mock New Assets (empty)
        mockAttestationNewAssetDb.getByRecordId.mockResolvedValue([]);

        // Mock User Lookup (Creator)
        mockUserDb.getById.mockImplementation((id) => {
            if (id === creatorId) {
                return Promise.resolve({ id: creatorId, email: creatorEmail });
            }
            return Promise.resolve(null);
        });

        const response = await request(app)
            .post(`/api/attestation/records/${recordId}/complete`)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify creator lookup
        expect(mockUserDb.getById).toHaveBeenCalledWith(creatorId);

        // Verify Notification Sent to Creator
        expect(mockSmtpMailer.sendAttestationCompleteAdminNotification).toHaveBeenCalledWith(
            [creatorEmail], // Recipients array
            expect.any(String), // Employee Name
            'user@example.com', // Employee Email
            expect.objectContaining({ id: campaignId })
        );
    });

    it('should fallback to all admins if creator is not found', async () => {
        const recordId = 'record-456';
        const campaignId = 'campaign-789';
        const missingCreatorId = 'deleted-user';
        const adminEmail = 'admin@example.com';

        // Mock Record
        mockAttestationRecordDb.getById.mockResolvedValue({
            id: recordId,
            campaign_id: campaignId,
            user_id: 'current-user-id',
            status: 'in_progress'
        });

        // Mock Campaign
        mockAttestationCampaignDb.getById.mockResolvedValue({
            id: campaignId,
            name: 'Fallback Campaign',
            created_by: missingCreatorId
        });

        mockAttestationNewAssetDb.getByRecordId.mockResolvedValue([]);

        // Mock User Lookup (Creator missing)
        mockUserDb.getById.mockResolvedValue(null);

        // Mock Admin Lookup (Fallback)
        mockUserDb.getByRole.mockResolvedValue([
            { email: adminEmail }
        ]);

        const response = await request(app)
            .post(`/api/attestation/records/${recordId}/complete`)
            .send();

        expect(response.status).toBe(200);

        // Verify Fallback logic
        expect(mockUserDb.getByRole).toHaveBeenCalledWith('admin');
        expect(mockSmtpMailer.sendAttestationCompleteAdminNotification).toHaveBeenCalledWith(
            [adminEmail],
            expect.any(String),
            expect.any(String),
            expect.anything()
        );
    });
});
