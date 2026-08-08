# สิ่งที่ระบบยังขาด

สำรวจจากโค้ดจริง ณ 8 ส.ค. 2569 เรียงตามลำดับที่ควรทำ
ข้อที่อยู่บนสุดปลดล็อกข้ออื่นด้วย ทำสลับลำดับจะเสียเวลาย้อนกลับมาแก้

---

## 0. ตัดสินใจก่อนเขียนโค้ด (มีอยู่ 3 เรื่องที่ขัดกันเอง)

ทั้งสามข้อนี้ถ้าไม่เคลียร์ก่อน จะเขียนโค้ดผิดทางแล้วต้องรื้อ

- **`status_logs` ไม่มีอยู่ในสคีมา** — กฎเหล็กข้อ 3 บังคับว่าทุกการเปลี่ยนสถานะต้องเขียน `status_logs`
  และ [workflow.ts:107](../src/constants/workflow.ts) อ้างถึง `status_logs.reason` แต่ใน
  [migration](../supabase/migrations/202608070001_enterprise_media_qa.sql) มีแค่ `audit_logs`
  → ต้องเลือกว่าจะเพิ่มตาราง `status_logs` แยก หรือใช้ `audit_logs` เป็นตัวเดียวกันแล้วแก้เอกสาร

- **ตัวแปร env ของ AI คนละชื่อกับที่โค้ดอ่าน** — [.env.example](../.env.example) เขียน
  `ANTHROPIC_API_KEY` / `AI_MODEL` แต่ [typhoon.ts](../src/lib/ai/typhoon.ts) อ่าน
  `TYPHOON_API_KEY` / `TYPHOON_BASE_URL` / `TYPHOON_MODEL` / `TYPHOON_TEMPERATURE` / `TYPHOON_MAX_TOKENS`
  → ใครตั้งค่าตาม `.env.example` แล้วเรียก `/api/ai/review` จะได้ error ทันที ต้องเลือกผู้ให้บริการเดียวแล้วแก้ให้ตรง

- **จำนวนตารางไม่ตรง** — CLAUDE.md บอก 9 ตาราง แต่ migration สร้างจริง 15 ตาราง
  (เพิ่ม `departments` `media_files` `review_assignments` `review_comments` `notifications`
  `audit_logs` `download_events` `favorites` `criteria`)
  → อัปเดต CLAUDE.md กับ [docs/schema.md](schema.md) ให้ตรงของจริง

---

## 1. ยืนยันตัวตน — ตัวปิดกั้นใหญ่ที่สุด

ตอนนี้ **ไม่มีการยืนยันตัวตนเลย** ทุกหน้าเปิดตรงจาก URL ได้หมด

- [ ] [src/lib/auth.ts](../src/lib/auth.ts) `getViewerRole()` คืน `ADMIN` ตายตัว และ `getViewerName()`
      คืนชื่อคงที่ → เปลี่ยนไปอ่าน session แล้ว join ตาราง `profiles`
- [ ] [src/lib/auth-client.ts](../src/lib/auth-client.ts) `signIn()` / `signOut()` ยังเป็นทางลัด
      ต้องต่อ `supabase.auth.signInWithPassword()` และ `signOut()` ของจริง
- [ ] **ลบบล็อก `DEV_LOGIN_ENABLED` ทิ้ง** — ตอนนี้กรอกรหัสอะไรก็เข้าได้ (จำกัดไว้เฉพาะ dev แล้ว
      แต่ต้องหายไปตอนของจริงพร้อม)
- [ ] ยังไม่มี `middleware.ts` → ต้องมีตัวกันไม่ให้เข้าหน้าที่ต้องล็อกอิน และ redirect ไป `/login`
- [ ] เปลี่ยนการเทียบเจ้าของสื่อจากชื่อไปเป็น user id (ชื่อซ้ำกันได้และแก้ได้)
- [ ] การ์ดผู้ใช้ใน sidebar ยัง hardcode "AD / ผู้ดูแลระบบ"

## 2. ข้อมูลจริง — ตอนนี้ทุกหน้าเป็น mock

สคีมามีครบแล้ว แต่ยังไม่มีหน้าไหนอ่านจากฐานข้อมูลเลยสักหน้า

- [ ] `/browse` `/my-media` ใช้ [mock-data.ts](../src/constants/mock-data.ts)
- [ ] `/` `/queue` `/review/[id]` ใช้ [enterprise-data.ts](../src/constants/enterprise-data.ts)
- [ ] `/analytics` `/notifications` `/admin` ตัวเลขและรายการ hardcode ในไฟล์หน้า
- [ ] ยังไม่ได้ generate types จาก Supabase (`npm run db:types` → `src/types/database.ts` ยังไม่มี)
- [ ] ตัวกรองใน `/browse` กับ `/queue` กรองในเบราว์เซอร์ พอข้อมูลจริงเยอะต้องย้ายไปเป็น query ฝั่งเซิร์ฟเวอร์

## 3. API — โฟลเดอร์ว่างเปล่า 3 อัน

