import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// ---- PROFILES ----
export const getProfile = (userId) =>
  supabase.from('profiles').select('*').eq('id', userId).single()

export const updateProfile = (userId, data) =>
  supabase.from('profiles').update(data).eq('id', userId)

export const getAgents = () =>
  supabase.from('profiles').select('*').eq('role', 'agent').order('full_name')

// ---- AI TOOLS ----
export const getTools = () =>
  supabase
    .from('ai_tools')
    .select(`*, tool_reviews(rating)`)
    .eq('is_active', true)
    .order('name')

export const getTool = (id) =>
  supabase.from('ai_tools').select(`*, tool_reviews(*, profiles(full_name, avatar_url))`).eq('id', id).single()

export const addToolReview = (data) =>
  supabase.from('tool_reviews').upsert(data)

// ---- REQUESTS ----
export const createRequest = (data) =>
  supabase.from('requests').insert(data).select().single()

export const getTeacherRequests = (teacherId) =>
  supabase
    .from('requests')
    .select(`*, ai_tools(name, icon_name, color), profiles!requests_agent_id_fkey(full_name, avatar_url)`)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

export const getAgentRequests = (agentId) =>
  supabase
    .from('requests')
    .select(`*, ai_tools(name, icon_name, color), profiles!requests_teacher_id_fkey(full_name, avatar_url)`)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })

export const getAllRequests = () =>
  supabase
    .from('requests')
    .select(`
      *,
      ai_tools(name, icon_name, color),
      teacher:profiles!requests_teacher_id_fkey(full_name, avatar_url, email),
      agent:profiles!requests_agent_id_fkey(full_name, avatar_url, email)
    `)
    .order('created_at', { ascending: false })

export const getRequest = (id) =>
  supabase
    .from('requests')
    .select(`
      *,
      ai_tools(name, icon_name, color),
      teacher:profiles!requests_teacher_id_fkey(full_name, avatar_url),
      agent:profiles!requests_agent_id_fkey(full_name, avatar_url)
    `)
    .eq('id', id)
    .single()

export const updateRequest = (id, data) =>
  supabase.from('requests').update(data).eq('id', id)

// ---- MESSAGES ----
export const getMessages = (requestId) =>
  supabase
    .from('messages')
    .select(`*, profiles(full_name, avatar_url, role)`)
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

export const sendMessage = (data) =>
  supabase.from('messages').insert(data).select(`*, profiles(full_name, avatar_url, role)`).single()

export const subscribeToMessages = (requestId, callback) =>
  supabase
    .channel(`messages:${requestId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `request_id=eq.${requestId}`,
    }, callback)
    .subscribe()

export const subscribeToRequests = (callback) =>
  supabase
    .channel('requests')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'requests',
    }, callback)
    .subscribe()

// ---- FILE UPLOAD ----
export const uploadFile = async (bucket, file, path) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return { path: data.path, url: publicUrl }
}
