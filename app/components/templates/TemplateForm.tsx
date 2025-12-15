"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Card } from '@/app/components/ui/Card';

// Types (simplified for now)
interface Company {
    id: string;
    name: string;
}

interface HiringManager {
    id: string;
    name: string;
    email: string;
    role?: string;
}

interface TemplateFormProps {
    initialData?: any; // To be typed properly
    companies: Company[];
    managers: HiringManager[];
    mode: 'create' | 'edit';
}

export function TemplateForm({ initialData, companies, managers, mode }: TemplateFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // State
    const [name, setName] = useState(initialData?.name || '');
    const [companyId, setCompanyId] = useState(initialData?.company_id || (companies[0]?.id || ''));
    const [length, setLength] = useState(initialData?.interview_length_minutes || 60);
    const [locationType, setLocationType] = useState<'online' | 'in_person'>(initialData?.location_type || 'online');
    const [onlineLink, setOnlineLink] = useState(initialData?.online_link || '');
    const [inPersonLocation, setInPersonLocation] = useState(initialData?.in_person_location || '');
    const [requiredCount, setRequiredCount] = useState(initialData?.required_interviewers_count || 1);

    // selectedManagers now holds objects with config
    interface SelectedManagerConfig {
        id: string;
        role_type: 'mandatory' | 'at_least_one' | 'optional';
    }

    const [selectedManagers, setSelectedManagers] = useState<SelectedManagerConfig[]>(
        initialData?.template_hiring_managers?.sort((a: any, b: any) => (a.list_order || 0) - (b.list_order || 0)).map((thm: any) => ({
            id: thm.hiring_manager_id,
            role_type: thm.role_type || 'mandatory'
        })) || []
    );

    const [briefingText, setBriefingText] = useState(initialData?.candidate_briefing_text || '');
    // const [file, setFile] = useState<File | null>(null); // For file upload

    // Manager Creation State
    const [allManagers, setAllManagers] = useState(managers);
    const [isAddingManager, setIsAddingManager] = useState(false);
    const [newMgrName, setNewMgrName] = useState('');
    const [newMgrEmail, setNewMgrEmail] = useState('');
    const [newMgrRole, setNewMgrRole] = useState('');
    const [createMgrLoading, setCreateMgrLoading] = useState(false);

    // Handlers for Panel Config
    const addManager = (id: string) => {
        if (selectedManagers.find(m => m.id === id)) return;
        setSelectedManagers(prev => [...prev, { id, role_type: 'mandatory' }]);
    };

    const removeManager = (id: string) => {
        setSelectedManagers(prev => prev.filter(m => m.id !== id));
    };

    const updateManagerRole = (id: string, role: 'mandatory' | 'at_least_one' | 'optional') => {
        setSelectedManagers(prev => prev.map(m => m.id === id ? { ...m, role_type: role } : m));
    };

    const moveManager = (index: number, direction: number) => {
        const newManagers = [...selectedManagers];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= newManagers.length) return;

        [newManagers[index], newManagers[newIndex]] = [newManagers[newIndex], newManagers[index]];
        setSelectedManagers(newManagers);
    };

    const handleCreateAndAddManager = async () => {
        if (!newMgrName || !newMgrEmail) return;
        setCreateMgrLoading(true);
        try {
            const { data, error } = await supabase.from('hiring_managers').insert({
                name: newMgrName,
                email: newMgrEmail,
                role: newMgrRole,
                company_id: companyId // Link to currently selected company
            }).select().single();

            if (error) throw error;

            setAllManagers(prev => [...prev, data]);
            // Add as mandatory by default
            setSelectedManagers(prev => [...prev, { id: data.id, role_type: 'mandatory' }]);

            // Reset
            setNewMgrName('');
            setNewMgrEmail('');
            setNewMgrRole('');
            setIsAddingManager(false);
        } catch (err: any) {
            alert('Error adding manager: ' + err.message);
        } finally {
            setCreateMgrLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const templateData = {
                name,
                company_id: companyId,
                interview_length_minutes: length,
                location_type: locationType,
                online_link: locationType === 'online' ? onlineLink : null,
                in_person_location: locationType === 'in_person' ? inPersonLocation : null,
                candidate_briefing_text: briefingText,
                required_interviewers_count: requiredCount,
                // created_by_recruiter_id: derived from session in RLS or backend trigger? For now assumes RLS handles user mapping or we insert explicit recruiter id if we had it
            };

            let result;
            if (mode === 'create') {
                // Insert
                // Need to get recruiter ID? For now, we rely on RLS or trigger? 
                // The table has created_by_recruiter_id. We need to look up current recruiter ID from auth user.
                // Doing this in client side is okay if we have the recruiter record.
                // For V1, let's assume valid recruiter exists linked to auth user.
                // We'll simplisticly fetch it first in the page or useEffect, but here we just insert.

                // Wait, we need the recruiter ID to insert.
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                // Look up recruiter
                const { data: recruiter } = await supabase.from('recruiters').select('id').eq('auth_user_id', user.id).single();
                if (!recruiter) {
                    // Fallback/Error: User might not be set up as recruiter yet
                    throw new Error('Recruiter profile not found');
                }

                const { data, error } = await supabase.from('interview_templates').insert({
                    ...templateData,
                    created_by_recruiter_id: recruiter.id,
                }).select().single();

                if (error) throw error;
                result = data;
            } else {
                // Update
                const { data, error } = await supabase.from('interview_templates').update(templateData).eq('id', initialData.id).select().single();
                if (error) throw error;
                result = data;
            }

            // Handle Managers (Delete existing for this template, then insert new selection) - Naive approach
            // Better: upsert or diff.
            // Safe strategy for simple V1: Delete all for this template content, re-insert.
            if (mode === 'edit') {
                await supabase.from('template_hiring_managers').delete().eq('template_id', result.id);
            }

            if (selectedManagers.length > 0) {
                const managerLinks = selectedManagers.map((sm, index) => ({
                    template_id: result.id,
                    hiring_manager_id: sm.id,
                    role_type: sm.role_type,
                    list_order: index
                }));
                await supabase.from('template_hiring_managers').insert(managerLinks);
            }

            // Handle File Upload (Simplified)
            // if (file) { ... upload logic ... }

            router.push('/recruiter/templates');
            router.refresh();
        } catch (err: any) {
            console.error(err);
            alert('Error saving template: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-8">

                {/* Helper to pick company/recruiter if empty */}
                {companies.length === 0 && (
                    <div className="bg-yellow-900/20 p-4 rounded text-yellow-200">
                        Warning: No companies found. Please create a company first in the database.
                    </div>
                )}

                {/* Basics */}
                <section className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Template Basics</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <Input
                            label="Template Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                        {/* Company Select */}
                        <div>
                            <label className="block text-[#9fc992] text-sm font-medium mb-2">Hiring Company</label>
                            <select
                                title="Company"
                                className="w-full bg-[#2c4823]/30 border border-[#2c4823] rounded-lg px-4 py-3 text-white focus:ring-primary focus:border-primary"
                                value={companyId}
                                onChange={e => setCompanyId(e.target.value)}
                            >
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Interview Length (minutes)"
                            type="number"
                            value={length}
                            onChange={e => setLength(Number(e.target.value))}
                        />
                    </div>
                </section>

                {/* Location */}
                <section className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Location</h3>
                    <div className="flex gap-6 mb-4">
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input type="radio" name="location" className="text-primary bg-[#2c4823]/30 border-[#2c4823]"
                                checked={locationType === 'online'} onChange={() => setLocationType('online')} />
                            <span>Online</span>
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input type="radio" name="location" className="text-primary bg-[#2c4823]/30 border-[#2c4823]"
                                checked={locationType === 'in_person'} onChange={() => setLocationType('in_person')} />
                            <span>In Person</span>
                        </label>
                    </div>
                    {locationType === 'online' ? (
                        <Input label="Video Link / Platform" value={onlineLink} onChange={e => setOnlineLink(e.target.value)} placeholder="Google Meet, Zoom..." />
                    ) : (
                        <Input label="Address" value={inPersonLocation} onChange={e => setInPersonLocation(e.target.value)} placeholder="Office address..." />
                    )}
                </section>

                {/* Hiring Managers & Panel Configuration */}
                <section className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Panel Configuration</h3>

                    <div className="mb-6">
                        <Input
                            label="Required Interviewers Count (Total)"
                            type="number"
                            min={1}
                            value={requiredCount}
                            onChange={e => setRequiredCount(Number(e.target.value))}
                        />
                        <p className="text-xs text-[#9fc992] mt-1">
                            How many interviewers must be present in the meeting? Verify this matches your manager rules below.
                        </p>
                    </div>

                    <h4 className="text-white text-md font-bold mb-3">Selected Interviewers</h4>

                    {selectedManagers.length === 0 && (
                        <p className="text-[#9fc992] text-sm mb-4 italic">No interviewers selected yet.</p>
                    )}

                    <div className="space-y-3 mb-6">
                        {selectedManagers.map((sm, index) => {
                            const mgr = allManagers.find(m => m.id === sm.id);
                            return (
                                <div key={sm.id} className="bg-[#2c4823]/20 border border-[#2c4823] rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2c4823] text-xs text-white">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <div className="text-white font-medium">
                                                {mgr?.name || 'Unknown'} <span className="text-white/60 text-sm">({mgr?.role || 'No Role'})</span>
                                            </div>
                                            <div className="text-xs text-[#9fc992]">{mgr?.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <select
                                            className="bg-[#152211] border border-[#2c4823] text-white text-sm rounded px-2 py-1 focus:ring-primary focus:border-primary"
                                            value={sm.role_type}
                                            onChange={(e) => updateManagerRole(sm.id, e.target.value as any)}
                                        >
                                            <option value="mandatory">Mandatory</option>
                                            <option value="at_least_one">At Least One</option>
                                            <option value="optional">Optional</option>
                                        </select>

                                        <button type="button" onClick={() => moveManager(index, -1)} disabled={index === 0} className="text-white/40 hover:text-white disabled:opacity-20">
                                            <span className="material-symbols-outlined text-lg">arrow_upward</span>
                                        </button>
                                        <button type="button" onClick={() => moveManager(index, 1)} disabled={index === selectedManagers.length - 1} className="text-white/40 hover:text-white disabled:opacity-20">
                                            <span className="material-symbols-outlined text-lg">arrow_downward</span>
                                        </button>
                                        <button type="button" onClick={() => removeManager(sm.id)} className="text-red-400 hover:text-red-300 ml-2">
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-[#2c4823] pt-4">
                        <div className="text-sm text-[#9fc992] mb-2">Add Interviewer:</div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {allManagers.filter(m => !selectedManagers.find(sm => sm.id === m.id)).map(m => (
                                <button key={m.id} type="button" onClick={() => addManager(m.id)}
                                    className="px-3 py-1 rounded-full border border-[#2c4823] text-white text-sm hover:bg-[#2c4823] transition-colors">
                                    + {m.name}
                                </button>
                            ))}
                        </div>

                        {!isAddingManager ? (
                            <button type="button" onClick={() => setIsAddingManager(true)}
                                className="text-sm text-primary hover:underline flex items-center">
                                <span className="material-symbols-outlined text-sm mr-1">person_add</span>
                                Create new manager
                            </button>
                        ) : (
                            <div className="bg-[#2c4823]/20 p-4 rounded-lg border border-[#2c4823] mt-2">
                                <h4 className="text-white text-sm font-bold mb-3">New Manager</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <Input label="Name" value={newMgrName} onChange={e => setNewMgrName(e.target.value)} placeholder="e.g. John Doe" />
                                    <Input label="Email" value={newMgrEmail} onChange={e => setNewMgrEmail(e.target.value)} placeholder="e.g. john@company.com" />
                                    <Input label="Role (Optional)" value={newMgrRole} onChange={e => setNewMgrRole(e.target.value)} placeholder="e.g. Engineering Manager" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="button" className="px-3 py-1 text-sm h-8" onClick={handleCreateAndAddManager} disabled={createMgrLoading}>
                                        {createMgrLoading ? 'Adding...' : 'Add & Select'}
                                    </Button>
                                    <button type="button" onClick={() => setIsAddingManager(false)} className="text-white/60 text-sm hover:text-white px-3">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Candidate Briefing */}
                <section className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Candidate Briefing</h3>
                    <div>
                        <label className="block text-[#9fc992] text-sm font-medium mb-2">Briefing Text</label>
                        <textarea
                            className="w-full bg-[#2c4823]/30 border border-[#2c4823] rounded-lg px-4 py-3 text-white focus:ring-primary focus:border-primary h-32"
                            value={briefingText}
                            onChange={e => setBriefingText(e.target.value)}
                        ></textarea>
                    </div>
                    {/* File Upload Placeholder */}
                    <div className="mt-4 p-8 border-2 border-dashed border-[#2c4823] rounded-2xl text-center text-[#9fc992]">
                        File upload coming soon
                    </div>
                </section>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Template'}
                    </Button>
                    <Link href="/recruiter/templates" className="px-6 py-3 text-white font-bold hover:bg-white/10 rounded-full transition-colors">
                        Cancel
                    </Link>
                </div>
            </div>

            {/* Summary Sidebar (Static for now to match design visual) */}
            <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 sticky top-24">
                    <h3 className="text-white text-lg font-bold mb-4">Summary</h3>
                    <p className="text-[#9fc992] text-sm">Fill out the form to see summary.</p>
                </div>
            </div>
        </form>
    );
}
