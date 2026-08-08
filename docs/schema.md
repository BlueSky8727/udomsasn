# โครงสร้างฐานข้อมูล

Supabase (PostgreSQL) — **เปิด RLS ทุกตาราง** ไม่มีข้อยกเว้น
เอกสารนี้เป็นแบบร่างสำหรับเขียน migration ยังไม่มีไฟล์จริงใน `supabase/migrations`

## ภาพรวม

```
profiles ──┬── media ──┬── media_versions ──┬── media_files
           │           │                    ├── comments
           │           │                    └── ai_reviews
           │           ├── reviews
           │           └── status_logs
           └── (actor ของ reviews / comments / status_logs)
```

หลักคิดสำคัญ:

- `media` เก็บ "สื่อหนึ่งชิ้น" ในเชิงตัวตน — สถานะปัจจุบันและเจ้าของอยู่ที่นี่
- `media_versions` เก็บ "รอบการส่ง" — ส่งใหม่ = แถวใหม่ ไฟล์เก่าอยู่ครบ (กฎเหล็กข้อ 4)
- คอมเมนต์และผล AI ผูกกับ **version** ไม่ใช่ผูกกับ `media` เพื่อย้อนดูได้ว่ารอบไหนถูกติอะไร

## ชนิดข้อมูล (enum)

```sql
create type user_role   as enum ('TEACHER', 'REVIEWER', 'ADMIN');
create type media_status as enum ('DRAFT', 'PENDING', 'IN_REVIEW', 'ACADEMIC_REVIEW',
                                  'REVISION', 'ACADEMIC_REVISION', 'APPROVED',
                                  'REJECTED', 'ARCHIVED');
create type review_stage as enum ('SUBJECT_GROUP', 'ACADEMIC');
```

ค่าใน enum ต้องตรงกับ `MEDIA_STATUS` / `USER_ROLE` ใน [src/constants/workflow.ts](../src/constants/workflow.ts) เสมอ

---

## ตาราง

### `profiles`
ต่อขยายจาก `auth.users` เก็บบทบาทและข้อมูลที่ระบบใช้

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid PK | อ้าง `auth.users.id` |
| `email` | text | |
| `full_name` | text | |
| `role` | user_role | ค่าเริ่มต้น `TEACHER` |
| `department_id` | uuid FK → departments | กลุ่มสาระที่สังกัด/รับผิดชอบ |
| `school` | text | หน่วยงาน/โรงเรียน |
| `is_active` | boolean | ปิดการใช้งานโดยไม่ต้องลบ |
| `created_at` `updated_at` | timestamptz | |

**สำคัญ:** `role` เปลี่ยนได้โดย `ADMIN` เท่านั้น ห้ามให้ผู้ใช้แก้แถวตัวเองในคอลัมน์นี้

### `media`
ตัวสื่อหนึ่งชิ้น เก็บสถานะปัจจุบัน

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid PK | |
| `owner_id` | uuid FK → profiles | เจ้าของ ใช้ตัดสิน `ownerOnly` |
| `department_id` | uuid FK → departments | กลุ่มสาระปลายทาง ใช้จำกัดคิวและ RLS |
| `title` | text | ชื่อสื่อ |
| `description` | text | สาระการเรียนรู้ |
| `subject` | text | วิชา |
| `grade_level` | text | ระดับชั้น |
| `learning_objectives` | text | จุดประสงค์การเรียนรู้ |
| `media_type` | text | ประเภทสื่อ ไม่บังคับ ฟอร์มปัจจุบันยังไม่เก็บค่านี้ |
| `tags` | text[] | ใช้ค้นหา |
| `license` | text | เงื่อนไขการนำไปใช้ต่อ |
| `status` | media_status | ค่าเริ่มต้น `DRAFT` |
| `current_version_id` | uuid FK → media_versions | version ล่าสุด |
| `published_at` | timestamptz | ตอนเข้า `APPROVED` ครั้งแรก |
| `created_at` `updated_at` | timestamptz | |

