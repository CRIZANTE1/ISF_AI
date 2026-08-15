/**
 * Utilitários para upload de arquivos no Supabase Storage
 */

import { supabase } from '../lib/supabase';
import { createThumbnail, compressImage, blobToFile } from './imageCompression';
import { logger } from './logger';

/**
 * Resolve o user id da sessão — obrigatório para paths isolados por tenant.
 */
async function requireUserId(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.user?.id) {
    throw new Error('Usuário não autenticado. Faça login para enviar arquivos.');
  }
  return session.user.id;
}

/**
 * Prefixo de pasta do usuário: `{uid}/...`
 */
function userScopedPath(userId: string, folder: string, fileName: string): string {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  return cleanFolder ? `${userId}/${cleanFolder}/${fileName}` : `${userId}/${fileName}`;
}

/**
 * Faz upload de uma foto de evidência para o Supabase Storage
 * OBRIGATÓRIO: SEMPRE comprime a imagem antes do upload para garantir otimização
 * Inclui upload da imagem original comprimida e thumbnail
 * Path: `{userId}/{folder}/{fileName}` (isolamento RLS por pasta)
 */
export async function uploadEvidencePhoto(
  file: File,
  equipmentId: string,
  folder: string,
  createThumb: boolean = true
): Promise<{ url: string; thumbnailUrl?: string } | null> {
  try {
    const userId = await requireUserId();

    // OBRIGATÓRIO: SEMPRE comprime a imagem antes do upload
    logger.info('Comprimindo imagem de evidência (OBRIGATÓRIO)', 'storage', { 
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`, 
      fileName: file.name,
      fileType: file.type
    });

    const compressedBlob = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.8,
      format: 'avif', // Tenta AVIF primeiro, fallback para WebP
      maxSizeMB: 2,
      preferModernFormats: true,
    });

    // Converte blob comprimido para File
    const compressedFile = blobToFile(
      compressedBlob,
      file.name.replace(/\.[^/.]+$/, '.webp'),
      compressedBlob.type
    );

    const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    logger.info('Imagem de evidência comprimida com sucesso', 'storage', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      reduction: `${reduction}%`,
      fileName: file.name
    });

    // Gera um nome único para o arquivo
    const timestamp = new Date().getTime();
    const fileExt = compressedFile.name?.split('.').pop() || 'webp';
    const fileName = `${equipmentId}_${timestamp}.${fileExt}`;
    const filePath = userScopedPath(userId, folder, fileName);

    // Faz upload do arquivo comprimido
    const { data, error } = await supabase.storage
      .from('evidence-photos')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      logger.error('Erro ao fazer upload', 'storage', error);
      return null;
    }

    // URL pública (bucket privado: leitura via SDK autenticado / signed URL)
    const { data: urlData } = supabase.storage
      .from('evidence-photos')
      .getPublicUrl(filePath);

    let thumbnailUrl: string | undefined;

    // Cria e faz upload do thumbnail se solicitado
    if (createThumb && compressedFile.type.startsWith('image/')) {
      try {
        const thumbnailBlob = await createThumbnail(compressedFile, 200);
        const thumbnailFileName = `${equipmentId}_${timestamp}_thumb.webp`;
        const thumbnailPath = userScopedPath(userId, `${folder}/thumbnails`, thumbnailFileName);

        const thumbnailFile = blobToFile(
          thumbnailBlob,
          thumbnailFileName,
          thumbnailBlob.type
        );

        const { error: thumbError } = await supabase.storage
          .from('evidence-photos')
          .upload(thumbnailPath, thumbnailFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from('evidence-photos')
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbUrlData.publicUrl;
        }
      } catch (thumbError) {
        logger.warn('Erro ao criar thumbnail', 'storage', thumbError);
        // Não falha o upload principal se o thumbnail falhar
      }
    }

    return {
      url: urlData.publicUrl,
      thumbnailUrl,
    };
  } catch (error) {
    logger.error('Erro ao fazer upload da foto', 'storage', error);
    return null;
  }
}

/**
 * Faz upload de um arquivo genérico para o Supabase Storage
 * IMPORTANTE: Imagens são SEMPRE comprimidas antes do upload
 * Documentos são validados quanto ao tamanho máximo (10MB)
 * Path: `{userId}/{folder}/{fileName}` quando o bucket exige isolamento
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string,
  fileName?: string
): Promise<string | null> {
  try {
    const userId = await requireUserId();
    let fileToUpload = file;
    let finalFileName = fileName;

    const timestamp = new Date().getTime();

    // Se for uma imagem, SEMPRE comprime antes do upload
    if (file.type.startsWith('image/')) {
      try {
        logger.info('Comprimindo imagem antes do upload (OBRIGATÓRIO)', 'storage', {
          originalSize: file.size,
          fileName: file.name,
          fileType: file.type
        });

        const compressedBlob = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          format: 'avif',
          maxSizeMB: 2,
          preferModernFormats: true,
        });

        const compressedFileName = fileName || `file_${timestamp}.webp`;

        fileToUpload = blobToFile(
          compressedBlob,
          compressedFileName,
          compressedBlob.type
        );
        finalFileName = compressedFileName;

        const reduction = ((1 - fileToUpload.size / file.size) * 100).toFixed(1);
        logger.info('Imagem comprimida com sucesso', 'storage', {
          originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          compressedSize: `${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`,
          reduction: `${reduction}%`,
          fileName: file.name
        });
      } catch (compressionError) {
        logger.error('ERRO ao comprimir imagem - upload cancelado', 'storage', compressionError);
        throw new Error('Falha ao comprimir imagem. Por favor, tente novamente.');
      }
    } else {
      // Para documentos não-imagem, valida tamanho máximo (10MB)
      const maxDocumentSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxDocumentSize) {
        logger.error('Documento excede tamanho máximo', 'storage', {
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          maxSize: '10MB'
        });
        throw new Error(`Arquivo muito grande. Tamanho máximo: 10MB. Tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }
      
      logger.info('Documento validado (não será comprimido)', 'storage', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type
      });
    }

    const fileExt = fileToUpload.name?.split('.').pop() || 'bin';
    const finalFileNameToUse = finalFileName || fileName || `file_${timestamp}.${fileExt}`;
    // Isolamento por usuário para buckets de evidência/avatares
    const needsUserScope = bucket === 'evidence-photos' || bucket === 'avatars';
    const filePath = needsUserScope
      ? userScopedPath(userId, folder, finalFileNameToUse)
      : (folder ? `${folder}/${finalFileNameToUse}` : finalFileNameToUse);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      logger.error('Erro ao fazer upload', 'storage', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    logger.error('Erro ao fazer upload do arquivo', 'storage', error);
    return null;
  }
}
