-- Update the insert policy for checklists to allow admins to create checklists for any inspector
DROP POLICY IF EXISTS "Inspectors can insert checklists" ON public.checklists;

CREATE POLICY "Users can insert checklists" 
ON public.checklists 
FOR INSERT 
WITH CHECK (
  -- Allow if user is an inspector creating their own checklist
  (inspector_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR
  -- Allow if user is an admin and the checklist is for their company
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND (
      unique_id = checklists.unique_id 
      OR checklists.unique_id = ANY(company_ids)
    )
  ))
);