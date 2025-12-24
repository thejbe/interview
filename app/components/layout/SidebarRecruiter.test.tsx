import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarRecruiter } from './SidebarRecruiter';
import { vi, describe, it, expect } from 'vitest';

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
    usePathname: () => '/recruiter/dashboard',
    useRouter: () => ({ push: vi.fn() }),
}));

// Mock server action
vi.mock('@/app/recruiter/actions', () => ({
    signOut: vi.fn(),
}));

describe('SidebarRecruiter', () => {
    const adminUser = {
        name: 'Admin User',
        role: 'admin',
        avatar_url: 'http://test.com/avatar.jpg',
        email: 'admin@test.com'
    };

    const memberUser = {
        name: 'Member User',
        role: 'member',
        avatar_url: null,
        email: 'member@test.com'
    };

    it('renders user details correctly', () => {
        render(<SidebarRecruiter user={adminUser} />);
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('shows Team Settings link for Admin', () => {
        render(<SidebarRecruiter user={adminUser} />);

        // Open user menu
        const userButton = screen.getByText('Admin User').closest('button');
        fireEvent.click(userButton!);

        // Expect link to be present
        expect(screen.getByText('Team Settings')).toBeInTheDocument();
        expect(screen.getByText('Team Settings').closest('a')).toHaveAttribute('href', '/recruiter/settings/team');
    });

    it('does NOT show Team Settings link for Member', () => {
        render(<SidebarRecruiter user={memberUser} />);

        // Open user menu
        const userButton = screen.getByText('Member User').closest('button');
        fireEvent.click(userButton!);

        // Expect link to be absent
        expect(screen.queryByText('Team Settings')).not.toBeInTheDocument();
        // Profile should still be there
        expect(screen.getByText('Profile')).toBeInTheDocument();
    });
});
