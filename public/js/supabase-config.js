// public/js/supabase-config.js

// Importa a função createClient diretamente do módulo ES6 da CDN
// Esta URL (esm.sh) é uma alternativa robusta para servir módulos ES6 diretamente no navegador.
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Suas chaves de acesso ao Supabase.
// É seguro deixá-las aqui, pois o Supabase tem a segurança a nível de linha (RLS).
const supabaseUrl = "https://vhuvnutzklhskkwbpxdz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodXZudXR6a2xoc2trd2JweGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjY2NDYsImV4cCI6MjA2NTUwMjY2NDZ9.VjQI3_Oy3KWWAoYF3KVB00XHeiUP5BfTxNlaC50UXeU";

// Cria e exporta o cliente Supabase para ser usado em todo o sistema
export const supabase = createClient(supabaseUrl, supabaseAnonKey);