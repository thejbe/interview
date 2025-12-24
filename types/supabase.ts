export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
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
            }
            companies: {
                Row: {
                    id: string
                    name: string
                    recruiter_id: string | null
                    organization_id: string | null
                    created_at: string
                    active: boolean
                }
                Insert: {
                    id?: string
                    name: string
                    recruiter_id?: string | null
                    organization_id?: string | null
                    created_at?: string
                    active?: boolean
                }
                Update: {
                    id?: string
                    name?: string
                    recruiter_id?: string | null
                    organization_id?: string | null
                    created_at?: string
                    active?: boolean
                }
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
            }
            hiring_managers: {
                Row: {
                    id: string
                    company_id: string | null
                    name: string | null
                    email: string | null
                    department_id: string | null
                    role: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    company_id?: string | null
                    name?: string | null
                    email?: string | null
                    department_id?: string | null
                    role?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    company_id?: string | null
                    name?: string | null
                    email?: string | null
                    department_id?: string | null
                    role?: string | null
                    created_at?: string
                }
            }
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
            }
            template_hiring_managers: {
                Row: {
                    template_id: string
                    hiring_manager_id: string
                    availability_status: string | null
                    last_request_sent_at: string | null
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
                }
            }
            interview_templates: {
                Row: {
                    id: string
                    company_id: string | null
                    name: string
                    interview_length_minutes: number
                    location_type: 'online' | 'in_person'
                    online_link: string | null
                    in_person_location: string | null
                    candidate_briefing_text: string | null
                    active: boolean | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    company_id?: string | null
                    name: string
                    interview_length_minutes: number
                    location_type: 'online' | 'in_person'
                    online_link?: string | null
                    in_person_location?: string | null
                    candidate_briefing_text?: string | null
                    active?: boolean | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    company_id?: string | null
                    name?: string
                    interview_length_minutes?: number
                    location_type?: 'online' | 'in_person'
                    online_link?: string | null
                    in_person_location?: string | null
                    candidate_briefing_text?: string | null
                    active?: boolean | null
                    created_at?: string
                    updated_at?: string | null
                }
            }
            bookings: {
                Row: {
                    id: string
                    template_id: string | null
                    candidate_name: string
                    candidate_email: string
                    status: 'pending' | 'confirmed' | 'cancelled' | 'withdrawn' | 'completed'
                    token: string
                    created_at: string
                    slot_id: string | null
                    meeting_link: string | null
                    meeting_platform: string | null
                }
                Insert: {
                    id?: string
                    template_id?: string | null
                    candidate_name: string
                    candidate_email: string
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'withdrawn' | 'completed'
                    token: string
                    created_at?: string
                    slot_id?: string | null
                    meeting_link?: string | null
                    meeting_platform?: string | null
                }
                Update: {
                    id?: string
                    template_id?: string | null
                    candidate_name?: string
                    candidate_email?: string
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'withdrawn' | 'completed'
                    token?: string
                    created_at?: string
                    slot_id?: string | null
                    meeting_link?: string | null
                    meeting_platform?: string | null
                }
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
            }
        }
    }
}
