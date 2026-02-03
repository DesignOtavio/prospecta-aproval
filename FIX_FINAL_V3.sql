-- ============================================
-- SCRIPT FINAL DE CORREÇÃO (V3)
-- Execute este script para garantir que TUDO funcione
-- ============================================

-- 1. GARANTE TABELA DE LOGS (Se não existir)
CREATE TABLE IF NOT EXISTS public.prpsct_activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.prpsct_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.prpsct_profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS em logs
ALTER TABLE public.prpsct_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ver Logs" ON public.prpsct_activity_logs;
CREATE POLICY "Ver Logs" ON public.prpsct_activity_logs FOR SELECT USING (true); -- Simplificado para debug

-- 2. CORREÇÃO DEFINITIVA DE PERMISSÕES DE POST
-- Removemos as políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Admins podem gerenciar todas as postagens" ON public.prpsct_posts;
DROP POLICY IF EXISTS "Admins podem gerenciar todas as postagens_v2" ON public.prpsct_posts;
DROP POLICY IF EXISTS "Clientes podem ver suas postagens" ON public.prpsct_posts;
DROP POLICY IF EXISTS "Clientes podem ver suas postagens_v2" ON public.prpsct_posts;
DROP POLICY IF EXISTS "Admins can manage posts" ON public.prpsct_posts;

-- Ativa RLS
ALTER TABLE public.prpsct_posts ENABLE ROW LEVEL SECURITY;

-- --> Política de ADMIN (Baseada em tabela real, não JWT cacheado)
CREATE POLICY "Admins Total Access"
ON public.prpsct_posts
FOR ALL
USING (
    EXISTS ( SELECT 1 FROM public.prpsct_profiles WHERE id = auth.uid() AND role = 'admin' )
);

-- --> Política de CLIENTE
CREATE POLICY "Client View SQL"
ON public.prpsct_posts
FOR SELECT
USING (
    client_id IN ( SELECT id FROM public.prpsct_clients WHERE user_id = auth.uid() )
);

-- 3. CORREÇÃO DE STORAGE (Garantia Final)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'post-media', 
    'post-media', 
    true, 
    104857600, 
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Upload Policy" ON storage.objects;
CREATE POLICY "Upload Policy" ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'post-media' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "View Policy" ON storage.objects;
CREATE POLICY "View Policy" ON storage.objects FOR SELECT 
USING ( bucket_id = 'post-media' );

-- 4. FORÇAR PERFIL ADMIN (Opcional - execute apenas se seu user for o admin)
-- Substitua 'SEU-ID-AQUI' pelo seu UID se necessário, ou confie no registro
-- UPDATE public.prpsct_profiles SET role = 'admin' WHERE id = auth.uid();

-- 5. RELOAD
NOTIFY pgrst, 'reload config';
