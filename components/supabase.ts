import { createClient } from '@supabase/supabase-js';

// Ortam değişkenlerinden Supabase URL ve Key bilgilerini alıyoruz
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase bağlantı bilgileri eksik. Lütfen .env dosyanızı kontrol edin.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);