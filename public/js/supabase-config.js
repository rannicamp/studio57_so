// public/js/supabase-config.js

// Importa a função createClient diretamente do módulo principal do Supabase JS
// Esta é a forma recomendada para uso com módulos ES6 em navegadores ou bundlers
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/module/supabase-js.js';

// Suas credenciais do Supabase
const supabaseUrl = "https://vhuvnutzklhskkwbpxdz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodXZudXR6a2xoc2trd2JweGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjY2NDYsImV4cCI6MjA2NTUwMjY2NDZ9.VjQI3_Oy3KWWAoYF3KVB00XHeiUP5BfTxNlaC50UXeU";

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
