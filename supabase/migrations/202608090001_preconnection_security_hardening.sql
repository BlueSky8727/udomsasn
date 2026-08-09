-- เตรียมสิทธิ์ก่อนเชื่อมแอปจริง: อาจารย์เป็นเจ้าของสื่อ ผู้ตรวจอ่านตามขอบเขต
-- และไฟล์ทุกชิ้นอยู่ใน private bucket เท่านั้น

-- ห้ามหัวหน้ากลุ่มสาระและหัวหน้าวิชาการสร้างสื่อผ่าน client โดยตรง
drop policy if exists media_owner_insert on public.media;
create policy media_teacher_insert
on public.media for insert to authenticated
with check (
  owner_id = auth.uid()
  and public.current_role() = 'TEACHER'
  and status = 'DRAFT'
);

drop policy if exists media_owner_update_draft_revision on public.media;
create policy media_teacher_update_editable
on public.media for update to authenticated
using (
  owner_id = auth.uid()
  and public.current_role() = 'TEACHER'
  and status in ('DRAFT', 'REVISION', 'ACADEMIC_REVISION')
)
with check (
  owner_id = auth.uid()
  and public.current_role() = 'TEACHER'
  and status in ('DRAFT', 'REVISION', 'ACADEMIC_REVISION')
);

-- สร้าง version ได้เฉพาะเจ้าของที่เป็นอาจารย์และอยู่ในช่วงแก้ไข
drop policy if exists version_teacher_insert on public.media_versions;
create policy version_teacher_insert
on public.media_versions for insert to authenticated
with check (
  submitted_by = auth.uid()
  and public.current_role() = 'TEACHER'
  and exists (
    select 1
    from public.media m
    where m.id = media_id
      and m.owner_id = auth.uid()
      and m.status in ('DRAFT', 'REVISION', 'ACADEMIC_REVISION')
  )
);

-- metadata ของไฟล์ใช้สิทธิ์เดียวกับสื่อ ห้ามอ่านไฟล์ของกลุ่มอื่น
drop policy if exists media_files_read on public.media_files;
create policy media_files_read
on public.media_files for select to authenticated
using (
  exists (
    select 1
    from public.media_versions v
    join public.media m on m.id = v.media_id
    where v.id = version_id
      and (
        m.owner_id = auth.uid()
        or m.status = 'APPROVED'
        or public.current_role() = 'ADMIN'
        or (
          public.current_role() = 'REVIEWER'
          and m.department_id = public.current_department_id()
        )
      )
  )
);

drop policy if exists media_files_teacher_insert on public.media_files;
create policy media_files_teacher_insert
on public.media_files for insert to authenticated
with check (
  public.current_role() = 'TEACHER'
  and bucket = 'media-files'
  and storage_path like auth.uid()::text || '/%'
  and exists (
    select 1
    from public.media_versions v
    join public.media m on m.id = v.media_id
    where v.id = version_id
      and m.owner_id = auth.uid()
      and m.status in ('DRAFT', 'REVISION', 'ACADEMIC_REVISION')
  )
);

-- ลบถาวรได้เฉพาะไฟล์ของสื่อ DRAFT เพื่อรักษาประวัติของ version ที่ส่งแล้ว
drop policy if exists media_files_teacher_delete_draft on public.media_files;
create policy media_files_teacher_delete_draft
on public.media_files for delete to authenticated
using (
  public.current_role() = 'TEACHER'
  and exists (
    select 1
    from public.media_versions v
    join public.media m on m.id = v.media_id
    where v.id = version_id
      and m.owner_id = auth.uid()
      and m.status = 'DRAFT'
  )
);

-- คอมเมนต์ตรวจต้องมาจากผู้ตรวจที่อยู่ในขอบเขตงานเท่านั้น
drop policy if exists comments_visible on public.review_comments;
create policy comments_visible
on public.review_comments for select to authenticated
using (
  author_id = auth.uid()
  or public.current_role() = 'ADMIN'
  or exists (
    select 1 from public.media m
    where m.id = media_id and m.owner_id = auth.uid()
  )
  or (
    public.current_role() = 'REVIEWER'
    and exists (
      select 1 from public.media m
      where m.id = media_id and m.department_id = public.current_department_id()
    )
  )
);

drop policy if exists comments_insert on public.review_comments;
create policy comments_reviewer_insert
on public.review_comments for insert to authenticated
with check (
  author_id = auth.uid()
  and (
    public.current_role() = 'ADMIN'
    or (
      public.current_role() = 'REVIEWER'
      and exists (
        select 1 from public.media m
        where m.id = media_id and m.department_id = public.current_department_id()
      )
    )
  )
);

-- ผู้ใช้ทำเครื่องหมายอ่านได้เฉพาะการแจ้งเตือนของตน
drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ห้ามบันทึกยอดดาวน์โหลดในชื่อบัญชีอื่น
drop policy if exists download_approved on public.download_events;
create policy download_approved
on public.download_events for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.media m
    where m.id = media_id and m.status = 'APPROVED'
  )
);

-- Bucket ส่วนตัว จำกัด 50 MB ต่อไฟล์และรับเฉพาะชนิดที่หน้าฟอร์มรองรับ
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-files',
  'media-files',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'audio/mpeg',
    'audio/wav'
  ]::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_objects_teacher_insert on storage.objects;
create policy media_objects_teacher_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'media-files'
  and public.current_role() = 'TEACHER'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists media_objects_read on storage.objects;
create policy media_objects_read
on storage.objects for select to authenticated
using (
  bucket_id = 'media-files'
  and exists (
    select 1
    from public.media_files f
    join public.media_versions v on v.id = f.version_id
    join public.media m on m.id = v.media_id
    where f.bucket = bucket_id
      and f.storage_path = name
      and (
        m.owner_id = auth.uid()
        or m.status = 'APPROVED'
        or public.current_role() = 'ADMIN'
        or (
          public.current_role() = 'REVIEWER'
          and m.department_id = public.current_department_id()
        )
      )
  )
);

drop policy if exists media_objects_teacher_delete_draft on storage.objects;
create policy media_objects_teacher_delete_draft
on storage.objects for delete to authenticated
using (
  bucket_id = 'media-files'
  and public.current_role() = 'TEACHER'
  and exists (
    select 1
    from public.media_files f
    join public.media_versions v on v.id = f.version_id
    join public.media m on m.id = v.media_id
    where f.bucket = bucket_id
      and f.storage_path = name
      and m.owner_id = auth.uid()
      and m.status = 'DRAFT'
  )
);
