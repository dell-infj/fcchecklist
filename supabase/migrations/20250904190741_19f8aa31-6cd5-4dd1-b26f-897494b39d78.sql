-- Allow admins to delete team profiles
CREATE POLICY IF NOT EXISTS "Admins can delete team profiles"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM get_user_profile_data() admin_data(profile_id, profile_role, profile_unique_id, profile_company_ids)
    WHERE admin_data.profile_role = 'admin'
      AND (
        profiles.unique_id = admin_data.profile_unique_id
        OR profiles.unique_id = ANY (admin_data.profile_company_ids)
      )
  )
);
