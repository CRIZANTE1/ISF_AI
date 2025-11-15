# Otimizações de Imagens - Documentação Completa

## 📋 Visão Geral

Este documento descreve todas as otimizações de imagens implementadas no sistema, incluindo compressão, cache, lazy loading e progressive loading.

## 🚀 Funcionalidades Implementadas

### 1. **Compressão de Imagens** (`src/utils/imageCompression.ts`)

#### Características:
- ✅ Redimensionamento automático (máx. 1920x1920px)
- ✅ Conversão para formatos modernos (WebP com fallback)
- ✅ Ajuste de qualidade (padrão 80%)
- ✅ Limite de tamanho máximo (padrão 2MB)
- ✅ Compressão progressiva se necessário
- ✅ Suporte a múltiplos formatos (JPEG, PNG, WebP)

#### Uso:
```typescript
import { compressImage } from '../utils/imageCompression';

const compressedBlob = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'webp',
  maxSizeMB: 2,
  preferModernFormats: true,
});
```

### 2. **Cache de Imagens** (`src/utils/imageCache.ts`)

#### Características:
- ✅ Armazenamento em IndexedDB
- ✅ Cache baseado em hash SHA-256 do arquivo
- ✅ Expiração automática (7 dias)
- ✅ Limpeza de cache expirado
- ✅ Estatísticas de cache

#### Benefícios:
- **Performance**: Imagens já comprimidas são reutilizadas instantaneamente
- **Economia**: Evita reprocessamento desnecessário
- **UX**: Uploads subsequentes são muito mais rápidos

#### Uso:
```typescript
import { getCachedImage, cacheImage, getCacheStats } from '../utils/imageCache';

// Verifica cache automaticamente na compressão
// Estatísticas
const stats = await getCacheStats();
console.log(`Cache: ${stats.totalItems} itens, ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
```

### 3. **Lazy Loading** (`src/components/LazyImage.tsx`)

#### Características:
- ✅ Lazy loading nativo (`loading="lazy"`) quando suportado
- ✅ Fallback com Intersection Observer
- ✅ Carregamento 50px antes de aparecer
- ✅ Transição suave de opacidade
- ✅ Suporte a placeholder e fallback

#### Uso:
```typescript
import LazyImage from '../components/LazyImage';

<LazyImage
  src={imageUrl}
  alt="Descrição"
  placeholder="/placeholder.jpg"
  fallback="/fallback.jpg"
/>
```

### 4. **Progressive Loading (Blur-up)** (`src/components/ProgressiveImage.tsx`)

#### Características:
- ✅ Efeito blur-up durante carregamento
- ✅ Geração automática de versão borrada
- ✅ Transição suave da versão borrada para a imagem final
- ✅ Placeholder enquanto carrega
- ✅ Suporte a thumbnails

#### Uso:
```typescript
import ProgressiveImage from '../components/ProgressiveImage';

<ProgressiveImage
  src={imageUrl}
  alt="Descrição"
  thumbnail={thumbnailUrl}
  blurDataURL={blurDataURL} // Opcional
/>
```

### 5. **Thumbnails Automáticos** (`src/utils/storage.ts`)

#### Características:
- ✅ Geração automática de thumbnails (200x200px)
- ✅ Upload separado em pasta `thumbnails/`
- ✅ Não falha o upload principal se thumbnail falhar
- ✅ Retorna URLs de imagem original e thumbnail

#### Uso:
```typescript
import { uploadEvidencePhoto } from '../utils/storage';

const result = await uploadEvidencePhoto(file, equipmentId, folder);
// result.url - URL da imagem original
// result.thumbnailUrl - URL do thumbnail (opcional)
```

### 6. **Otimização de Imagens Existentes** (`src/utils/optimizeExistingImages.ts`)

#### Características:
- ✅ Otimiza imagens já armazenadas no banco
- ✅ Processamento em lotes
- ✅ Callback de progresso
- ✅ Relatório de erros
- ✅ Cálculo de redução de tamanho

#### Uso:
```typescript
import { optimizeTableImages } from '../utils/optimizeExistingImages';

const result = await optimizeTableImages(
  'extintores',
  'link_foto_nao_conformidade',
  {
    batchSize: 10,
    createThumbnail: true,
    onProgress: (current, total) => {
      console.log(`Progresso: ${current}/${total}`);
    }
  }
);

