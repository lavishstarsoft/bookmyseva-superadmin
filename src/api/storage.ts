import api from '@/lib/axios';

// Types
export interface UploadResponse {
    success: boolean;
    url: string;
    key: string;
    filename: string;
    mimetype: string;
    size: number;
}

export interface StorageFile {
    key: string;
    url: string;
    size: number;
    lastModified: string;
    contentType?: string;
}

// Upload/Storage API endpoints
export const storageApi = {
    // Image upload
    uploadImage: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post<UploadResponse>('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });
        return response.data;
    },

    // Generic file upload
    uploadFile: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<UploadResponse>('/upload-file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });
        return response.data;
    },

    // List files in storage
    listFiles: async (prefix?: string): Promise<StorageFile[]> => {
        const response = await api.get<StorageFile[]>('/storage/files', {
            params: { prefix },
        });
        return response.data;
    },

    // Delete file
    deleteFile: async (key: string): Promise<void> => {
        await api.delete(`/storage/files/${encodeURIComponent(key)}`);
    },

    // Bulk delete files
    deleteFiles: async (keys: string[]): Promise<void> => {
        await api.post('/storage/files/bulk-delete', { keys });
    },

    // Get signed URL for private file
    getSignedUrl: async (key: string, expiresIn?: number): Promise<{ url: string }> => {
        const response = await api.get(`/storage/signed-url/${encodeURIComponent(key)}`, {
            params: { expiresIn },
        });
        return response.data;
    },
};

export default storageApi;
