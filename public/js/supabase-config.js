// public/js/supabase-config.js

// Suas chaves de acesso ao Supabase.
// É seguro deixá-las aqui, pois o Supabase tem a segurança a nível de linha (RLS).
const supabaseUrl = 'https://qtwsrpifgjzwkibaqflz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0d3BycGlmZ2p6d2tpYmFxZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mzg2MjMsImV4cCI6MjA2NTQxNDYyM30.s7qnoBiD2PKsL1WQyaOhIDnIfoT0nMqT3IiZXKNERKg';

// Cria e exporta o cliente Supabase para ser usado em todo o sistema
const { createClient } = supabase;
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);