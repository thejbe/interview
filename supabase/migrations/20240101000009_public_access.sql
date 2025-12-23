-- Enable public read access for candidate booking flow
-- Candidates need to see templates, slots, companies, and managers to book an interview

-- Interview Templates
CREATE POLICY "Enable public read access" ON interview_templates FOR SELECT USING (true);

-- Slots
CREATE POLICY "Enable public read access" ON slots FOR SELECT USING (true);

-- Hiring Managers (Needed to see who the interview is with)
CREATE POLICY "Enable public read access" ON hiring_managers FOR SELECT USING (true);

-- Template Hiring Managers (Needed for panel rules)
CREATE POLICY "Enable public read access" ON template_hiring_managers FOR SELECT USING (true);

-- Companies (Needed for branding)
CREATE POLICY "Enable public read access" ON companies FOR SELECT USING (true);
