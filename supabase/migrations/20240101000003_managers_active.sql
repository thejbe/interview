-- Add active column to hiring_managers
alter table hiring_managers 
add column active boolean default true;
