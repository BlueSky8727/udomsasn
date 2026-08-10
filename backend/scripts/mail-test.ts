// backend/scripts/mail-test.ts
/**
 * ยิงอีเมลทดสอบเพื่อตรวจว่าตั้งค่า SMTP ถูกต้องแล้ว
 *
 *   npm run mail:test -- someone@example.com
 *
 * ใช้ก่อนเปิดให้คนสมัครจริง จะได้ไม่ต้องไปรู้ตอนที่ผู้สมัครไม่ได้รับอีเมลแล้ว
 */
import 'dotenv/config';
import { MailService } from '../src/mail/mail.service';

const to = process.argv[2];

if (!to) {
  console.error('ระบุอีเมลปลายทางด้วย เช่น  npm run mail:test -- someone@example.com');
  process.exit(1);
}

const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM', 'APP_URL'];
console.log('ค่าที่อ่านได้จาก .env');
for (const key of required) {
  const value = process.env[key];
  const shown = !value ? '(ยังไม่ได้ตั้ง)' : key === 'SMTP_PASSWORD' ? '(ตั้งไว้แล้ว)' : value;
  console.log(`  ${key.padEnd(14)} ${shown}`);
}

if (!process.env.SMTP_HOST) {
  console.error('\nยังไม่ได้ตั้ง SMTP_HOST ระบบจะยังไม่ส่งอีเมลจริง');
  process.exit(1);
}

async function main(): Promise<void> {
  try {
    await new MailService().sendTestEmail(to);
    console.log(`\nส่งอีเมลทดสอบไปที่ ${to} เรียบร้อย ลองเปิดกล่องจดหมาย (เช็คโฟลเดอร์ Spam ด้วย)`);
  } catch (error) {
    const message = (error as Error).message;
    console.error(`\nส่งไม่สำเร็จ: ${message}`);
    if (/Invalid login|535|BadCredentials/i.test(message)) {
      console.error('รหัสผ่านไม่ถูกต้อง — ถ้าใช้ Gmail ต้องใช้ App Password 16 หลัก ไม่ใช่รหัสผ่านปกติ');
    }
    if (/ENOTFOUND|EAI_AGAIN/i.test(message)) console.error('หา SMTP_HOST ไม่เจอ ตรวจชื่อ host อีกครั้ง');
    if (/ETIMEDOUT|ECONNREFUSED/i.test(message)) {
      console.error('ต่อไม่ติด อาจถูก firewall บล็อกพอร์ตนี้');
    }
    process.exit(1);
  }
}

void main();
