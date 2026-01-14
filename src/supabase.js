import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xfcgmgzchppssnemytxm.supabase.co";
const supabaseKey = "sb_publishable_luYqhG8i_YxW-QjqHNIy9Q_0GmAnauZ";

export const supabase = createClient(supabaseUrl, supabaseKey)
