import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientForm } from './ClientForm';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Hoist mocks to ensure they are available before imports and initialized correctly
const { mockSupabase, mockPush, mockRefresh } = vi.hoisted(() => {
    // Helper to create chain builder
    const createChain = () => {
        const chain = {
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
        };
        // Fix chaining return values
        chain.insert.mockReturnValue(chain);
        chain.update.mockReturnValue(chain);
        chain.delete.mockReturnValue(chain);
        chain.eq.mockReturnValue(chain);
        return chain;
    };

    return {
        mockSupabase: {
            from: vi.fn(() => createChain()),
        },
        mockPush: vi.fn(),
        mockRefresh: vi.fn(),
    };
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
    }),
}));

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => mockSupabase,
}));

describe('ClientForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset window.history mock
        vi.spyOn(window.history, 'replaceState').mockImplementation(() => { });
        vi.spyOn(window, 'alert').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders correctly in create mode', () => {
        render(<ClientForm mode="create" />);
        expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
        expect(screen.getByText('Save Client')).toBeInTheDocument();
        expect(screen.queryByText('Departments')).not.toBeInTheDocument();
    });

    it('renders correctly in edit mode with initial data', () => {
        const initialData = { id: '123', name: 'Test Corp', active: true };
        render(<ClientForm mode="edit" initialData={initialData} />);
        expect(screen.getByDisplayValue('Test Corp')).toBeInTheDocument();
        expect(screen.getByText('Departments')).toBeInTheDocument();
    });

    it('creates a client and default department correctly', async () => {
        const companyData = { id: 'c1', name: 'New Co', active: true };
        const deptData = { id: 'd1', company_id: 'c1', name: 'Default' };

        // Setup mock chains using the hoisted mockSupabase
        // We create specific chains for this test
        const companyChain = {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: companyData, error: null })
        };
        // Fix chain calling itself
        companyChain.insert.mockReturnValue(companyChain as any);
        companyChain.select.mockReturnValue(companyChain as any);

        const deptChain = {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: deptData, error: null })
        };
        deptChain.insert.mockReturnValue(deptChain as any);
        deptChain.select.mockReturnValue(deptChain as any);

        // Cast to any to avoid strict type error
        (mockSupabase.from as any).mockImplementation((table: any) => {
            if (table === 'companies') return companyChain;
            if (table === 'departments') return deptChain;
            return { select: vi.fn().mockReturnThis() };
        });

        render(<ClientForm mode="create" />);

        // Fill form
        fireEvent.change(screen.getByLabelText(/Company Name/i), { target: { value: 'New Co' } });

        // Submit
        const form = screen.getByRole('button', { name: 'Save Client' }).closest('form');
        if (!form) throw new Error('Form not found');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('companies');
            expect(companyChain.insert).toHaveBeenCalledWith({ name: 'New Co', active: true });

            expect(mockSupabase.from).toHaveBeenCalledWith('departments');
            expect(deptChain.insert).toHaveBeenCalledWith({ company_id: 'c1', name: 'Default' });

            expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/recruiter/clients/c1');
            expect(screen.getByText('Departments')).toBeInTheDocument();
        });
    });

    it('adds a new department', async () => {
        const initialData = { id: '123', name: 'Test Corp', active: true };
        const newDept = { id: 'd2', name: 'Engineering', company_id: '123' };

        const deptChain = {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newDept, error: null }),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis()
        };
        deptChain.insert.mockReturnValue(deptChain as any);
        // ... fix others if needed, mostly used insert here

        (mockSupabase.from as any).mockImplementation((table: any) => {
            if (table === 'departments') return deptChain;
            return {};
        });

        render(<ClientForm mode="edit" initialData={initialData} />);

        fireEvent.click(screen.getByText('Add Department'));
        fireEvent.change(screen.getByPlaceholderText('Department Name'), { target: { value: 'Engineering' } });
        fireEvent.click(screen.getByText('Add'));

        await waitFor(() => {
            expect(deptChain.insert).toHaveBeenCalledWith({ company_id: '123', name: 'Engineering' });
            expect(screen.getByText('Engineering')).toBeInTheDocument();
        });
    });

    it('edits an existing department', async () => {
        const initialData = { id: '123', name: 'Test Corp', active: true };
        const initialDepartments = [{ id: 'd1', name: 'Sales', company_id: '123' }];

        const deptChain = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(), // Needed if component refreshes list, though current impl updates locally
        };
        deptChain.update.mockReturnValue(deptChain as any);
        deptChain.eq.mockReturnValue(deptChain as any);

        (mockSupabase.from as any).mockImplementation((table: any) => {
            if (table === 'departments') return deptChain;
            return {};
        });

        render(<ClientForm mode="edit" initialData={initialData} initialDepartments={initialDepartments} />);

        // Click Edit
        fireEvent.click(screen.getByText('Edit'));

        // Change value
        const input = screen.getByDisplayValue('Sales');
        fireEvent.change(input, { target: { value: 'Global Sales' } });

        // Save
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('departments');
            expect(deptChain.update).toHaveBeenCalledWith({ name: 'Global Sales' });
            expect(deptChain.eq).toHaveBeenCalledWith('id', 'd1');
            expect(screen.getByText('Global Sales')).toBeInTheDocument();
        });
    });
});
