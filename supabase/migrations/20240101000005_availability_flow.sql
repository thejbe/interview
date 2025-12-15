-- Create availability status enum
create type availability_status as enum ('pending', 'requested', 'provided');

-- Add columns to template_hiring_managers
alter table template_hiring_managers
add column availability_status availability_status default 'pending',
add column last_request_sent_at timestamptz;

-- Create email_templates table
create table email_templates (
    id uuid primary key default gen_random_uuid(),
    key text unique not null,
    subject text not null,
    body text not null,
    updated_at timestamptz default now()
);

-- Seed default availability request template
insert into email_templates (key, subject, body)
values (
    'availability_request',
    'Request for Availability: {{template_name}}',
    'Hi {{manager_name}},\n\n{{recruiter_name}} is requesting your availability for the {{template_name}} interview loop.\n\nPlease click the link below to set your hours:\n{{link}}\n\nThanks,\nStitch Team'
);