มีแค่ [api/ai/review/route.ts](../src/app/api/ai/review/route.ts) ที่เขียนแล้ว
ส่วน `api/media` `api/review` `api/ai-check` เป็นโฟลเดอร์เปล่า

- [ ] `POST /api/media` สร้างสื่อ + เวอร์ชันแรก
- [ ] `POST /api/media/[id]/versions` ส่งฉบับแก้ไข = แถวใหม่เสมอ ห้ามทับของเดิม (กฎเหล็กข้อ 4)
- [ ] `POST /api/review/[id]/transition` เปลี่ยนสถานะ — ต้องเรียก `assertTransition()` ฝั่งเซิร์ฟเวอร์
      และเขียน log ใน transaction เดียวกัน เขียน log ไม่ได้ต้อง rollback (กฎเหล็กข้อ 3)
- [ ] `POST /api/review/[id]/items` บันทึกผลตรวจ R1–R9 รายข้อ
- [ ] `DELETE /api/media/[id]` ลบถาวรได้เฉพาะ `DRAFT` เท่านั้น (กฎเหล็กข้อ 5)

## 4. ไฟล์และ storage — ยังไม่มีโค้ดเลย

`src/lib/storage/` กับ `src/lib/extract/` มีแต่ `.gitkeep`

- [ ] อัปโหลดเข้า private bucket
- [ ] ออก signed URL อายุสั้น พร้อม**เช็คสิทธิ์ก่อนออกทุกครั้ง** (กฎเหล็กข้อ 6)
- [ ] สกัดข้อความจาก PDF / PPTX / DOCX เพื่อส่งให้ AI
- [ ] เมื่อสกัดข้อความออกมาแล้ว ต้องปฏิบัติกับมันเป็น**ข้อมูล ไม่ใช่คำสั่ง** (กฎเหล็กข้อ 7)
- [ ] env `SUPABASE_STORAGE_BUCKET` `SIGNED_URL_TTL_SECONDS` `MAX_UPLOAD_BYTES` ประกาศไว้แล้วแต่ยังไม่มีโค้ดอ่าน
- [ ] [file-picker.tsx](../src/components/media/file-picker.tsx) ยังไม่ได้ต่อกับการอัปโหลดจริง

## 5. ปุ่มที่ยังกดไม่ได้

- [ ] **ฟอร์มส่งสื่อ** [submit-form.tsx:210](../src/components/media/submit-form.tsx) เป็น
      `onSubmit={(e) => e.preventDefault()}` — กรอกครบแล้วกดส่งก็ไม่มีอะไรเกิดขึ้น
- [ ] **หน้าตรวจ** [review/[id]](../src/app/review/[id]/page.tsx) ปุ่ม ผ่าน/ไม่ผ่าน รายข้อ,
      ปุ่มตัดสิน ผ่าน/ให้แก้/ไม่ผ่าน, "คืนคิว", "บันทึกผลตรวจ", "เปิด Preview",
      "เรียก Typhoon วิเคราะห์ใหม่" — ไม่มี handler สักตัว
- [ ] ปุ่มตัดสินต้องดึงข้อความจาก `TransitionRule.label` ไม่ใช่เขียนซ้ำในคอมโพเนนต์ (กฎเหล็กข้อ 9)
- [ ] ปุ่มกระดิ่งบน topbar ยังไม่ลิงก์ไป `/notifications`
- [ ] การ์ดในคลังสื่อกดเข้าไปดูรายละเอียดไม่ได้ ยังไม่มีหน้า detail ฝั่งผู้ใช้ทั่วไป
- [ ] `/my-media/[id]` เป็น placeholder รอเนื้อหาจริง (ประวัติเวอร์ชัน คอมเมนต์แยกตามเวอร์ชัน)

## 6. AI

- [ ] `AI_CHECK_ENABLED` มีโค้ดอ่านแล้วแต่ยังไม่มีที่ไหนเรียกใช้ผลลัพธ์
- [ ] ผลจาก AI ต้องเขียนลงตาราง `ai_reviews` เท่านั้น และห้ามเปลี่ยนสถานะเด็ดขาด (กฎเหล็กข้อ 8)
- [ ] R3 ต้องกันไม่ให้ AI สรุปผ่าน/ไม่ผ่าน — มี `AI_NO_CONCLUSION_CODES` ใน
      [rubric.ts](../src/constants/rubric.ts) แล้ว แต่ยังไม่มีใครเรียกใช้

## 7. ยังไม่มีเลย

- [ ] **ไม่มีเทสต์สักตัว** — `assertTransition()` กับตาราง `TRANSITIONS` 9 เส้นทางคือหัวใจของระบบ
      ควรมีเทสต์ก่อนใคร รวมถึงเคสที่ต้องถูกปฏิเสธ
- [ ] ไม่มี CI
- [ ] ไม่มี error boundary / loading state ระดับ route
- [ ] ไม่มีหน้า 403 หรือหน้าบอกว่าไม่มีสิทธิ์
- [ ] `/analytics` `/notifications` ยังไม่มีสถานะอ่านแล้ว/ยังไม่อ่าน และไม่มี pagination ที่ไหนเลย
