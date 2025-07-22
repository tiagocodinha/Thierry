/*
  # Configurar storage para vídeos

  1. Storage
    - Criar bucket 'videos' se não existir
    - Configurar políticas de acesso
    - Permitir upload para admins
    - Permitir visualização para utilizadores autenticados

  2. Políticas
    - Admins podem fazer upload
    - Utilizadores autenticados podem ver vídeos
*/

-- Criar bucket para vídeos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir que admins façam upload
CREATE POLICY "Admins can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir que admins atualizem vídeos
CREATE POLICY "Admins can update videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir que admins apaguem vídeos
CREATE POLICY "Admins can delete videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Política para permitir que utilizadores autenticados vejam vídeos
CREATE POLICY "Authenticated users can view videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'videos');