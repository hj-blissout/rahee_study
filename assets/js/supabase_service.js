/**
 * Supabase Service Centralized Logic
 */
// DB 설정 (환경 변수 우선 참조, 없을 경우 하드코딩된 값 사용)
const SUPABASE_URL = window.SUPABASE_URL || 'https://gvgarbiuzgxppbhenhxj.supabase.co';
const SUPABASE_KEY = window.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Z2FyYml1emd4cHBiaGVuaHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODM5NzEsImV4cCI6MjA4ODg1OTk3MX0.knjJf3RP6uSxaRRhpA4q1CCglRqfQKje1uROhLuK7yI';

let _sb = null;

function getSupabase() {
    if (!_sb && window.supabase) {
        _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        });
    }
    return _sb;
}

// Core Auth Functions
async function getCurrentUser() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data?.user || null;
}

async function getSession() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session || null;
}

async function logout() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    const root = window.location.pathname.includes('/math/') || window.location.pathname.includes('/English/') ? '../../' : './';
    window.location.href = root + 'login.html';
}

// Database / Progress Functions
async function pushProgress(storageKey, completedAt) {
    try {
        const sb = getSupabase();
        if (!sb) return;
        const user = await getCurrentUser();
        if (!user) return;

        const { error } = await sb.from('rahee_progress').upsert({
            user_id: user.id,
            storage_key: storageKey,
            completed_at: completedAt
        }, { onConflict: 'user_id,storage_key' });

        return { error };
    } catch (e) {
        console.warn('Supabase Push Error:', e);
        return { error: e };
    }
}

async function pullProgress() {
    try {
        const sb = getSupabase();
        if (!sb) return [];
        const user = await getCurrentUser();
        if (!user) return [];

        const { data, error } = await sb
            .from('rahee_progress')
            .select('storage_key, completed_at')
            .eq('user_id', user.id);

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.warn('Supabase Pull Error:', e);
        return [];
    }
}