**อัปเดต `status` ได้ผ่านโค้ดที่ผ่าน `assertTransition()` แล้วเท่านั้น** (กฎเหล็กข้อ 1)

### `media_versions`
หนึ่งแถวต่อหนึ่งรอบการส่ง ไม่มีการแก้ย้อนหลัง

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid PK | |
| `media_id` | uuid FK → media | |
| `version_no` | int | เริ่มที่ 1 นับขึ้นต่อ media |
| `created_by` | uuid FK → profiles | |
| `note` | text | ผู้ส่งบอกว่ารอบนี้แก้อะไร |
| `created_at` | timestamptz | |

unique `(media_id, version_no)`

### `media_files`
ไฟล์ที่แนบในแต่ละ version — อยู่ใน **private bucket** เท่านั้น (กฎเหล็กข้อ 6)

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid PK | |
| `version_id` | uuid FK → media_versions | |
| `storage_path` | text | path ใน bucket ห้ามส่งดิบให้ client |
| `file_name` | text | ชื่อที่ผู้ใช้เห็น |
| `mime_type` | text | |
| `size_bytes` | bigint | |
| `checksum` | text | ใช้ตรวจไฟล์ซ้ำ |
| `extracted_text` | text | ข้อความที่สกัดไว้ให้ AI อ่าน — **ข้อมูลที่เชื่อไม่ได้** (กฎเหล็กข้อ 7) |
| `created_at` | timestamptz | |

การเข้าถึงไฟล์ต้องออก signed URL อายุสั้นหลังเช็คสิทธิ์ทุกครั้ง ไม่มีทางลัด

### `reviews`
หนึ่งรอบการตรวจ = ผู้ตรวจหนึ่งคนถือเรื่องหนึ่งครั้ง

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid PK | |
| `media_id` | uuid FK → media | |
| `version_id` | uuid FK → media_versions | ตรวจ version ไหน |
| `reviewer_id` | uuid FK → profiles | ผู้ถือเรื่อง ใช้ตัดสิน `assigneeOnly` |
| `stage` | review_stage | รอบกลุ่มสาระหรือรอบหัวหน้าวิชาการ |
| `decision` | media_status | null ระหว่างที่ยังตรวจอยู่ |
| `topic_results` | jsonb | ผลตรวจแยกตามหัวข้อภาษาคน |
| `summary` | text | สรุปของผู้ตรวจ |
| `started_at` | timestamptz | ตอนรับเรื่อง |
| `closed_at` | timestamptz | null = ยังถืออยู่ |

**ต้องมี partial unique index กันสองคนรับเรื่องเดียวกันพร้อมกัน:**

```sql
create unique index reviews_one_active_per_media
  on reviews (media_id) where closed_at is null;
```

การเช็ค `requiresUnassigned` ในโค้ดเป็นด่านแรก index นี้เป็นด่านสุดท้ายที่กัน race condition จริง

### `comments`
คอมเมนต์ผูกกับ **version** (กฎเหล็กข้อ 4)

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid PK | |
| `version_id` | uuid FK → media_versions | |
| `author_id` | uuid FK → profiles | |
| `topic_key` | text | null ได้ ถ้าเป็นคอมเมนต์ทั่วไป |
| `body` | text | |
| `created_at` | timestamptz | |

จำนวนคอมเมนต์ของ version ปัจจุบันคือค่าที่ส่งเข้า `commentCount` ตอนเรียก `assertTransition()`
สำหรับเส้น `IN_REVIEW` → `REVISION`

### `ai_reviews`
ผลคัดกรองของ AI แยกจากผลของคนเสมอ

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid PK | |
| `version_id` | uuid FK → media_versions | |
| `model` | text | ชื่อรุ่นที่ใช้ |
| `findings` | jsonb | ข้อสังเกตแยกตามหัวข้อ พร้อมข้อความอ้างอิง |
| `prompt_injection_detected` | boolean | พบข้อความที่พยายามสั่ง AI ในไฟล์ (กฎเหล็กข้อ 7) |
| `created_at` | timestamptz | |

