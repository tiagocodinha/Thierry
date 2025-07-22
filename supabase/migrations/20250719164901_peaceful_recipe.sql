/*
  # Esquema inicial da plataforma Thierry Santos

  1. Novas Tabelas
    - `profiles`
      - `id` (uuid, primary key, referencia auth.users)
      - `email` (text, unique)
      - `name` (text)
      - `role` (enum: user, admin)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chapters`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `video_url` (text)
      - `thumbnail_url` (text, nullable)
      - `duration` (text, nullable)
      - `order` (integer)
      - `is_published` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `questions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `user_name` (text)
      - `user_email` (text)
      - `subject` (text)
      - `message` (text)
      - `is_answered` (boolean)
      - `admin_response` (text, nullable)
      - `created_at` (timestamp)
      - `answered_at` (timestamp, nullable)
    
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `chapter_id` (uuid, foreign key)
      - `watched` (boolean)
      - `watch_time` (integer)
      - `completed_at` (timestamp, nullable)
      - `created_at` (timestamp)

  2. Segurança
    - Ativar RLS em todas as tabelas
    - Políticas para utilizadores autenticados
    - Políticas específicas para administradores
    - Trigger para atualizar updated_at automaticamente

  3. Dados iniciais
    - Criar perfil de administrador padrão
    - Capítulos de exemplo
*/

-- Criar enum para roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Tabela de perfis de utilizadores
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de capítulos
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  duration text,
  "order" integer NOT NULL,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de perguntas
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_answered boolean DEFAULT false,
  admin_response text,
  created_at timestamptz DEFAULT now(),
  answered_at timestamptz
);

-- Tabela de progresso do utilizador
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  watched boolean DEFAULT false,
  watch_time integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Ativar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Utilizadores podem ver o próprio perfil"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Utilizadores podem atualizar o próprio perfil"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para chapters
CREATE POLICY "Utilizadores autenticados podem ver capítulos publicados"
  ON chapters
  FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins podem gerir todos os capítulos"
  ON chapters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para questions
CREATE POLICY "Utilizadores podem ver as próprias perguntas"
  ON questions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Utilizadores podem criar perguntas"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins podem ver e responder a todas as perguntas"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para user_progress
CREATE POLICY "Utilizadores podem ver o próprio progresso"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Utilizadores podem atualizar o próprio progresso"
  ON user_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins podem ver todo o progresso"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente após registo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.email = 'admin@thierrysantos.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir capítulos de exemplo
INSERT INTO chapters (title, description, video_url, thumbnail_url, duration, "order", is_published) VALUES
(
  'Introdução aos Fundamentos',
  'Aprenda os conceitos básicos e fundamentais necessários para começar sua jornada de aprendizagem. Este capítulo cobre os princípios essenciais que servirão de base para todo o curso.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=600',
  '15:30',
  1,
  true
),
(
  'Conceitos Intermediários',
  'Explore conceitos mais avançados e desenvolva suas habilidades para o próximo nível. Aqui você aprenderá técnicas que irão expandir significativamente seu conhecimento.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
  '22:45',
  2,
  true
),
(
  'Técnicas Avançadas',
  'Domine técnicas avançadas e torne-se um especialista na área. Este capítulo apresenta metodologias sofisticadas para profissionais experientes.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600',
  '18:20',
  3,
  true
),
(
  'Aplicações Práticas',
  'Aplique tudo o que aprendeu em projetos reais e situações do dia a dia. Veja como transformar teoria em prática através de exemplos concretos.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600',
  '25:10',
  4,
  true
),
(
  'Projeto Final',
  'Desenvolva um projeto completo aplicando todos os conhecimentos adquiridos. Este é o momento de consolidar sua aprendizagem através da prática.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=600',
  '30:15',
  5,
  true
);