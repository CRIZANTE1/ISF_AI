/**
 * Utilitários para upload de arquivos no Supabase Storage
 */

import { supabase } from '../lib/supabase';

/**
 * Faz upload de uma foto de evidência para o Supabase Storage
 */
export async function uploadEvidencePhoto(
  file: File,
  equipmentId: string,
  folder: string
): Promise<string | null> {
  try {
    // Gera um nome único para o arquivo
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${equipmentId}_${timestamp}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Faz upload do arquivo
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

    return urlData.publicUrl;
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

