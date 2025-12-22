import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateForm } from './TemplateForm';

// Mock useRouter
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: refreshMock,
    }),
}));

// Mock Supabase
const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const eqMock = vi.fn();
const singleMock = vi.fn();

const supabaseMock = {
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn(() => ({
        select: selectMock,
        insert: insertMock,
        update: updateMock,
        delete: deleteMock,
        eq: eqMock,
        single: singleMock,
    })),
};

vi.mock('@/lib/supabase/client', () => ({
    createClient: () => supabaseMock,
}));

// Mock Data
const companies = [
    { id: 'c1', name: 'Company A', company_id: 'c1' },
    { id: 'c2', name: 'Company B', company_id: 'c2' },
];

const departments = [
    { id: 'd1', name: 'Default', company_id: 'c1' },
    { id: 'd2', name: 'Engineering', company_id: 'c1' },
    { id: 'd3', name: 'Sales', company_id: 'c2' },
];

const managers = [
    { id: 'm1', name: 'Alice', email: 'alice@a.com', role: 'Eng Mgr', company_id: 'c1', department_id: 'd1' },
    { id: 'm2', name: 'Bob', email: 'bob@a.com', role: 'Senior Eng', company_id: 'c1', department_id: 'd2' },
    { id: 'm3', name: 'Charlie', email: 'charlie@b.com', role: 'Sales Mgr', company_id: 'c2', department_id: 'd3' },
];

describe('TemplateForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mocks chain
        selectMock.mockReturnThis();
        eqMock.mockReturnThis();
        singleMock.mockResolvedValue({ data: { id: 'template-new' }, error: null });
        insertMock.mockReturnThis();
        updateMock.mockReturnThis();
        deleteMock.mockReturnThis();
    });

    it('renders correctly and selects default department', () => {
        render(
            <TemplateForm
                mode="create"
                companies={companies}
                managers={managers}
                departments={departments}
            />
        );

        // Check Company Default Selection (first one)
        const companySelect = screen.getByTitle('Company') as HTMLSelectElement;
        expect(companySelect.value).toBe('c1');

        // Check Department Default Selection ("Default" dept for c1)
        const deptSelect = screen.getByTitle('Department') as HTMLSelectElement;
        expect(deptSelect.value).toBe('d1');
    });

    it('filters managers based on selected department', () => {
        render(
            <TemplateForm
                mode="create"
                companies={companies}
                managers={managers}
                departments={departments}
            />
        );

        // Initially d1 selected (Alice is in d1)
        expect(screen.getByText('+ Alice')).toBeInTheDocument();
        expect(screen.queryByText('+ Bob')).not.toBeInTheDocument(); // Bob is in d2

        // Change Department to Engineering (d2)
        const deptSelect = screen.getByTitle('Department');
        fireEvent.change(deptSelect, { target: { value: 'd2' } });

        // Now Bob should show, Alice should not
        expect(screen.getByText('+ Bob')).toBeInTheDocument();
        expect(screen.queryByText('+ Alice')).not.toBeInTheDocument();
    });

    it('shows all managers if department selection is cleared (if possible) or handled', () => {
        render(
            <TemplateForm
                mode="create"
                companies={companies}
                managers={managers}
                departments={departments}
            />
        );

        // Select "All Departments"
        fireEvent.change(screen.getByTitle('Department'), { target: { value: '' } });

        // Should show both Alice and Bob (both in c1)
        expect(screen.getByText('+ Alice')).toBeInTheDocument();
        expect(screen.getByText('+ Bob')).toBeInTheDocument();
        expect(screen.queryByText('+ Charlie')).not.toBeInTheDocument(); // Charlie is in c2
    });

    it('creates a new manager with the selected department', async () => {
        // Mock successful insert/select flow
        // Recruiter fetch
        const recruiterData = { id: 'rec-1' };
        selectMock.mockImplementationOnce(() => ({
            eq: () => ({ single: () => Promise.resolve({ data: recruiterData }) })
        }));

        // Manager insert return
        const newManager = { id: 'm-new', name: 'Dave', email: 'dave@a.com', role: 'Dev', company_id: 'c1', department_id: 'd1' };
        insertMock.mockReturnValueOnce({
            select: () => ({
                single: () => Promise.resolve({ data: newManager, error: null })
            })
        });

        render(
            <TemplateForm
                mode="create"
                companies={companies}
                managers={managers}
                departments={departments}
            />
        );

        // Initial state: d1 selected
        const deptSelect = screen.getByTitle('Department') as HTMLSelectElement;
        expect(deptSelect.value).toBe('d1');

        // Open "Create new manager"
        fireEvent.click(screen.getByText('Create new manager'));

        // Fill form
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Dave' } });
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dave@a.com' } });

        // Submit
        fireEvent.click(screen.getByText('Add & Select'));

        await waitFor(() => {
            // Verify Supabase insert call
            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Dave',
                department_id: 'd1',
                company_id: 'c1'
            }));

            // Verify new manager is added to selected list
            // Note: The UI for selected managers is vastly different structure, checking if name appears in "Selected Interviewers" section
            // A simple check is that the + button is gone (because selected) or it appears in the list above
        });
    });
});
