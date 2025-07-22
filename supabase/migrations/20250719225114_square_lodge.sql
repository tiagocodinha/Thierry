/*
  # Limpar todos os capítulos

  1. Operações
    - Remove todos os capítulos existentes da tabela chapters
    - Remove todo o progresso dos utilizadores relacionado aos capítulos
  
  2. Segurança
    - Operação segura que apenas limpa dados, não remove estrutura
*/

-- Remover todo o progresso dos utilizadores primeiro (devido à foreign key)
DELETE FROM user_progress;

-- Remover todos os capítulos
DELETE FROM chapters;