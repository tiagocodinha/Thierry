/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop existing recursive policies on profiles table
    - Create simple, non-recursive policies that use auth.uid() directly
    - Avoid querying profiles table from within profiles policies
    - Use auth.jwt() for role-based access instead of profiles table lookup

  2. Policy Structure
    - Users can read/update their own profile using auth.uid()
    - Admins identified by email in auth.jwt() claims
    - No circular dependencies or self-referencing queries
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Utilizadores podem ver o próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Utilizadores podem atualizar o próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@thierrysantos.com'
    OR auth.uid() = id
  );

CREATE POLICY "Admin can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@thierrysantos.com'
    OR auth.uid() = id
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@thierrysantos.com'
    OR auth.uid() = id
  );

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);