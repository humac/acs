import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AttestationCampaignTableRow from './AttestationCampaignTableRow';
import React from 'react';

describe('AttestationCampaignTableRow', () => {
    const mockCampaign = {
        id: 1,
        name: 'Test Campaign',
        description: 'Test Description',
        status: 'active',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        creator_name: 'Test Creator'
    };

    const mockStats = {
        total: 10,
        completed: 5
    };

    const defaultProps = {
        campaign: mockCampaign,
        stats: mockStats,
        isSelected: false,
        canManage: true,
        onToggleSelect: vi.fn(),
        onStart: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onCancel: vi.fn(),
        onViewDashboard: vi.fn(),
        onExport: vi.fn(),
    };

    it('should render campaign name', () => {
        render(
            <table>
                <tbody>
                    <AttestationCampaignTableRow {...defaultProps} />
                </tbody>
            </table>
        );
        expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });

    it('should display "Created By" when expanded', () => {
        render(
            <table>
                <tbody>
                    <AttestationCampaignTableRow {...defaultProps} />
                </tbody>
            </table>
        );

        // Find expand button (using aria-label from component)
        const expandButton = screen.getByLabelText('Expand details');
        fireEvent.click(expandButton);

        // Check for creator name
        expect(screen.getByText('Test Creator')).toBeInTheDocument();
        expect(screen.getByText('Created by:')).toBeInTheDocument();
    });

    it('should display "System" as creator fallback', () => {
        const campaignWithoutCreator = { ...mockCampaign, creator_name: null };
        render(
            <table>
                <tbody>
                    <AttestationCampaignTableRow {...defaultProps} campaign={campaignWithoutCreator} />
                </tbody>
            </table>
        );

        const expandButton = screen.getByLabelText('Expand details');
        fireEvent.click(expandButton);

        expect(screen.getByText('System')).toBeInTheDocument();
    });
});
