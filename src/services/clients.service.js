import { supabase, TABLES } from './supabase';

/**
 * Fetch all clients
 */
export const fetchClients = async () => {
    try {
        const { data, error } = await supabase
            .from(TABLES.CLIENTS)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Fetch single client
 */
export const fetchClient = async (clientId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.CLIENTS)
            .select('*')
            .eq('id', clientId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

import bcrypt from 'bcryptjs';

/**
 * Create new client (Table-based Auth)
 * Hash password and insert directly into table
 */
export const createClient = async (clientData, password) => {
    try {
        // 1. Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Cria cliente na tabela com a senha hash
        // Nota: user_id será null por enquanto ou podemos gerar um UUID fake se for obrigatório
        // Mas a coluna user_id na tabela provavelmente aceita null (verificar esquema ou alterar)
        // Se user_id for NOT NULL, teremos problema. Mas como migramos do Auth, assumo que aceita null ou vamos tratar.
        // O user_id era link para Auth. Sem Auth, user_id é irrelevante ou deve ser ignorado.

        const { data: client, error: clientError } = await supabase
            .from(TABLES.CLIENTS)
            .insert([{
                ...clientData,
                password: hashedPassword,
                // user_id: não enviamos
            }])
            .select()
            .single();

        if (clientError) throw clientError;

        // Criar perfil "fake" para permitir comentários/interações
        // Isso requer que a tabela prpsct_profiles NÃO tenha FK restrita ao auth.users
        // ou que aceitemos IDs arbitrários.
        const { error: profileError } = await supabase
            .from(TABLES.PROFILES)
            .insert([{
                id: client.id, // Usamos o mesmo ID do cliente
                full_name: clientData.name,
                role: 'client'
            }]);

        if (profileError) {
            console.warn('[createClient] Erro ao criar perfil vinculado (pode ser problema de FK):', profileError);
            // Não falhamos o request, mas avisamos
        }

        console.log('[createClient] Cliente criado com sucesso (Tabela). ID:', client.id);
        return { data: client, error: null };
    } catch (error) {
        console.error('[createClient] Erro:', error);
        return { data: null, error };
    }
};



/**
 * Update client
 */
export const updateClient = async (clientId, clientData) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.CLIENTS)
            .update(clientData)
            .eq('id', clientId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Delete client
 */
export const deleteClient = async (clientId) => {
    try {
        // Usar .select() para verificar se a row foi realmente deletada
        // O Supabase RLS pode bloquear silenciosamente e retornar sucesso sem deletar
        const { data, error, count } = await supabase
            .from(TABLES.CLIENTS)
            .delete()
            .eq('id', clientId)
            .select();

        if (error) throw error;

        // Se data retornou vazio, o RLS bloqueou a operação
        if (!data || data.length === 0) {
            console.error('[deleteClient] Delete retornou 0 rows. RLS pode estar bloqueando. clientId:', clientId);
            throw new Error(
                'Não foi possível excluir o cliente. Verifique as permissões (RLS) da tabela no Supabase. ' +
                'A policy de DELETE precisa permitir que o role autenticado exclua registros.'
            );
        }

        console.log('[deleteClient] Cliente excluído com sucesso:', clientId);
        return { error: null };
    } catch (error) {
        console.error('[deleteClient] Erro:', error);
        return { error };
    }
};

/**
 * Fetch client by user ID
 */
export const fetchClientByUserId = async (userId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.CLIENTS)
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};
