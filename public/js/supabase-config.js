const supabaseUrl = 'https://qtwsrpifgjzwkibaqflz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0d3BycGlmZ2p6d2tpYmFxZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mzg2MjMsImV4cCI6MjA2NTQxNDYyM30.s7qnoBiD2PKsL1WQyaOhIDnIfoT0nMqT3IiZXKNERKg';

// A variável 'supabase' agora fica acessível em todo o site.
// Usamos a variável _supabase que foi carregada pelo script no HTML.
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);