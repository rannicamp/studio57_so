import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/module/index.js';

// As informações abaixo foram extraídas das chaves que você me enviou.
const supabaseUrl = 'https://qtwsrpifgjzwkibaqflz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0d3BycGlmZ2p6d2tpYmFxZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mzg2MjMsImV4cCI6MjA2NTQxNDYyM30.s7qnoBiD2PKsL1WQyaOhIDnIfoT0nMqT3IiZXKNERKg';

// Inicializa e exporta o cliente do Supabase para ser usado em outros arquivos
export const supabase = createClient(supabaseUrl, supabaseAnonKey);