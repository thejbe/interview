"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';

interface Department {
    id: string;
    name: string;
}

interface HiringManager {
    id: string;
    name: string;
    email: string;
    role?: string;
    department_id?: string;
    active?: boolean;
}

interface ClientFormProps {
    initialData?: {
        id: string;
        name: string;
        active: boolean;
    };
    initialDepartments?: Department[];
    initialManagers?: HiringManager[];
    mode: 'create' | 'edit';
}

export function ClientForm({ initialData, initialDepartments = [], initialManagers = [], mode }: ClientFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // Company State
    const [clientData, setClientData] = useState<any>(initialData || {});
    const [name, setName] = useState(initialData?.name || '');
    const [active, setActive] = useState(initialData?.active ?? true);

    // Departments State
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);
    const [newDeptName, setNewDeptName] = useState('');
    const [addingDept, setAddingDept] = useState(false);
    const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
    const [editingDeptName, setEditingDeptName] = useState('');

    // Managers State
    const [managers, setManagers] = useState<HiringManager[]>(initialManagers);
    const [isAddingManager, setIsAddingManager] = useState(false);
    const [editingManagerId, setEditingManagerId] = useState<string | null>(null);

    // Manager Form State
    const [mgrFormName, setMgrFormName] = useState('');
    const [mgrFormEmail, setMgrFormEmail] = useState('');
    const [mgrFormRole, setMgrFormRole] = useState('');
    const [mgrFormDeptId, setMgrFormDeptId] = useState('');
    const [mgrFormActive, setMgrFormActive] = useState(true);

    const startAddManager = () => {
        setMgrFormName('');
        setMgrFormEmail('');
        setMgrFormRole('');
        setMgrFormDeptId('');
        setMgrFormActive(true);
        setEditingManagerId(null);
        setIsAddingManager(true);
    };

    const startEditManager = (mgr: HiringManager) => {
        setMgrFormName(mgr.name);
        setMgrFormEmail(mgr.email);
        setMgrFormRole(mgr.role || '');
        setMgrFormDeptId(mgr.department_id || '');
        setMgrFormActive(mgr.active !== false); // Default to true if undefined
        setEditingManagerId(mgr.id);
        setIsAddingManager(true);
    };

    const cancelManagerForm = () => {
        setIsAddingManager(false);
        setEditingManagerId(null);
    };



    // Manager Handlers
    const handleSaveManager = async () => {
        if (!mgrFormName || !mgrFormEmail || !clientData?.id) return;

        try {
            const managerData = {
                company_id: clientData.id,
                name: mgrFormName,
                email: mgrFormEmail,
                role: mgrFormRole,
                department_id: mgrFormDeptId || null,
                active: mgrFormActive
            };

            let savedManager: HiringManager;

            if (editingManagerId) {
                // Update
                const { data, error } = await supabase.from('hiring_managers')
                    .update(managerData)
                    .eq('id', editingManagerId)
                    .select().single();

                if (error) throw error;
                savedManager = data as unknown as HiringManager;

                // Update local state
                setManagers(managers.map(m => m.id === editingManagerId ? savedManager : m));
            } else {
                // Insert
                const { data, error } = await supabase.from('hiring_managers')
                    .insert(managerData)
                    .select().single();

                if (error) throw error;
                savedManager = data as unknown as HiringManager;

                // Add to local state
                setManagers([...managers, savedManager]);
            }

            cancelManagerForm();
        } catch (err: any) {
            toast.error('Error saving manager: ' + err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let companyId = clientData?.id;
            let currentClientData = clientData;

            // 1. Save Company
            if (!companyId) {
                // Create
                const { data, error } = await supabase.from('companies').insert({
                    name,
                    active
                }).select().single();
                if (error) throw error;
                companyId = data.id;
                currentClientData = data;
                setClientData(data); // Switch to edit mode locally

                // 2. Create Default Department automatically
                const { data: deptData, error: deptError } = await supabase.from('departments').insert({
                    company_id: companyId,
                    name: 'Default'
                }).select().single();

                if (deptError) {
                    console.error("Error creating default department:", deptError);
                } else {
                    setDepartments([deptData]);

                    // 3. Prepare UI for adding contact
                    startAddManager();
                    setMgrFormDeptId(deptData.id); // Pre-select Default department

                    // Update URL without reload
                    window.history.replaceState(null, '', `/recruiter/clients/${companyId}`);
                }

            } else {
                // Update
                const { error } = await supabase.from('companies').update({
                    name,
                    active
                }).eq('id', companyId);
                if (error) throw error;
            }

            if (!companyId) throw new Error("Failed to get company ID");

            // Success - Redirect to Dashboard
            router.push(`/recruiter/clients/${companyId}/dashboard`);
            router.refresh();
        } catch (err: any) {
            console.error(err);
            toast.error('Error saving client: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Department Handlers
    const handleAddDepartment = async () => {
        if (!newDeptName || !clientData?.id) return;

        try {
            const { data, error } = await supabase.from('departments').insert({
                company_id: clientData.id,
                name: newDeptName
            }).select().single();

            if (error) throw error;

            setDepartments([...departments, data]);
            setNewDeptName('');
            setAddingDept(false);
        } catch (err: any) {
            toast.error('Error adding department: ' + err.message);
        }
    };

    const handleDeleteDepartment = async (id: string) => {
        if (!confirm('Are you sure? This will delete the department.')) return;
        try {
            const { error } = await supabase.from('departments').delete().eq('id', id);
            if (error) throw error;
            setDepartments(departments.filter(d => d.id !== id));
        } catch (err: any) {
            toast.error('Error deleting department: ' + err.message);
        }
    };

    const startEditDepartment = (dept: Department) => {
        setEditingDeptId(dept.id);
        setEditingDeptName(dept.name);
    };

    const cancelEditDepartment = () => {
        setEditingDeptId(null);
        setEditingDeptName('');
    };

    const handleUpdateDepartment = async (id: string) => {
        if (!editingDeptName.trim()) return;

        try {
            const { error } = await supabase.from('departments')
                .update({ name: editingDeptName })
                .eq('id', id);

            if (error) throw error;

            setDepartments(departments.map(d => d.id === id ? { ...d, name: editingDeptName } : d));
            cancelEditDepartment();
        } catch (err: any) {
            toast.error('Error updating department: ' + err.message);
        }
    };

    const isCreateMode = !clientData?.id;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-8">

                {/* Basics */}
                <section className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Client Details</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <Input
                            label="Company Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                        <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="rounded border-gray-600 bg-[#2c4823]/30 text-primary focus:ring-primary"
                                checked={active}
                                onChange={e => setActive(e.target.checked)}
                            />
                            <span>Active</span>
                        </label>
                    </div>
                </section>

                {/* Departments */}
                {!isCreateMode && (
                    <section className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6">
                        <h3 className="text-white text-lg font-bold mb-4">Departments</h3>
                        <div className="space-y-3">
                            {departments.map(dept => (
                                <div key={dept.id} className="flex items-center justify-between bg-[#2c4823]/20 p-3 rounded-lg border border-[#2c4823]">
                                    {editingDeptId === dept.id ? (
                                        <div className="flex items-center gap-2 w-full">
                                            <Input
                                                value={editingDeptName}
                                                onChange={e => setEditingDeptName(e.target.value)}
                                                className="mb-0 py-2 h-9"
                                                autoFocus
                                            />
                                            <Button type="button" className="h-9 text-sm px-3" onClick={() => handleUpdateDepartment(dept.id)}>Save</Button>
                                            <button type="button" onClick={cancelEditDepartment} className="text-white/60 text-sm">Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-white font-medium">{dept.name}</span>
                                            <div className="flex items-center gap-3">
                                                <button type="button" onClick={() => startEditDepartment(dept)} className="text-primary hover:text-white text-sm">
                                                    Edit
                                                </button>
                                                <button type="button" onClick={() => handleDeleteDepartment(dept.id)} className="text-red-400 hover:text-red-300 text-sm">
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            {!addingDept ? (
                                <button type="button" onClick={() => setAddingDept(true)} className="text-primary text-sm hover:underline flex items-center">
                                    <span className="material-symbols-outlined text-sm mr-1">add</span>
                                    Add Department
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input
                                        label=""
                                        placeholder="Department Name"
                                        value={newDeptName}
                                        onChange={e => setNewDeptName(e.target.value)}
                                        className="mb-0"
                                    />
                                    <Button type="button" className="h-10 text-sm px-4" onClick={handleAddDepartment}>Add</Button>
                                    <button type="button" onClick={() => setAddingDept(false)} className="text-white/60 text-sm">Cancel</button>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Contacts / Managers */}
                {!isCreateMode && (
                    <section className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6">
                        <h3 className="text-white text-lg font-bold mb-4">Contacts</h3>
                        <div className="space-y-3">
                            {managers.map(mgr => (
                                <div key={mgr.id} className={`flex items-center justify-between bg-[#2c4823]/20 p-3 rounded-lg border border-[#2c4823] ${mgr.active === false ? 'opacity-60' : ''}`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">
                                                {mgr.name}
                                                {mgr.role && <span className="text-white/60 text-sm ml-2">({mgr.role})</span>}
                                            </span>
                                            {mgr.active === false && <span className="text-xs bg-red-900/50 text-red-300 px-1.5 rounded">Inactive</span>}
                                        </div>
                                        <div className="text-white/60 text-sm">{mgr.email}</div>
                                        {mgr.department_id && (
                                            <div className="text-primary text-xs mt-1">
                                                {departments.find(d => d.id === mgr.department_id)?.name}
                                            </div>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => startEditManager(mgr)} className="text-primary hover:text-white text-sm">
                                        Edit
                                    </button>
                                </div>
                            ))}

                            {!isAddingManager ? (
                                <button type="button" onClick={startAddManager} className="text-primary text-sm hover:underline flex items-center">
                                    <span className="material-symbols-outlined text-sm mr-1">person_add</span>
                                    Add Contact
                                </button>
                            ) : (
                                <div className="bg-[#2c4823]/20 p-4 rounded-lg border border-[#2c4823]">
                                    <h4 className="text-white text-sm font-bold mb-3">{editingManagerId ? 'Edit Contact' : 'New Contact'}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <Input label="Name" value={mgrFormName} onChange={e => setMgrFormName(e.target.value)} autoFocus />
                                        <Input label="Email" value={mgrFormEmail} onChange={e => setMgrFormEmail(e.target.value)} />
                                        <Input label="Role" value={mgrFormRole} onChange={e => setMgrFormRole(e.target.value)} />
                                        <div>
                                            <label className="block text-[#9fc992] text-sm font-medium mb-2">Department</label>
                                            <select
                                                className="w-full bg-[#2c4823]/30 border border-[#2c4823] rounded-lg px-4 py-3 text-white focus:ring-primary focus:border-primary"
                                                value={mgrFormDeptId}
                                                onChange={e => setMgrFormDeptId(e.target.value)}
                                            >
                                                <option value="">None</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-600 bg-[#2c4823]/30 text-primary focus:ring-primary"
                                                checked={mgrFormActive}
                                                onChange={e => setMgrFormActive(e.target.checked)}
                                            />
                                            <span className="text-sm">Active Contact</span>
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button type="button" className="h-10 text-sm px-4" onClick={handleSaveManager}>
                                            {editingManagerId ? 'Update Contact' : 'Save Contact'}
                                        </Button>
                                        <button type="button" onClick={cancelManagerForm} className="text-white/60 text-sm">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {isCreateMode && (
                    <div className="bg-blue-900/20 text-blue-200 p-4 rounded-lg border border-blue-900/50">
                        You can add Departments and Contacts after saving the Client details.
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Client'}
                    </Button>
                    <Link href="/recruiter/clients" className="px-6 py-3 text-white font-bold hover:bg-white/10 rounded-full transition-colors">
                        Cancel
                    </Link>
                </div>
            </div>
        </form>
    );
}
