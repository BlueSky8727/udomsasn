-- แยกรอบตรวจของหัวหน้ากลุ่มสาระและหัวหน้าวิชาการให้เป็นสถานะที่บังคับได้จริง
-- แยก migration นี้เพื่อให้ enum values ถูก commit ก่อนถูกนำไปใช้ใน constraint ถัดไป
alter type public.media_status
  add value if not exists 'ACADEMIC_REVIEW' after 'IN_REVIEW';

alter type public.media_status
  add value if not exists 'ACADEMIC_REVISION' after 'REVISION';
