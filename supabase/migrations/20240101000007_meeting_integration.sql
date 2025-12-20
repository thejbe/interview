-- Add meeting details to bookings table
alter table bookings
add column meeting_link text,
add column meeting_platform text;

-- Add checking for platform types if we want to restrict them, or just leave as text for flexibility
-- For now, text is fine as the UI will likely provide a dropdown or we'll infer it.
-- But let's add a check constraint for known platforms if we want, or just leave open.
-- Plan said: 'zoom', 'google_meet', 'teams'. Let's stick to text for maximum flexibility but maybe add a comment.
comment on column bookings.meeting_platform is 'e.g. zoom, google_meet, teams';
