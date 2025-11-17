/**
 * Utilitário para otimizar imagens existentes no banco de dados
 * 
 * Este script pode ser executado manualmente para otimizar imagens já armazenadas
 */

import { supabase } from '../lib/supabase';
import { compressImage, createThumbnail } from './imageCompression';
import { uploadFile } from './storage';
import { logger } from './logger';

interface ImageRecord {
  id: string;
  url: string;
  table: string;
  column: string;
}

/**
 * Baixa uma imagem de uma URL
 */
async function downloadImage(url: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  const fileName = url.split('/').pop() || 'image.jpg';
  return new File([blob], fileName, { type: blob.type });
}

/**
 * Otimiza uma imagem existente
 */
export async function optimizeExistingImage(
  record: ImageRecord,
  options: {
    createThumbnail?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<{
  success: boolean;
  originalSize?: number;
  optimizedSize?: number;
  thumbnailSize?: number;
  error?: string;
}> {
  try {
    // Baixa a imagem original
    const originalFile = await downloadImage(record.url);
    const originalSize = originalFile.size;

    // Comprime a imagem
    const compressedBlob = await compressImage(originalFile, {
      maxWidth: options.maxWidth || 1920,
      maxHeight: options.maxHeight || 1920,
      quality: options.quality || 0.8,
      format: 'avif',
      preferModernFormats: true,
    });

    const optimizedSize = compressedBlob.size;

    // Converte blob para File
    const optimizedFile = new File(
      [compressedBlob],
      originalFile.name.replace(/\.[^/.]+$/, '.avif'),
      { type: compressedBlob.type }
    );

    // Faz upload da imagem otimizada
    const folder = 'optimized';
    const optimizedUrl = await uploadFile(
      optimizedFile,
      'evidence-photos',
      folder
    );

    if (!optimizedUrl) {
      return {
        success: false,
        error: 'Falha ao fazer upload da imagem otimizada',
      };
    }

    // Atualiza o registro no banco
    const { error: updateError } = await supabase
      .from(record.table)
      .update({
        [record.column]: optimizedUrl,
      })
      .eq('id', record.id);

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    let thumbnailSize: number | undefined;

    // Cria thumbnail se solicitado
    if (options.createThumbnail) {
      try {
        const thumbnailBlob = await createThumbnail(originalFile, 200);
        thumbnailSize = thumbnailBlob.size;

        const thumbnailFile = new File(
          [thumbnailBlob],
          `${originalFile.name.replace(/\.[^/.]+$/, '')}_thumb.webp`,
          { type: thumbnailBlob.type }
        );

        const thumbnailUrl = await uploadFile(
          thumbnailFile,
          'evidence-photos',
          `${folder}/thumbnails`
        );

        // Salva URL do thumbnail em uma coluna separada (se existir)
        const thumbnailColumn = `${record.column}_thumbnail`;
        const { data: tableInfo } = await supabase
          .from(record.table)
          .select('*')
          .limit(1)
          .single();

        if (tableInfo && thumbnailColumn in tableInfo) {
          await supabase
            .from(record.table)
            .update({
              [thumbnailColumn]: thumbnailUrl,
            })
            .eq('id', record.id);
        }
      } catch (thumbError) {
        logger.warn('Erro ao criar thumbnail', 'storage', thumbError);
        // Não falha a otimização se o thumbnail falhar
      }
    }

    return {
      success: true,
      originalSize,
      optimizedSize,
      thumbnailSize,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

/**
 * Otimiza todas as imagens de uma tabela
 */
export async function optimizeTableImages(
  table: string,
  column: string,
  options: {
    batchSize?: number;
    createThumbnail?: boolean;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<{
  total: number;
  optimized: number;
  failed: number;
  totalSizeReduction: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const batchSize = options.batchSize || 10;
  const errors: Array<{ id: string; error: string }> = [];
  let optimized = 0;
  let failed = 0;
  let totalSizeReduction = 0;

  try {
    // Busca todos os registros com imagens
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${column}`)
      .not(column, 'is', null);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        total: 0,
        optimized: 0,
        failed: 0,
        totalSizeReduction: 0,
        errors: [],
      };
    }

    const total = data.length;

    // Processa em lotes
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (record) => {
          if (!record[column]) return;

          const result = await optimizeExistingImage(
            {
              id: record.id,
              url: record[column],
              table,
              column,
            },
            {
              createThumbnail: options.createThumbnail,
            }
          );

          if (result.success) {
            optimized++;
            if (result.originalSize && result.optimizedSize) {
              totalSizeReduction += result.originalSize - result.optimizedSize;
            }
          } else {
            failed++;
            errors.push({
              id: record.id,
              error: result.error || 'Erro desconhecido',
            });
          }

          // Callback de progresso
          if (options.onProgress) {
            options.onProgress(optimized + failed, total);
          }
        })
      );

      // Pequena pausa entre lotes para não sobrecarregar
      if (i + batchSize < data.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      total,
      optimized,
      failed,
      totalSizeReduction,
      errors,
    };
  } catch (error: any) {
    throw new Error(`Erro ao otimizar imagens: ${error.message}`);
  }
}

/**
 * Limpa imagens antigas não otimizadas (opcional)
 * ATENÇÃO: Use com cuidado, pode deletar imagens importantes
 */
export async function cleanupOldImages(
  table: string,
  column: string,
  keepOptimized: boolean = true
): Promise<number> {
  // Esta função deve ser implementada com cuidado
  // e apenas após garantir que todas as imagens foram otimizadas
    logger.warn('Função de limpeza não implementada por segurança', 'storage');
  return 0;
}

