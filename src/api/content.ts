import api from '@/lib/axios';

// Types
export interface ContentBlock {
    _id: string;
    identifier: string;
    type: 'banner' | 'config' | 'blog' | 'page';
    title: string;
    content: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Blog {
    _id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    category?: string;
    tags?: string[];
    author: string;
    status: 'draft' | 'published';
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    isActive: boolean;
    order: number;
    createdAt: string;
}

// Content API endpoints
export const contentApi = {
    // Content Blocks
    getContent: async (identifier: string): Promise<ContentBlock> => {
        const response = await api.get(`/content/${identifier}`);
        return response.data;
    },

    saveContent: async (data: Omit<ContentBlock, '_id' | 'createdAt' | 'updatedAt'>): Promise<ContentBlock> => {
        const response = await api.post('/content', data);
        return response.data;
    },

    // Blogs
    getBlogs: async (params?: { 
        page?: number; 
        limit?: number; 
        status?: string;
        category?: string;
    }): Promise<{ blogs: Blog[]; total: number }> => {
        const response = await api.get('/blogs', { params });
        return response.data;
    },

    getBlogBySlug: async (slug: string): Promise<Blog> => {
        const response = await api.get(`/blogs/${slug}`);
        return response.data;
    },

    createBlog: async (data: Partial<Blog>): Promise<Blog> => {
        const response = await api.post('/blogs', data);
        return response.data;
    },

    updateBlog: async (id: string, data: Partial<Blog>): Promise<Blog> => {
        const response = await api.patch(`/blogs/${id}`, data);
        return response.data;
    },

    deleteBlog: async (id: string): Promise<void> => {
        await api.delete(`/blogs/${id}`);
    },

    // Categories
    getCategories: async (): Promise<Category[]> => {
        const response = await api.get('/categories');
        return response.data;
    },

    createCategory: async (data: Partial<Category>): Promise<Category> => {
        const response = await api.post('/categories', data);
        return response.data;
    },

    updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
        const response = await api.patch(`/categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id: string): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },

    // App Config
    getAppConfig: async (): Promise<Record<string, unknown>> => {
        const response = await api.get('/app-config');
        return response.data;
    },

    saveAppConfig: async (data: Record<string, unknown>): Promise<void> => {
        await api.post('/app-config', data);
    },

    // Site Config (public)
    getSiteConfig: async (): Promise<ContentBlock> => {
        const response = await api.get('/content/site-config');
        return response.data;
    },
};

export default contentApi;
