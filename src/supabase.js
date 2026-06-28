import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yesoomyoivzuzvivnvki.supabase.co";
const supabaseAnonKey = "sb_publishable_bUBAquwwyhfz5na5qwmwsQ_OYm59xvI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;


