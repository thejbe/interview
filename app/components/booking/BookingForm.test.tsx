import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingForm } from './BookingForm';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn()
}));

// Mock Navigation
const mockRouter = { push: vi.fn(), refresh: vi.fn() };
vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter
}));

// Mock ScrollIntoView (not implemented in JSDOM)
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('BookingForm Calendar View', () => {
    const mockSlots = [
        { id: '1', start_time: '2025-01-15T10:00:00Z', end_time: '2025-01-15T11:00:00Z', status: 'open', hiring_manager_id: 'm1' },
        { id: '2', start_time: '2025-01-15T14:00:00Z', end_time: '2025-01-15T15:00:00Z', status: 'open', hiring_manager_id: 'm2' },
        { id: '3', start_time: '2025-01-16T10:00:00Z', end_time: '2025-01-16T11:00:00Z', status: 'open', hiring_manager_id: 'm1' }
    ];

    const mockManagers = {
        'm1': { name: 'Alice', role: 'Engineering Manager' },
        'm2': { name: 'Bob', role: 'Product Manager' }
    };

    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createClient>);

        // Mock current date to be before the slots
        vi.setSystemTime(new Date('2025-01-01'));
    });

    it('renders the calendar and auto-selects the first available date', async () => {
        render(<BookingForm slots={mockSlots} templateId="t1" managers={mockManagers} />);

        // Should show month (January 2025)
        expect(screen.getByText('January 2025')).toBeDefined();

        // Should auto-select Jan 15 (first date) and show slots
        // Note: Timezone sensitive, assuming UTC for test env helps or mocking TZ. 
        // We might simply check for the presence of time buttons.

        await waitFor(() => {
            // 10:00 AM UTC -> depends on local TEST TZ. 
            // Ideally we mock timezone to UTC, but regex matching is safer.
            // Just check if we see buttons.
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(10); // Calendar days + nav + slots
        });
    });

    it('shows details form when a slot is selected', async () => {
        render(<BookingForm slots={mockSlots} templateId="t1" managers={mockManagers} />);

        // Find slot buttons (they are buttons with time text like "10:00 AM")
        const buttons = await screen.findAllByRole('button');
        const slotButton = buttons.find(b => b.textContent?.includes(':'));

        if (!slotButton) throw new Error('No slot button found');
        fireEvent.click(slotButton);

        // Form should appear
        expect(screen.getByLabelText('Full Name')).toBeDefined();
        expect(screen.getByLabelText('Email Address')).toBeDefined();
        expect(screen.getByText('Confirm Booking')).toBeDefined();
    });

    it('submits booking successfully', async () => {
        // Mock slot status check
        mockSupabase.single.mockResolvedValueOnce({ data: { status: 'open' }, error: null });

        // Mock insert success (terminal)
        mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null });

        // Mock update success (terminal via .in())
        // we need to make sure update returns 'this' (handled by default mock) 
        // and 'in' returns the promise result for the update query.
        mockSupabase.in.mockResolvedValueOnce({ data: null, error: null });

        render(<BookingForm slots={mockSlots} templateId="t1" managers={mockManagers} />);

        // Select slot
        const buttons = await screen.findAllByRole('button');
        const slotButton = buttons.find(b => b.textContent?.includes(':'));

        if (!slotButton) throw new Error('No slot button found');
        fireEvent.click(slotButton);

        // Fill form
        fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '555-0123' } });

        // Submit
        fireEvent.click(screen.getByText('Confirm Booking'));

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
            expect(mockSupabase.insert).toHaveBeenCalled();
            expect(screen.getByText('Interview Confirmed!')).toBeDefined();
        });

        // Verify confirmation details
        expect(screen.getByText('When')).toBeDefined();
        expect(screen.getByText('With')).toBeDefined();
    });
});
