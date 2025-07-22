/*
  # Adicionar campo de contacto telefónico

  1. Alterações
    - Adicionar campo `phone` à tabela `profiles`
    - Atualizar políticas se necessário

  2. Segurança
    - Manter as políticas RLS existentes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;