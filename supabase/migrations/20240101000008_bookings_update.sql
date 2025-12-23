-- Update bookings table for new flows
ALTER TABLE bookings 
ADD COLUMN template_id uuid REFERENCES interview_templates(id),
ADD COLUMN invite_token text UNIQUE;

-- Make slot_id nullable for "Pending" invites that haven't picked a slot yet
ALTER TABLE bookings 
ALTER COLUMN slot_id DROP NOT NULL;

-- Add index for invite_token lookups
CREATE INDEX idx_bookings_invite_token ON bookings(invite_token);
