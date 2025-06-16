// public/js/supabase-config.js

// Importa a biblioteca do Supabase JS diretamente da CDN sem o módulo problemático
// Esta URL importa uma versão "umd" (Universal Module Definition) que é mais compatível com navegadores antigos e sem bundler
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/dist/umd/supabase.min.js';

// Suas credenciais do Supabase
const supabaseUrl = "https://vhuvnutzklhskkwbpxdz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodXZudXR6a2xoc2trd2JweGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjY2NDYsImV4cCI6MjA2NTUwMjY2NDZ9.VjQI3_Oy3KWWAoYF3KVB00XHeiUP5BfTxNlaC50UXeU";

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
