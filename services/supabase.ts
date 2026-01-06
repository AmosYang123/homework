import { createClient } from '@supabase/supabase-js';
import { Chat, StyleTemplate, User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase keys missing. Cloud features will be disabled.');
}

// Use placeholders to prevent crash if keys are missing
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

export const supabaseService = {
    /**
     * Diagnostic: Check if we can actually reach the database table
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase.from('chats').select('count', { count: 'exact', head: true }).limit(1);
            if (error) throw error;
            return { success: true, message: 'Database Connection Verified' };
        } catch (err: any) {
            console.error('DATABASE DIAGNOSIS FAILED:', err);
            return {
                success: false,
                message: err.message || 'Database Connectivity Error'
            };
        }
    },

    // Profiles
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) console.error('Profile fetch error:', error);
        return data;
    },

    async ensureProfile(user: User) {
        // Try to insert, if it exists, it will just fail/do nothing
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                username: user.name,
                updated_at: new Date().toISOString()
            });
        if (error) console.error('Force profile creation failed:', error);
    },

    // Chats
    async getChats(userId: string): Promise<Chat[]> {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', userId)
            .order('last_updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching chats:', error);
            throw new Error(`Cloud Fetch Failed: ${error.message}`);
        }

        return (data || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            messages: c.messages,
            createdAt: new Date(c.created_at).getTime(),
            lastUpdatedAt: new Date(c.last_updated_at).getTime()
        }));
    },

    async upsertChat(userId: string, chat: Chat) {
        // Detailed logging for debugging
        console.log(`[SYNCING] Chat ${chat.id} to Supabase...`);

        const { error } = await supabase
            .from('chats')
            .upsert({
                id: chat.id,
                user_id: userId,
                title: chat.title || 'Untitled',
                messages: chat.messages,
                created_at: new Date(chat.createdAt).toISOString(),
                last_updated_at: new Date(chat.lastUpdatedAt).toISOString()
            });

        if (error) {
            console.error('CRITICAL SYNC ERROR (CHATS):', error);
            const msg = `Save Failed: ${error.message} (Code: ${error.code})`;
            throw new Error(msg);
        }
    },

    async deleteChat(chatId: string) {
        const { error } = await supabase
            .from('chats')
            .delete()
            .eq('id', chatId);

        if (error) console.error('Error deleting chat:', error);
    },

    // Templates
    async getTemplates(userId: string): Promise<StyleTemplate[]> {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('user_id', userId)
            .order('use_count', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
            throw new Error(`Cloud Fetch Failed: ${error.message}`);
        }

        return (data || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            icon: t.icon,
            inputExample: t.input_example,
            outputExample: t.output_example,
            createdAt: new Date(t.created_at).getTime(),
            lastUsedAt: t.last_used_at ? new Date(t.last_used_at).getTime() : undefined,
            useCount: t.use_count
        }));
    },

    async upsertTemplate(userId: string, template: StyleTemplate) {
        console.log(`[SYNCING] Template ${template.name} to Supabase...`);

        const { error } = await supabase
            .from('templates')
            .upsert({
                id: template.id,
                user_id: userId,
                name: template.name,
                description: template.description,
                icon: template.icon,
                input_example: template.inputExample,
                output_example: template.outputExample,
                created_at: new Date(template.createdAt).toISOString(),
                last_used_at: template.lastUsedAt ? new Date(template.lastUsedAt).toISOString() : null,
                use_count: template.useCount
            });

        if (error) {
            console.error('CRITICAL SYNC ERROR (TEMPLATES):', error);
            throw new Error(`Save Failed: ${error.message}`);
        }
    },

    async deleteTemplate(templateId: string) {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', templateId);

        if (error) console.error('Error deleting template:', error);
    }
};