console.log(`Otimizadas: ${result.optimized}/${result.total}`);
console.log(`Redução total: ${(result.totalSizeReduction / 1024 / 1024).toFixed(2)} MB`);
```

## 📊 Componentes Atualizados

### PhotoUpload (`src/components/PhotoUpload.tsx`)
- ✅ Compressão automática antes do upload
- ✅ Indicador visual de compressão
- ✅ Mostra percentual de redução
- ✅ Feedback durante o processo

### EquipmentDetailPage (`src/pages/EquipmentDetailPage.tsx`)
- ✅ Usa ProgressiveImage para fotos de evidência
- ✅ Lazy loading automático

### Profile (`src/pages/Profile.tsx`)
- ✅ Compressão de avatares (400x400px)
- ✅ Lazy loading de avatares

### DashboardHeader (`src/components/DashboardHeader.tsx`)
- ✅ Lazy loading de avatares

## 🎯 Benefícios

### Performance
- **60-80% de redução** no tamanho das imagens
- **Carregamento mais rápido** com lazy loading
- **Menos uso de banda** com compressão e cache

### Custos
- **Menos armazenamento** no Supabase
- **Menos transferência** de dados
- **Economia significativa** em escala

### UX
- **Carregamento progressivo** (blur-up effect)
- **Feedback visual** durante compressão
- **Thumbnails** para previews rápidos
- **Transições suaves**

## 📈 Métricas Esperadas

### Antes das Otimizações:
- Imagem média: **3-5 MB**
- Tempo de upload: **10-30 segundos**
- Carregamento: **Bloqueante**

### Depois das Otimizações:
- Imagem média: **200-800 KB** (60-80% menor)
- Tempo de upload: **2-5 segundos**
- Carregamento: **Progressivo e não-bloqueante**

## 🔧 Configuração

### Opções de Compressão

```typescript
interface CompressionOptions {
  maxWidth?: number;        // Largura máxima (padrão: 1920)
  maxHeight?: number;       // Altura máxima (padrão: 1920)
  quality?: number;         // Qualidade 0.1-1.0 (padrão: 0.8)
  format?: 'jpeg' | 'webp' | 'avif' | 'png';
  maxSizeMB?: number;       // Tamanho máximo em MB (padrão: 2)
  preferModernFormats?: boolean; // Tenta WebP/AVIF primeiro (padrão: true)
}
```

### Cache

- **Duração**: 7 dias
- **Armazenamento**: IndexedDB
- **Limpeza**: Automática ao verificar itens expirados

## 🚨 Notas Importantes

### AVIF
- O navegador não suporta AVIF nativamente no `canvas.toBlob()`
- Quando AVIF é solicitado, usa WebP como fallback
- A função `supportsAVIF()` verifica suporte do navegador para exibição

### Cache
- O cache é baseado no hash do arquivo
- Arquivos idênticos reutilizam o cache
- Cache expira após 7 dias automaticamente

### Progressive Loading
- Requer CORS habilitado para gerar blur automático
- Se CORS falhar, usa placeholder SVG
- Thumbnails podem ser fornecidos manualmente

## 📝 Próximos Passos (Opcionais)

1. **Biblioteca AVIF**: Integrar biblioteca externa para codificação AVIF real
2. **Service Worker**: Cache mais agressivo com Service Worker
3. **CDN**: Integrar CDN para servir imagens otimizadas
4. **WebP Server**: Servidor que converte automaticamente para WebP

## 🔍 Troubleshooting

### Imagens não comprimem
- Verifique se o arquivo é uma imagem válida
- Verifique o console para erros
- Tente reduzir a qualidade manualmente

### Cache não funciona
- Verifique se IndexedDB está habilitado no navegador
- Limpe o cache manualmente se necessário
- Verifique o console para erros de permissão

### Blur-up não aparece
- Verifique se CORS está habilitado na origem da imagem
- Forneça `blurDataURL` ou `thumbnail` manualmente
- O placeholder será usado como fallback

## 📚 Referências

- [WebP Format](https://developers.google.com/speed/webp)
- [AVIF Format](https://avif.io/)
- [Lazy Loading Images](https://web.dev/lazy-loading-images/)
- [Progressive Image Loading](https://www.smashingmagazine.com/2018/02/progressive-image-loading-user-perceived-performance/)

