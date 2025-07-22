/*
  # Definir utilizador admin

  1. Atualização
    - Define o email 'admin@thierrysantos.com' como admin
    - Permite que este utilizador tenha acesso total ao painel de administração

  2. Nota
    - Substitua o email pelo email real que pretende usar como admin
    - O utilizador deve estar registado na plataforma primeiro
*/

-- Atualizar o utilizador para admin (substitua pelo email correto)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@thierrysantos.com';

-- Se quiser definir outro email como admin, use:
-- UPDATE profiles SET role = 'admin' WHERE email = 'seu-email@exemplo.com';