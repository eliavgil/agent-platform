-- =============================================
-- AGENT PLATFORM - SUPABASE SCHEMA
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text not null check (role in ('teacher', 'agent', 'admin')) default 'teacher',
  avatar_url text,
  bio text,
  specializations text[], -- for agents: list of specializations
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "Public profiles viewable by authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- =============================================
-- AI TOOLS TABLE
-- =============================================
create table public.ai_tools (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text not null,
  category text not null, -- e.g. 'writing', 'math', 'science', 'art', 'language'
  icon_name text default 'Bot', -- lucide icon name
  color text default '#6366f1',
  capabilities text[],
  example_prompts text[],
  is_active boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table public.ai_tools enable row level security;
create policy "Tools viewable by authenticated" on public.ai_tools
  for select using (auth.role() = 'authenticated');
create policy "Admins can manage tools" on public.ai_tools
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================
-- TOOL REVIEWS TABLE
-- =============================================
create table public.tool_reviews (
  id uuid default uuid_generate_v4() primary key,
  tool_id uuid references public.ai_tools on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(tool_id, user_id)
);

-- RLS
alter table public.tool_reviews enable row level security;
create policy "Reviews viewable by authenticated" on public.tool_reviews
  for select using (auth.role() = 'authenticated');
create policy "Users can manage own reviews" on public.tool_reviews
  for all using (auth.uid() = user_id);

-- =============================================
-- REQUESTS TABLE
-- =============================================
create table public.requests (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.profiles on delete cascade not null,
  agent_id uuid references public.profiles on delete set null,
  subject text not null,
  grade_level text not null, -- כיתה
  description text not null,
  desired_tool_id uuid references public.ai_tools on delete set null,
  desired_tool_name text, -- fallback text if not in list
  preferred_agent_id uuid references public.profiles on delete set null,
  file_url text,
  file_name text,
  status text not null check (status in (
    'pending',      -- ממתין להקצאה
    'assigned',     -- הוקצה לסוכן
    'in_progress',  -- בטיפול
    'completed',    -- הושלם
    'cancelled'     -- בוטל
  )) default 'pending',
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  notes text, -- admin internal notes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.requests enable row level security;

-- Teachers see their own requests
create policy "Teachers see own requests" on public.requests
  for select using (auth.uid() = teacher_id);

-- Agents see assigned requests
create policy "Agents see assigned requests" on public.requests
  for select using (auth.uid() = agent_id);

-- Admins see all requests
create policy "Admins see all requests" on public.requests
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Teachers can create requests
create policy "Teachers can create requests" on public.requests
  for insert with check (auth.uid() = teacher_id);

-- Teachers can update their own requests (cancel)
create policy "Teachers can update own requests" on public.requests
  for update using (auth.uid() = teacher_id);

-- Agents can update status of assigned requests
create policy "Agents can update assigned requests" on public.requests
  for update using (auth.uid() = agent_id);

-- Admins can update all requests (assign agents, change status)
create policy "Admins can update all requests" on public.requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================
-- MESSAGES TABLE
-- =============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.requests on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text,
  file_url text,
  file_name text,
  file_type text,
  is_system boolean default false, -- system messages (status changes, etc.)
  created_at timestamptz default now()
);

-- RLS
alter table public.messages enable row level security;

-- Participants can see messages (teacher, agent, admin)
create policy "Participants can see messages" on public.messages
  for select using (
    exists (
      select 1 from public.requests r
      where r.id = request_id
      and (
        r.teacher_id = auth.uid()
        or r.agent_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      )
    )
  );

-- Participants can send messages
create policy "Participants can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.requests r
      where r.id = request_id
      and (
        r.teacher_id = auth.uid()
        or r.agent_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      )
    )
  );

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.requests;

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'teacher')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger requests_updated_at
  before update on public.requests
  for each row execute procedure public.handle_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- =============================================
-- SEED DATA - AI TOOLS
-- =============================================
insert into public.ai_tools (name, description, category, icon_name, color, capabilities, example_prompts) values
(
  'ChatGPT-4',
  'מודל שפה מתקדם של OpenAI, מצוין לכתיבה, הסברים, ותכנות',
  'כללי',
  'MessageSquare',
  '#10a37f',
  array['כתיבת טקסטים', 'הסברת מושגים', 'יצירת חידות', 'עזרה בתכנות', 'תרגום'],
  array['הסבר לי את תורת היחסות בשפה פשוטה', 'צור 10 שאלות בחינה על נושא X', 'כתוב סיפור קצר לכיתה ג']
),
(
  'Claude',
  'עוזר AI של Anthropic, מצוין לניתוח, כתיבה אקדמית ועבודה עם מסמכים',
  'כללי',
  'Bot',
  '#6366f1',
  array['ניתוח טקסטים', 'כתיבה אקדמית', 'עיבוד מסמכים', 'קריאה ביקורתית', 'מחקר'],
  array['נתח את הטקסט המצורף ומצא את הרעיונות המרכזיים', 'עזור לי לבנות יחידת לימוד', 'בדוק את החיבור של התלמיד']
),
(
  'DALL-E 3',
  'יצירת תמונות בעזרת AI - מושלם לאיורים חינוכיים וויזואליזציה',
  'ויזואלי',
  'Image',
  '#ff6b6b',
  array['יצירת תמונות', 'איורים חינוכיים', 'ויזואליזציה של מושגים', 'אמנות דיגיטלית'],
  array['צור תמונה המסבירה את מחזור המים', 'ציור של מפת ישראל בסגנון ילדים', 'ויזואליזציה של תא ביולוגי']
),
(
  'Wolfram Alpha',
  'מנוע חישובי מומחה למתמטיקה, מדעים, נתונים סטטיסטיים ועוד',
  'מתמטיקה',
  'Calculator',
  '#ff7700',
  array['פתרון משוואות', 'גרפים מתמטיים', 'חישובים מדעיים', 'נתונים סטטיסטיים', 'המרות יחידות'],
  array['פתור את המשוואה 3x+7=22', 'ציר את הפונקציה sin(x)+cos(x)', 'כמה אטומים יש בגרם מים']
),
(
  'Grammarly',
  'כלי תיקון ושיפור כתיבה, מנקד ובודק שגיאות דקדוק',
  'שפה',
  'FileText',
  '#15c39a',
  array['תיקון דקדוק', 'שיפור סגנון', 'בדיקת איות', 'שיפור בהירות', 'תיקון פיסוק'],
  array['בדוק ותקן את החיבור', 'שפר את הסגנון של הטקסט', 'הצע חלופות לביטויים חוזרים']
),
(
  'Khanmigo',
  'סוכן AI חינוכי של Khan Academy, מותאם ללמידה ופדגוגיה',
  'חינוך',
  'GraduationCap',
  '#14b8a6',
  array['הוראה דיאלוגית', 'מתמטיקה', 'מדעים', 'היסטוריה', 'תכנות'],
  array['עזור לי לעצב שיעור על פיתגורס', 'צור תרגול מותאם אישית לתלמיד מתקשה', 'הסבר את הנושא בשלבים']
);

-- =============================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- =============================================
-- insert into storage.buckets (id, name, public) values ('request-files', 'request-files', false);
-- insert into storage.buckets (id, name, public) values ('message-files', 'message-files', false);

-- Storage policies:
-- create policy "Authenticated users can upload" on storage.objects for insert
--   with check (auth.role() = 'authenticated' and bucket_id in ('request-files', 'message-files'));
-- create policy "Authenticated users can read" on storage.objects for select
--   using (auth.role() = 'authenticated' and bucket_id in ('request-files', 'message-files'));
