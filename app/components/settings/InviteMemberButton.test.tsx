import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteMemberButton } from './InviteMemberButton';
import { inviteUser } from '@/app/recruiter/actions';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the server action
vi.mock('@/app/recruiter/actions', () => ({
    inviteUser: vi.fn(),
}));

describe('InviteMemberButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<InviteMemberButton />);
        expect(screen.getByText('Invite Member')).toBeInTheDocument();
    });

    it('opens modal on click', () => {
        render(<InviteMemberButton />);
        fireEvent.click(screen.getByText('Invite Member'));
        expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Addresses/i)).toBeInTheDocument();
    });

    it('handles single email invite success', async () => {
        (inviteUser as any).mockResolvedValue({ success: true, message: 'Sent' });

        render(<InviteMemberButton />);
        fireEvent.click(screen.getByText('Invite Member'));

        const input = screen.getByLabelText(/Email Addresses/i);
        fireEvent.change(input, { target: { value: 'test@example.com' } });

        fireEvent.click(screen.getByText('Send Invite'));

        await waitFor(() => {
            expect(inviteUser).toHaveBeenCalledWith('test@example.com', 'member');
            expect(screen.getByText(/Invitation\(s\) Sent!/i)).toBeInTheDocument();
        });
    });

    it('handles bulk comma-separated emails', async () => {
        (inviteUser as any).mockResolvedValue({ success: true, message: 'Sent' });

        render(<InviteMemberButton />);
        fireEvent.click(screen.getByText('Invite Member'));

        const input = screen.getByLabelText(/Email Addresses/i);
        fireEvent.change(input, { target: { value: 'alice@example.com, bob@example.com, charlie@example.com ' } });

        fireEvent.click(screen.getByText('Send Invite'));

        await waitFor(() => {
            expect(inviteUser).toHaveBeenCalledTimes(3);
            expect(inviteUser).toHaveBeenCalledWith('alice@example.com', 'member');
            expect(inviteUser).toHaveBeenCalledWith('bob@example.com', 'member');
            expect(inviteUser).toHaveBeenCalledWith('charlie@example.com', 'member');
            expect(screen.getByText(/Invitation\(s\) Sent!/i)).toBeInTheDocument();
        });
    });

    it('handles mixed success/failure', async () => {
        // First call succeeds, second fails
        (inviteUser as any)
            .mockResolvedValueOnce({ success: true })
            .mockResolvedValueOnce({ success: false, message: 'Already registered' });

        render(<InviteMemberButton />);
        fireEvent.click(screen.getByText('Invite Member'));

        fireEvent.change(screen.getByLabelText(/Email Addresses/i), { target: { value: 'good@test.com, bad@test.com' } });
        fireEvent.click(screen.getByText('Send Invite'));

        await waitFor(() => {
            expect(screen.getByText(/Sent 1 invites. Failed: bad@test.com: Already registered/i)).toBeInTheDocument();
        });
    });
});
