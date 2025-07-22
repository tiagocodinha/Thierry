/*
  # Adicionar storage para thumbnails

  1. Storage
    - Criar bucket 'thumbnails' para imagens
    - Configurar políticas de acesso

  2. Segurança
    - Admins podem fazer upload, atualizar e apagar thumbnails
    - Utilizadores autenticados podem visualizar thumbnails
*/

-- Criar bucket para thumbnails se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket thumbnails
-- Permitir que admins façam upload de thumbnails
CREATE POLICY "Admins can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir que admins atualizem thumbnails
CREATE POLICY "Admins can update thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'thumbnails' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir que admins apaguem thumbnails
CREATE POLICY "Admins can delete thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Permitir que todos os utilizadores autenticados vejam thumbnails
CREATE POLICY "Authenticated users can view thumbnails"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'thumbnails');