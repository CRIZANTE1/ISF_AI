# Configuração do Supabase Storage para Upload de Fotos

## Bucket Necessário

Este aplicativo requer um bucket do Supabase Storage chamado `evidence-photos` para armazenar fotos de não conformidades e evidências de inspeções.

## Status

✅ **Bucket criado automaticamente via migração SQL**

O bucket `evidence-photos` foi criado automaticamente através da migração `20250116000000_create_evidence_photos_bucket.sql`. Esta migração já foi aplicada ao projeto.

## Como Criar o Bucket (alternativa)

Se precisar criar manualmente ou em outro projeto:

### Via Dashboard do Supabase:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá até **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure o bucket:
   - **Name**: `evidence-photos`
   - **Public bucket**: Ative esta opção se você quiser que as fotos sejam acessíveis publicamente (recomendado para evidências de inspeções)
   - **File size limit**: Configure conforme necessário (recomendado: 5MB)
   - **Allowed MIME types**: `image/*`

### Via Supabase CLI (se disponível):

```bash
supabase storage create evidence-photos --public
```

## Estrutura de Pastas

O bucket `evidence-photos` organiza as fotos por tipo de equipamento:

- `nao_conformidade_extintor/` - Fotos de não conformidades em extintores
- `nao_conformidade_chuveiro/` - Fotos de não conformidades em chuveiros/lava-olhos
- `nao_conformidade_camara_espuma/` - Fotos de não conformidades em câmaras de espuma
- `nao_conformidade_alarme/` - Fotos de não conformidades em sistemas de alarme
- `nao_conformidade_canhao_monitor/` - Fotos de não conformidades em canhões monitores

## Políticas de Acesso (RLS)

Configure as políticas do bucket para permitir:

1. **Upload**: Usuários autenticados podem fazer upload
2. **Download**: Usuários autenticados podem fazer download (ou público se o bucket for público)

### Exemplo de Políticas SQL:

```sql
-- Política para upload (INSERT)
CREATE POLICY "Authenticated users can upload evidence photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence-photos' AND
  auth.role() = 'authenticated'
);

-- Política para leitura (SELECT)
CREATE POLICY "Authenticated users can read evidence photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence-photos' AND
  auth.role() = 'authenticated'
);
```

## Testando o Upload

Após criar o bucket, você pode testar o upload de fotos através da interface de inspeção do aplicativo.

