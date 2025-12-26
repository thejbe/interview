export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            departments: {
                Row: {
                    id: string
                    company_id: string | null
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    company_id?: string | null
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    company_id?: string | null
                    name?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "departments_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            organizations: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                }
                Relationships: []
            }
            recruiters: {
                Row: {
                    id: string
                    auth_user_id: string | null
                    organization_id: string | null
                    name: string | null
                    email: string | null
                    avatar_url: string | null
                    role: 'admin' | 'member' | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    auth_user_id?: string | null
                    organization_id?: string | null
                    name?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    role?: 'admin' | 'member' | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    auth_user_id?: string | null
                    organization_id?: string | null
                    name?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    role?: 'admin' | 'member' | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "recruiters_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            companies: {
                Row: {
                    id: string
                    name: string
                    recruiter_id: string | null
                    organization_id: string | null
                    active: boolean
                    plan_tier: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    recruiter_id?: string | null
                    organization_id?: string | null
                    active?: boolean
                    plan_tier?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    recruiter_id?: string | null
                    organization_id?: string | null
                    active?: boolean
                    plan_tier?: string
                    created_at?: string
                }
                Relationships: []
            }
            invitations: {
                Row: {
                    id: string
                    email: string
                    token: string
                    organization_id: string
                    invited_by: string | null
                    role: 'admin' | 'member'
                    status: 'pending' | 'accepted'
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    token: string
                    organization_id: string
                    invited_by?: string | null
                    role?: 'admin' | 'member'
                    status?: 'pending' | 'accepted'
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    token?: string
                    organization_id?: string
                    invited_by?: string | null
                    role?: 'admin' | 'member'
                    status?: 'pending' | 'accepted'
                    created_at?: string
                }
                Relationships: []
            }
            hiring_managers: {
                Row: {
                    id: string
                    auth_user_id: string | null
                    company_id: string | null
                    name: string | null
                    email: string | null
                    calendar_provider: 'google' | 'microsoft' | 'none'
                    calendar_sync_status: string
                    last_calendar_sync_at: string | null
                    role: string | null
                    department_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    auth_user_id?: string | null
                    company_id?: string | null
                    name?: string | null
                    email?: string | null
                    calendar_provider?: 'google' | 'microsoft' | 'none'
                    calendar_sync_status?: string
                    last_calendar_sync_at?: string | null
                    role?: string | null
                    department_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    auth_user_id?: string | null
                    company_id?: string | null
                    name?: string | null
                    email?: string | null
                    calendar_provider?: 'google' | 'microsoft' | 'none'
                    calendar_sync_status?: string
                    last_calendar_sync_at?: string | null
                    role?: string | null
                    department_id?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            email_templates: {
                Row: {
                    id: string
                    key: string
                    subject: string
                    body: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    subject: string
                    body: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    subject?: string
                    body?: string
                    created_at?: string
                }
                Relationships: []
            }
            template_hiring_managers: {
                Row: {
                    template_id: string
                    hiring_manager_id: string
                    availability_status: string | null
                    last_request_sent_at: string | null
                    role_type: string | null
                }
                Insert: {
                    template_id: string
                    hiring_manager_id: string
                    availability_status?: string | null
                    last_request_sent_at?: string | null
                }
                Update: {
                    template_id?: string
                    hiring_manager_id?: string
                    availability_status?: string | null
                    last_request_sent_at?: string | null
                    role_type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "template_hiring_managers_hiring_manager_id_fkey"
                        columns: ["hiring_manager_id"]
                        isOneToOne: false
                        referencedRelation: "hiring_managers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "template_hiring_managers_template_id_fkey"
                        columns: ["template_id"]
                        isOneToOne: false
                        referencedRelation: "interview_templates"
                        referencedColumns: ["id"]
                    }
                ]
            }
            interview_templates: {
                Row: {
                    id: string
                    company_id: string | null
                    created_by_recruiter_id: string | null
                    name: string
                    interview_length_minutes: number
                    location_type: 'online' | 'in_person'
                    online_link: string | null
                    in_person_location: string | null
                    candidate_briefing_text: string | null
                    active: boolean
                    required_interviewers_count: number
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    company_id?: string | null
                    created_by_recruiter_id?: string | null
                    name: string
                    interview_length_minutes: number
                    location_type: 'online' | 'in_person'
                    online_link?: string | null
                    in_person_location?: string | null
                    candidate_briefing_text?: string | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    company_id?: string | null
                    created_by_recruiter_id?: string | null
                    name?: string
                    interview_length_minutes?: number
                    location_type?: 'online' | 'in_person'
                    online_link?: string | null
                    in_person_location?: string | null
                    candidate_briefing_text?: string | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "interview_templates_created_by_recruiter_id_fkey"
                        columns: ["created_by_recruiter_id"]
                        isOneToOne: false
                        referencedRelation: "recruiters"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "interview_templates_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            slots: {
                Row: {
                    id: string
                    template_id: string | null
                    hiring_manager_id: string | null
                    start_time: string
                    end_time: string
                    status: 'open' | 'booked' | 'blocked'
                    source: 'calendar' | 'override'
                    created_at: string
                }
                Insert: {
                    id?: string
                    template_id?: string | null
                    hiring_manager_id?: string | null
                    start_time: string
                    end_time: string
                    status?: 'open' | 'booked' | 'blocked'
                    source?: 'calendar' | 'override'
                    created_at?: string
                }
                Update: {
                    id?: string
                    template_id?: string | null
                    hiring_manager_id?: string | null
                    start_time?: string
                    end_time?: string
                    status?: 'open' | 'booked' | 'blocked'
                    source?: 'calendar' | 'override'
                    created_at?: string
                }
                Relationships: []
            }
            bookings: {
                Row: {
                    id: string
                    template_id: string | null
                    candidate_name: string
                    candidate_email: string
                    candidate_phone: string | null
                    status: 'pending' | 'confirmed' | 'cancelled' | 'withdrawn' | 'completed'
                    token: string
                    slot_id: string | null
                    meeting_link: string | null
                    meeting_platform: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    template_id?: string | null
                    candidate_name: string
                    candidate_email: string
                    candidate_phone?: string | null
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'withdrawn' | 'completed'
                    token: string
                    slot_id?: string | null
                    meeting_link?: string | null
                    meeting_platform?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    template_id?: string | null
                    candidate_name?: string
                    candidate_email?: string
                    candidate_phone?: string | null
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'withdrawn' | 'completed'
                    token?: string
                    slot_id?: string | null
                    meeting_link?: string | null
                    meeting_platform?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            template_files: {
                Row: {
                    id: string
                    template_id: string | null
                    file_url: string
                    file_name: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    template_id?: string | null
                    file_url: string
                    file_name?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    template_id?: string | null
                    file_url?: string
                    file_name?: string | null
                    created_at?: string
                }
                Relationships: []
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        Views: {}
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        Functions: {}
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        Enums: {}
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        CompositeTypes: {}
    }
}
