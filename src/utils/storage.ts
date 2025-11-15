/**
 * Utilitários para upload de arquivos no Supabase Storage
 */

import { supabase } from '../lib/supabase';
import { createThumbnail } from './imageCompression';

/**
 * Faz upload de uma foto de evidência para o Supabase Storage
 * Inclui upload da imagem original e thumbnail
 */
export async function uploadEvidencePhoto(
  file: File,
  equipmentId: string,
  folder: string,
  createThumb: boolean = true
): Promise<{ url: string; thumbnailUrl?: string } | null> {
  try {
    // Gera um nome único para o arquivo
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop() || 'webp';
    const fileName = `${equipmentId}_${timestamp}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Faz upload do arquivo original
    const { data, error } = await supabase.storage
      .from('evidence-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    }

    // Obtém a URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('evidence-photos')
      .getPublicUrl(filePath);

    let thumbnailUrl: string | undefined;

    // Cria e faz upload do thumbnail se solicitado
    if (createThumb && file.type.startsWith('image/')) {
      try {
        const thumbnailBlob = await createThumbnail(file, 200);
        const thumbnailFileName = `${equipmentId}_${timestamp}_thumb.webp`;
        const thumbnailPath = `${folder}/thumbnails/${thumbnailFileName}`;

        const { error: thumbError } = await supabase.storage
          .from('evidence-photos')
          .upload(thumbnailPath, thumbnailBlob, {
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
        console.warn('Erro ao criar thumbnail:', thumbError);
        // Não falha o upload principal se o thumbnail falhar
      }
    }

    return {
      url: urlData.publicUrl,
      thumbnailUrl,
    };
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    return null;
  }
}

/**
 * Faz upload de um arquivo genérico para o Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string,
  fileName?: string
): Promise<string | null> {
  try {
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const finalFileName = fileName || `file_${timestamp}.${fileExt}`;
    const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    return null;
  }
}

