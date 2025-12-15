-- Add required_interviewers_count to interview_templates
alter table interview_templates
add column required_interviewers_count integer default 1;

-- Add role_type and list_order to template_hiring_managers
alter table template_hiring_managers
add column role_type text check (role_type in ('mandatory', 'at_least_one', 'optional')) default 'mandatory',
add column list_order integer default 0;

-- Add additional_slot_ids to bookings to track multi-slot bookings (panels)
alter table bookings
add column additional_slot_ids uuid[] default array[]::uuid[];
