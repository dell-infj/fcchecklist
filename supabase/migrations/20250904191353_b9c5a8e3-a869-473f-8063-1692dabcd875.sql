-- Update the email validation function to allow inspector.local emails
CREATE OR REPLACE FUNCTION public.is_valid_email(email_address text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow inspector emails (*.@inspector.local)
  IF email_address ~* '\.@inspector\.local$' THEN
    RETURN true;
  END IF;
  
  -- Validação básica de email que aceita .online para outros casos
  RETURN email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND (
      email_address ~* '\.(com|org|net|edu|gov|mil|int|online|local|com\.br|org\.br|net\.br)$'
    );
END;
$function$;