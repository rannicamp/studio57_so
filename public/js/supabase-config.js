// public/js/supabase-config.js

// Suas chaves de acesso ao Supabase.
// É seguro deixá-las aqui, pois o Supabase tem a segurança a nível de linha (RLS).
const supabaseUrl = 'https://vhuvnutzklhskkwbpxdz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodXZudXR6a2xoc2trd2JweGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjY2NDYsImV4cCI6MjA2NTUwMjY0Nn0.VjQI3_Oy3KWWAoYF3KVB00XHeiUP5BfTxNlaC50UXeU';

// Cria e exporta o cliente Supabase para ser usado em todo o sistema
const { createClient } = supabase;
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Este é um ID de coleção genérico que você pode usar para organizar seus dados no Firestore (se estivesse usando Firestore).
// No Supabase, você usará tabelas diretamente. Vamos manter ele por enquanto, mas pode não ser necessário.
export const APP_COLLECTION_ID = 'studio57';