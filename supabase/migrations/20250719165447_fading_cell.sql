/*
  # Fix user profile creation trigger

  1. Updates
    - Fix the handle_new_user() function to properly access user metadata
    - Ensure proper error handling for profile creation
    - Handle cases where name might be null or empty
    
  2. Security
    - Maintains existing RLS policies
    - Ensures proper user profile creation
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Get email from the new user record
  user_email := NEW.email;
  
  -- Try to get name from raw_user_meta_data, fallback to email prefix
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1)
  );
  
  -- Ensure we have a valid name
  IF user_name IS NULL OR user_name = '' THEN
    user_name := split_part(user_email, '@', 1);
  END IF;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    CASE 
      WHEN user_email = 'admin@thierrysantos.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();