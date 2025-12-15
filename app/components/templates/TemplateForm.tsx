"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { sendAvailabilityRequest, getEmailTemplate } from "@/app/recruiter/actions";

// Types
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
    initialData?: any;
    companies: Company[];
    managers: HiringManager[];
    mode: 'create' | 'edit';
}

export function TemplateForm({ initialData, companies, managers, mode }: TemplateFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [sendingRequests, setSendingRequests] = useState(false);

    // Email Modal State
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    // State
    const [name, setName] = useState(initialData?.name || '');
    const [companyId, setCompanyId] = useState(initialData?.company_id || (companies[0]?.id || ''));
    const [length, setLength] = useState(initialData?.interview_length_minutes || 60);
    const [locationType, setLocationType] = useState<'online' | 'in_person'>(initialData?.location_type || 'online');
    const [onlineLink, setOnlineLink] = useState(initialData?.online_link || '');
    const [inPersonLocation, setInPersonLocation] = useState(initialData?.in_person_location || '');
    const [requiredCount, setRequiredCount] = useState(initialData?.required_interviewers_count || 1);

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

    // Manager Creation State
    const [allManagers, setAllManagers] = useState(managers);
    const [isAddingManager, setIsAddingManager] = useState(false);
    const [newMgrName, setNewMgrName] = useState('');
    const [newMgrEmail, setNewMgrEmail] = useState('');
    const [newMgrRole, setNewMgrRole] = useState('');
    const [createMgrLoading, setCreateMgrLoading] = useState(false);

    // Track newly created template ID for post-save flow
    const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);

    // -- Handlers --

    const getLink = (id: string) => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/manager/availability?template_id=${id}`;
        }
        return '';
    };

    const handleCopyLink = (id?: string) => {
        const targetId = id || initialData?.id || savedTemplateId;
        if (!targetId) return;
        const link = getLink(targetId);
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard');
    };

    const handleRequestAvailability = async (templateIdToUse?: string) => {
        const id = templateIdToUse || initialData?.id || savedTemplateId;
        if (!id) return;

        // Fetch default template
        const template = await getEmailTemplate('availability_request');
        if (template) {
            setEmailSubject(template.subject);
            setEmailBody(template.body);
            setShowEmailModal(true);
        } else {
            alert('Error: Could not load email template.');
        }
    };

    const handleConfirmSend = async () => {
        const id = initialData?.id || savedTemplateId;
        if (!id) return;

        setSendingRequests(true);
        const result = await sendAvailabilityRequest(id, emailSubject, emailBody);
        setSendingRequests(false);
        setShowEmailModal(false);

        if (result.success) {
            alert(result.message);
            // If post-save flow, redirect now
            if (savedTemplateId) {
                router.push('/recruiter/templates');
                router.refresh();
            } else {
                router.refresh();
            }
        } else {
            alert('Error: ' + result.message);
        }
    };

    const handleSkip = () => {
        setShowEmailModal(false);
        if (savedTemplateId) {
            router.push('/recruiter/templates');
            router.refresh();
        }
    };

    // Panel Config Handlers
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
                company_id: companyId
            }).select().single();

            if (error) throw error;
            setAllManagers(prev => [...prev, data]);
            setSelectedManagers(prev => [...prev, { id: data.id, role_type: 'mandatory' }]);

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
            };

            let result;
            if (mode === 'create') {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const { data: recruiter } = await supabase.from('recruiters').select('id').eq('auth_user_id', user.id).single();
                if (!recruiter) throw new Error('Recruiter profile not found');

                const { data, error } = await supabase.from('interview_templates').insert({
                    ...templateData,
                    created_by_recruiter_id: recruiter.id,
                }).select().single();

                if (error) throw error;
                result = data;

                // Success! Set state to trigger flow
                setSavedTemplateId(result.id);
                // Trigger modal
                await handleRequestAvailability(result.id);

            } else {
                const { data, error } = await supabase.from('interview_templates').update(templateData).eq('id', initialData.id).select().single();
                if (error) throw error;
                result = data;
                // Redirect on update
                router.push('/recruiter/templates');
                router.refresh();
            }

            // Sync Managers
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

        } catch (err: any) {
            console.error(err);
            alert('Error saving template: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const currentId = initialData?.id || savedTemplateId;

    return (
        <div className="max-w-4xl mx-auto relative">
            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-white text-xl font-bold">
                                    {savedTemplateId ? 'Template Saved! Request Availability?' : 'Edit Availability Request'}
                                </h3>
                                <p className="text-[#9fc992] text-sm mt-1">
                                    {savedTemplateId
                                        ? "Would you like to email the hiring managers now? You can edit the message below."
                                        : "Customize the email that will be sent to all selected hiring managers."}
                                </p>
                            </div>
                            <button onClick={handleSkip} className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="bg-[#2c4823]/20 p-4 rounded-lg mb-6 flex items-center justify-between">
                            <div className="text-sm">
                                <span className="text-[#9fc992] block mb-1">Direct Link (for WhatsApp/Slack):</span>
                                <code className="text-white select-all">{getLink(currentId || '')}</code>
                            </div>
                            <Button type="button" variant="secondary" onClick={() => handleCopyLink(currentId)}>Copy</Button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">Subject</label>
                                <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-white text-sm font-bold mb-2">Body</label>
                                <textarea
                                    className="w-full bg-[#2c4823]/30 border border-[#2c4823] rounded-lg px-4 py-3 text-white focus:ring-primary focus:border-primary h-48"
                                    value={emailBody}
                                    onChange={e => setEmailBody(e.target.value)}
                                />
                                <p className="text-xs text-white/40 mt-2">Variables: {"{{manager_name}}"}, {"{{recruiter_name}}"}, {"{{template_name}}"}, {"{{link}}"}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="ghost" className="text-white" onClick={handleSkip}>
                                {savedTemplateId ? 'Skip for Now' : 'Cancel'}
                            </Button>
                            <Button type="button" onClick={handleConfirmSend} disabled={sendingRequests}>
                                <span className="material-symbols-outlined mr-2">send</span>
                                {sendingRequests ? 'Sending...' : 'Confirm & Send'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {initialData ? 'Edit Template' : 'Create New Template'}
                </h1>
                <div className="flex gap-3">
                    {initialData?.id && (
                        <>
                            <button
                                onClick={() => handleCopyLink()}
                                className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors"
                                title="Copy Manager Invite Link"
                                type="button"
                            >
                                <span className="material-symbols-outlined text-lg">link</span>
                            </button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleRequestAvailability()}
                                disabled={sendingRequests}
                                className="bg-[#0078d4] text-white hover:bg-[#0078d4]/90 border-transparent"
                            >
                                <span className="material-symbols-outlined mr-2">edit_note</span>
                                Request Availability
                            </Button>
                        </>
                    )}
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Template'}
                    </Button>
                </div>
            </div>

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

                    {/* Panel Config */}
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

                    {/* Briefing */}
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

                {/* Sidebar */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 sticky top-24">
                        <h3 className="text-white text-lg font-bold mb-4">Summary</h3>
                        <p className="text-[#9fc992] text-sm">Fill out the form to see summary.</p>
                        {/* Persistent Link Display (Visible if template ID known) */}
                        {currentId && (
                            <div className="mt-6 pt-4 border-t border-[#2c4823]">
                                <h4 className="text-white text-xs uppercase font-bold tracking-wider mb-2">Availability Link</h4>
                                <div className="bg-[#1c2e18] p-2 rounded border border-[#2c4823] flex items-center gap-2">
                                    <span className="text-xs text-[#9fc992] truncate flex-1 block">
                                        {getLink(currentId)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyLink(currentId)}
                                        className="text-white hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