**ไม่มีคอลัมน์ `decision`** โดยตั้งใจ — AI ไม่ตัดสิน (กฎเหล็กข้อ 8)
AI ต้องไม่มีสิทธิ์เขียนตารางอื่นนอกจากตารางนี้

### `status_logs`
บันทึกการเปลี่ยนสถานะทุกครั้ง (กฎเหล็กข้อ 3) — append only

| คอลัมน์ | ชนิด | หมายเหตุ |
|---|---|---|
| `id` | uuid PK | |
| `media_id` | uuid FK → media | |
| `version_id` | uuid FK → media_versions | version ณ ตอนนั้น |
| `actor_id` | uuid FK → profiles | ใคร |
| `from_status` | media_status | จากไหน |
| `to_status` | media_status | ไปไหน |
| `reason` | text | เหตุผล (บังคับเมื่อ `requiresReason`) |
| `created_at` | timestamptz | เมื่อไหร่ |

ไม่มี policy ให้ `update` หรือ `delete` ตารางนี้กับใครทั้งสิ้น รวมถึง `ADMIN`

---

## แนวทาง RLS

เปิด `alter table ... enable row level security` ทุกตาราง แล้วเขียน policy ตามนี้

| ตาราง | อ่าน | เขียน |
|---|---|---|
| `profiles` | ตัวเอง / admin ทั้งหมด / reviewer เฉพาะกลุ่มเดียวกัน | `role` และ `department_id` เปลี่ยนได้โดย admin เท่านั้น |
| `media` | เจ้าของ / admin ทั้งหมด / reviewer เฉพาะ `department_id` ของตน, คนอื่นเห็นเฉพาะ `APPROVED` | insert: เจ้าของ, update สถานะ: ผ่านชั้น server เท่านั้น |
| `media_versions` `media_files` | ตามสิทธิ์ของ `media` ที่ผูกอยู่ | เจ้าของ insert ได้ตอน `DRAFT`/`REVISION`, ห้าม update/delete |
| `reviews` | เจ้าของอ่านได้, reviewer เฉพาะงานกลุ่มตน, admin เฉพาะงานที่มีสิทธิ์ตรวจ | reviewer ต้องเป็นผู้ถือเรื่องในกลุ่มตน / admin ตรวจรอบวิชาการ |
| `comments` | เจ้าของ + reviewer/admin | reviewer/admin เขียนได้, เจ้าของตอบกลับได้ |
| `ai_reviews` | reviewer/admin (+ เจ้าของ ถ้าจะให้เห็น) | service role เท่านั้น |
| `status_logs` | เจ้าของ (ของตัวเอง) + reviewer/admin | insert เท่านั้น ไม่มี update/delete |

**RLS เป็นตาข่ายชั้นสุดท้าย ไม่ใช่ชั้นเดียว** ตรรกะสิทธิ์หลักยังต้องบังคับใน server code
และห้ามใช้ service role key ในเส้นทางที่รับข้อมูลจากผู้ใช้โดยตรง

## จุดที่ต้องระวังตอนเขียน migration

- ค่า enum ต้องตรงกับใน `workflow.ts` เป๊ะ ๆ ถ้าแก้ที่หนึ่งต้องแก้อีกที่
- ต้องมี partial unique index บน `reviews` ตามด้านบน ไม่งั้นสองคนรับเรื่องเดียวกันได้
- `media.status` ไม่ควรมี trigger ที่เปลี่ยนสถานะเอง ทุกการเปลี่ยนต้องมาจากโค้ดที่เรียก `assertTransition()`
- ตั้ง index สำหรับหน้าใช้งานจริง: `media (status, updated_at)` สำหรับคิว, `media (owner_id, status)` สำหรับ my-media, และ index สำหรับค้นหาข้อความบน `title`/`description`/`tags`
