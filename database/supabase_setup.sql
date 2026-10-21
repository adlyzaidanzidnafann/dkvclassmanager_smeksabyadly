
-- DKV CLASS — Buatan Adly
-- Struktur database untuk login Google, tugas, dan absensi.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null check (role in ('guru', 'siswa')),
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  kind text not null check (kind in ('materi', 'tugas')),
  due_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  submitted_at timestamptz not null default now(),
  unique (task_id, student_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null default 'hadir'
    check (status in ('hadir', 'izin', 'sakit', 'alpa')),
  created_at timestamptz not null default now(),
  unique (student_id, attendance_date)
);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.attendance enable row level security;

-- Hapus policy dengan nama yang sama agar skrip bisa dijalankan ulang.
drop policy if exists "profile_select_self" on public.profiles;
drop policy if exists "tasks_select_authenticated" on public.tasks;
drop policy if exists "tasks_insert_guru" on public.tasks;
drop policy if exists "tasks_update_guru" on public.tasks;
drop policy if exists "tasks_delete_guru" on public.tasks;
drop policy if exists "submissions_select_own_or_guru" on public.submissions;
drop policy if exists "submissions_insert_student" on public.submissions;
drop policy if exists "submissions_update_student" on public.submissions;
drop policy if exists "attendance_select_own_or_guru" on public.attendance;
drop policy if exists "attendance_insert_student" on public.attendance;
drop policy if exists "attendance_update_student" on public.attendance;

-- Profil hanya bisa dibaca oleh pemilik akun.
create policy "profile_select_self"
on public.profiles for select to authenticated
using (id = auth.uid());

-- Pengguna login dapat melihat materi dan tugas.
create policy "tasks_select_authenticated"
on public.tasks for select to authenticated
using (true);

-- Hanya guru yang bisa membuat tugas.
create policy "tasks_insert_guru"
on public.tasks for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'guru'
  )
);

create policy "tasks_update_guru"
on public.tasks for update to authenticated
using (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'guru'
  )
)
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'guru'
  )
);

create policy "tasks_delete_guru"
on public.tasks for delete to authenticated
using (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'guru'
  )
);

-- Siswa dapat membaca pengumpulan miliknya.
-- Guru dapat membaca semua pengumpulan.
create policy "submissions_select_own_or_guru"
on public.submissions for select to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'guru'
  )
);

create policy "submissions_insert_student"
on public.submissions for insert to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'siswa'
  )
);

create policy "submissions_update_student"
on public.submissions for update to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'siswa'
  )
)
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'siswa'
  )
);

-- Siswa dapat membaca absensi sendiri.
-- Guru dapat membaca absensi semua siswa.
create policy "attendance_select_own_or_guru"
on public.attendance for select to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'guru'
  )
);

create policy "attendance_insert_student"
on public.attendance for insert to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'siswa'
  )
);

create policy "attendance_update_student"
on public.attendance for update to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'siswa'
  )
)
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'siswa'
  )
);
