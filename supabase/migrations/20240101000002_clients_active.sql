-- Add active column to companies
alter table companies 
add column active boolean default true;
