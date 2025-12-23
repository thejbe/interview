"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { TemplateForm } from '@/app/components/templates/TemplateForm';
import { createClient } from '@/lib/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TemplateListProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    templates: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    company: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    managers: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    departments: any[];
}

export function TemplateList({ templates, company, managers, departments }: TemplateListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get('templateId');
    // const supabase = createClient();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingTemplate, setEditingTemplate] = useState<any>(null);

    const handleSelect = (id: string) => {
        router.push(`/recruiter/clients/${company.id}/dashboard?templateId=${id}`);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (e: React.MouseEvent, template: any) => {
        e.stopPropagation();
        setEditingTemplate(template);
    };

    const handleSuccess = () => {
        setIsCreateOpen(false);
        setEditingTemplate(null);
        router.refresh();
    };

    /*
    const toggleActive = async (e: React.MouseEvent, template: any) => {
        e.stopPropagation();
        alert("Toggle inactive functionality to be linked to backend status column.");
    };
    */

    return (
        <div className="bg-[#152211] border border-[#2c4823] rounded-2xl h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#2c4823] flex items-center justify-between bg-[#152211] sticky top-0 z-10">
                <h3 className="text-lg font-bold text-white">Vacancies</h3>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-primary text-[#142210] rounded-full hover:bg-primary/90 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    New
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {templates.length === 0 ? (
                    <div className="text-center p-8 text-[#9fc992]">
                        <p className="text-sm">No templates found.</p>
                        <button onClick={() => setIsCreateOpen(true)} className="text-primary text-xs mt-2 hover:underline">Create one</button>
                    </div>
                ) : (
                    templates.map(t => {
                        const isSelected = selectedId === t.id;
                        // Mock metrics for now until we join properly
                        const presentedCount = 0; // Replace with data
                        const scheduledCount = 0; // Replace with data
                        const seenCount = 0; // Replace with data

                        return (
                            <div
                                key={t.id}
                                onClick={() => handleSelect(t.id)}
                                className={`w-full text-left p-4 rounded-xl transition-all border cursor-pointer group relative ${isSelected
                                    ? 'bg-[#2c4823]/40 border-primary shadow-[0_0_15px_rgba(74,222,128,0.1)]'
                                    : 'bg-[#152211] border-[#2c4823] hover:border-[#2c4823]/80 hover:bg-[#2c4823]/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-white'}`}>{t.name}</h4>
                                        <p className="text-[#9fc992] text-xs mt-0.5">{t.location_type}</p>
                                    </div>
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => handleEdit(e, t)}
                                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                                            title="Edit Template"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Managers - Placeholder logic */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex -space-x-2">
                                        {[1, 2].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-[#2c4823] border border-[#152211] flex items-center justify-center text-[10px] text-white">
                                                HM
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-[#9fc992]">2 Managers (1 Availability)</span>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="bg-black/20 rounded p-2 text-center">
                                        <div className="text-xs text-[#9fc992] mb-0.5">Presented</div>
                                        <div className="text-white font-bold">{presentedCount}</div>
                                    </div>
                                    <div className="bg-black/20 rounded p-2 text-center">
                                        <div className="text-xs text-[#9fc992] mb-0.5">Scheduled</div>
                                        <div className="text-white font-bold">{scheduledCount}</div>
                                    </div>
                                    <div className="bg-black/20 rounded p-2 text-center">
                                        <div className="text-xs text-[#9fc992] mb-0.5">Seen</div>
                                        <div className="text-white font-bold">{seenCount}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Actions Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create New Template"
                headerAction={
                    <Button type="submit" form="template-form" className="h-8 text-xs px-3">
                        Save Template
                    </Button>
                }
            >
                <TemplateForm
                    mode="create"
                    companies={[company]}
                    managers={managers}
                    departments={departments}
                    onSuccess={handleSuccess}
                    isModal={true}
                />
            </Modal>

            {/* Edit Actions Modal */}
            <Modal
                isOpen={!!editingTemplate}
                onClose={() => setEditingTemplate(null)}
                title="Edit Template"
                headerAction={
                    <Button type="submit" form="template-form" className="h-8 text-xs px-3">
                        Save Changes
                    </Button>
                }
            >
                {editingTemplate && (
                    <TemplateForm
                        mode="edit"
                        initialData={editingTemplate}
                        companies={[company]}
                        managers={managers}
                        departments={departments}
                        onSuccess={handleSuccess}
                        isModal={true}
                    />
                )}
            </Modal>
        </div>
    );
}
