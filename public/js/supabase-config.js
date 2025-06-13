const supabaseUrl = 'https://qtwsrpifgjzwkibaqflz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0d3BycGlmZ2p6d2tpYmFxZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mzg2MjMsImV4cCI6MjA2NTQxNDYyM30.s7qnoBiD2PKsL1WQyaOhIDnIfoT0nMqT3IiZXKNERKg';

// CORREÇÃO:
// O objeto global 'supabase' (do script que carregamos no HTML) nos dá a função createClient.
// Nós a usamos para criar nosso cliente e sobrescrevemos a variável 'supabase' para que
// o resto do nosso código possa usá-la diretamente.
supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);