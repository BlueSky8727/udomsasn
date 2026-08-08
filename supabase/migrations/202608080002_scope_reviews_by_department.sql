-- รอบตรวจหนึ่งต้องระบุว่าเป็นของกลุ่มสาระหรือฝ่ายวิชาการ
do $$
begin
  create type public.review_stage as enum ('SUBJECT_GROUP', 'ACADEMIC');
exception
  when duplicate_object then null;
end $$;

-- กลุ่มสาระปลายทางถูกเลือกตอนอาจารย์ส่งสื่อ และใช้คุม RLS ของหัวหน้ากลุ่มสาระ
alter table public.media
  add column if not exists department_id uuid references public.departments(id);

alter table public.review_assignments
  add column if not exists stage public.review_stage not null default 'SUBJECT_GROUP';

alter table public.reviews
  add column if not exists stage public.review_stage not null default 'SUBJECT_GROUP';

alter table public.reviews drop constraint if exists reviews_decision_check;
alter table public.reviews
  add constraint reviews_decision_check
  check (
    decision is null
    or decision in ('ACADEMIC_REVIEW', 'APPROVED', 'REVISION', 'ACADEMIC_REVISION', 'REJECTED')
  );

create index if not exists media_department_status_idx
  on public.media (department_id, status, updated_at desc);
create index if not exists profiles_department_role_idx
  on public.profiles (department_id, role);

-- คืนกลุ่มสาระจาก profile ของ session เท่านั้น ห้ามรับ department id จาก client มาเชื่อโดยตรง
create or replace function public.current_department_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select department_id from public.profiles where id = auth.uid();
$$;

-- หัวหน้าวิชาการเป็นผู้เดียวที่เปลี่ยน role / department ของบุคลากร
drop policy if exists profiles_self_or_admin on public.profiles;
drop policy if exists profiles_scoped_select on public.profiles;
create policy profiles_scoped_select
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.current_role() = 'ADMIN'
  or (
    public.current_role() = 'REVIEWER'
    and department_id = public.current_department_id()
  )
);

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update
on public.profiles for update to authenticated
using (public.current_role() = 'ADMIN')
with check (public.current_role() = 'ADMIN');

-- หัวหน้ากลุ่มสาระอ่านได้เฉพาะสื่อที่ส่งมายังกลุ่มของตน หัวหน้าวิชาการอ่านได้ทั้งหมด
drop policy if exists media_read on public.media;
create policy media_read
on public.media for select to authenticated
using (
  status = 'APPROVED'
  or owner_id = auth.uid()
  or public.current_role() = 'ADMIN'
  or (
    public.current_role() = 'REVIEWER'
    and department_id = public.current_department_id()
  )
);

drop policy if exists assignments_staff on public.review_assignments;
create policy assignments_scoped
on public.review_assignments for all to authenticated
using (
  public.current_role() = 'ADMIN'
  or (
    public.current_role() = 'REVIEWER'
    and reviewer_id = auth.uid()
    and exists (
      select 1 from public.media m
      where m.id = media_id and m.department_id = public.current_department_id()
    )
  )
)
with check (
  public.current_role() = 'ADMIN'
  or (
    public.current_role() = 'REVIEWER'
    and reviewer_id = auth.uid()
    and stage = 'SUBJECT_GROUP'
    and exists (
      select 1 from public.media m
      where m.id = media_id and m.department_id = public.current_department_id()
    )
  )
);

drop policy if exists review_staff on public.reviews;
create policy reviews_scoped
on public.reviews for all to authenticated
using (
  public.current_role() = 'ADMIN'
  or (
    public.current_role() = 'REVIEWER'
    and reviewer_id = auth.uid()
    and stage = 'SUBJECT_GROUP'
    and exists (
      select 1 from public.media m
      where m.id = media_id and m.department_id = public.current_department_id()
    )
  )
)
with check (
  public.current_role() = 'ADMIN'
  or (
    public.current_role() = 'REVIEWER'
    and reviewer_id = auth.uid()
    and stage = 'SUBJECT_GROUP'
    and exists (
      select 1 from public.media m
      where m.id = media_id and m.department_id = public.current_department_id()
    )
  )
);

-- เก็บหลักฐานทุกครั้งที่หัวหน้าวิชาการเปลี่ยนบทบาทหรือกลุ่มสาระ
create or replace function public.audit_profile_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
     or old.department_id is distinct from new.department_id then
    insert into public.audit_logs(actor_id, entity_type, entity_id, action, metadata)
    values (
      auth.uid(),
      'profile',
      new.id,
      'ROLE_ASSIGNMENT_CHANGED',
      jsonb_build_object(
        'old_role', old.role,
        'new_role', new.role,
        'old_department_id', old.department_id,
        'new_department_id', new.department_id
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_audit_assignment_change on public.profiles;
create trigger profiles_audit_assignment_change
after update of role, department_id on public.profiles
for each row execute function public.audit_profile_assignment_change();
