import { createClient } from '@supabase/supabase-js';
import { Chat, StyleTemplate } from '../types';

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
    // Chats
    async getChats(userId: string): Promise<Chat[]> {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', userId)
            .order('last_updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching chats:', error);
            return [];
        }

        return (data || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            messages: c.messages,
            createdAt: c.created_at,
            lastUpdatedAt: c.last_updated_at
        }));
    },

    async upsertChat(userId: string, chat: Chat) {
        const { error } = await supabase
            .from('chats')
            .upsert({
                id: chat.id,
                user_id: userId,
                title: chat.title,
                messages: chat.messages,
                created_at: chat.createdAt,
                last_updated_at: chat.lastUpdatedAt
            });

        if (error) console.error('Error saving chat:', error);
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
            return [];
        }

        return (data || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            icon: t.icon,
            inputExample: t.input_example,
            outputExample: t.output_example,
            createdAt: t.created_at,
            useCount: t.use_count
        }));
    },

    async upsertTemplate(userId: string, template: StyleTemplate) {
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
                created_at: template.createdAt,
                use_count: template.useCount
            });

        if (error) console.error('Error saving template:', error);
    },

    async deleteTemplate(templateId: string) {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', templateId);

        if (error) console.error('Error deleting template:', error);
    }
};
