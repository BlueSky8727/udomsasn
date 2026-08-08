# Udomsasn Media QA — V2 Enterprise

ระบบคลังสื่อการสอนพร้อมขั้นตอนตรวจสองชั้น ระบบเวอร์ชัน ประวัติการทำรายการ Supabase และผู้ช่วย Typhoon

## Run
1. ใช้ Node 22+: `nvm install 22 && nvm use 22`
2. `cp .env.example .env.local` แล้วใส่ Supabase และ Typhoon keys
3. `npm install`
4. รัน migration ใน `supabase/migrations/202608070001_enterprise_media_qa.sql`
5. `npm run dev`

## AI safety
Typhoon เป็นผู้ช่วยสรุปและชี้จุดที่ควรตรวจเท่านั้น API `/api/ai/review` คืน `canChangeStatus:false`; มนุษย์เป็นผู้ตัดสินเสมอ และ API key อยู่ฝั่ง server เท่านั้น
