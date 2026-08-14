// src/app/(auth)/layout.tsx

/**
 * หน้าก่อนเข้าระบบล็อกไว้ที่โหมดสว่างเสมอ
 *
 * ธีมมืด/สว่างเป็นค่าที่ผู้ใช้เลือกไว้หลังเข้าระบบ (เก็บใน localStorage แล้วตั้งที่ <html>)
 * แต่หน้าล็อกอินเป็นหน้าสาธารณะที่ต้องหน้าตาเหมือนกันทุกเครื่อง จึงครอบ data-theme="light"
 * ทับไว้ที่นี่ ตัวแปรสีในกิ่งนี้จึงเป็นชุดสว่างเสมอ ไม่ตามค่าที่ <html> ถืออยู่
 *
 * ทำที่ระดับ layout (เรนเดอร์ฝั่งเซิร์ฟเวอร์) ไม่ใช่ตั้งด้วย JS หลังโหลด จะได้ไม่มีจอกะพริบ
 */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-theme="light" className="min-h-screen bg-surface text-ink">
      {children}
    </div>
  );
}
