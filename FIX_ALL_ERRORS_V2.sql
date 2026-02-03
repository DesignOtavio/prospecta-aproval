-- ============================================
-- SCRIPT DE CORREÇÃO TOTAL (V2)
-- Siga a ordem exata de execução
-- ============================================

-- 1. CORREÇÃO DE STORAGE (BUCKETS)
-- Cria o bucket 'post-media' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'post-media', 
    'post-media', 
    true, 
    104857600, -- 100MB Limit
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

-- Garante que o bucket 'avatars' também exista
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg']) -- 2MB Limit
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE STORAGE (Permissões de Upload)
-- Remove policies antigas para evitar conflito
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Any Upload" ON storage.objects;

-- Permite visualização pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('post-media', 'avatars') );

-- Permite upload para usuários logados
CREATE POLICY "Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK ( 
    bucket_id IN ('post-media', 'avatars') 
    AND auth.role() = 'authenticated' 
);

-- Permite delete/update apenas para o dono ou admin (Opcional, mas recomendado)
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING ( 
    bucket_id IN ('post-media', 'avatars') 
    AND (auth.uid() = owner OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
);

-- 3. CORREÇÃO DE SCHEMA (Colunas Faltantes em Clients)
-- Garante que todas as colunas necessárias existam
DO $$
BEGIN
    -- company_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prpsct_clients' AND column_name = 'company_name') THEN
        ALTER TABLE public.prpsct_clients ADD COLUMN company_name TEXT;
    END IF;

    -- logo_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prpsct_clients' AND column_name = 'logo_url') THEN
        ALTER TABLE public.prpsct_clients ADD COLUMN logo_url TEXT;
    END IF;

    -- phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prpsct_clients' AND column_name = 'phone') THEN
        ALTER TABLE public.prpsct_clients ADD COLUMN phone TEXT;
    END IF;

    -- webhook_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prpsct_clients' AND column_name = 'webhook_url') THEN
        ALTER TABLE public.prpsct_clients ADD COLUMN webhook_url TEXT;
    END IF;

     -- webhook_secret
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prpsct_clients' AND column_name = 'webhook_secret') THEN
        ALTER TABLE public.prpsct_clients ADD COLUMN webhook_secret TEXT;
    END IF;
END $$;

-- 4. CORREÇÃO DE POLICIES (RLS - Recursão Infinita)
-- Remove policies problemáticas anteriores
DROP POLICY IF EXISTS "Admins podem gerenciar todas as postagens" ON public.prpsct_posts;
DROP POLICY IF EXISTS "Clientes podem ver suas postagens" ON public.prpsct_posts;
DROP POLICY IF EXISTS "Admins can manage posts" ON public.prpsct_posts;

-- Ativar RLS se não estiver
ALTER TABLE public.prpsct_posts ENABLE ROW LEVEL SECURITY;

-- Policy OTIMIZADA para Admins (Usa JWT Metadata para evitar SELECT recursivo em profiles)
CREATE POLICY "Admins podem gerenciar todas as postagens_v2"
ON public.prpsct_posts
FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Policy OTIMIZADA para Clientes
CREATE POLICY "Clientes podem ver suas postagens_v2"
ON public.prpsct_posts
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.prpsct_clients WHERE user_id = auth.uid()
  )
);

-- 5. RELOAD SCHEMA
NOTIFY pgrst, 'reload config';
