// public/js/supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/module/index.js';

const supabaseUrl = "https://vhuvnutzklhskkwbpxdz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZodXZudXR6a2xoc2trd2JweGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjY2NDYsImV4cCI6MjA2NTUwMjY0Nn0.VjQI3_Oy3KWWAoYF3KVB00XHeiUP5BfTxNlaC50UXeU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);