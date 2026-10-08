import { apiClient } from './client';

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

export async function uploadImage(file: File, folder: string = 'general'): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  return apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function uploadBase64Image(data: string, folder: string = 'general'): Promise<UploadResult> {
  return apiClient.post('/upload/base64', { data, folder });
}

export async function deleteUpload(publicId: string) {
  return apiClient.delete('/upload', { data: { publicId } });
}
