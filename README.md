# Udomsasn Media QA — V2 Enterprise

ระบบคลังสื่อการสอนพร้อม workflow ตรวจสอบคุณภาพ R1–R9, versioning, audit trail, Supabase และ Typhoon AI screening

## Run
1. ใช้ Node 22+: `nvm install 22 && nvm use 22`
2. `cp .env.example .env.local` แล้วใส่ Supabase และ Typhoon keys
3. `npm install`
4. รัน migration ใน `supabase/migrations/202608070001_enterprise_media_qa.sql`
5. `npm run dev`

## AI safety
Typhoon เป็นผู้ช่วยคัดกรองเท่านั้น API `/api/ai/review` คืน `canChangeStatus:false`; R3 ถูกสงวนให้มนุษย์ตัดสินเสมอ และ API key อยู่ฝั่ง server เท่านั้น
