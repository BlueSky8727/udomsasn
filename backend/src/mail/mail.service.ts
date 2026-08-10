import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

/**
 * ส่งอีเมลออกจากระบบ
 *
 * ถ้าตั้งค่า SMTP_HOST ไว้จะส่งอีเมลจริง ถ้าไม่ได้ตั้งจะเขียนลิงก์ลง log แทน
 * เพื่อให้ระหว่างพัฒนายังทดสอบขั้นตอนยืนยันอีเมลได้โดยไม่ต้องมีเซิร์ฟเวอร์เมล
 *
 * โหมด log ใช้ได้เฉพาะตอนพัฒนา บน production จะไม่ยอมให้เซิร์ฟเวอร์ start เลย
 * เพราะลิงก์ยืนยัน = สิทธิ์ยืนยันบัญชีแทนคนอื่น ใครอ่าน log ได้ก็สวมสิทธิ์ได้
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    // Google แสดง App Password เป็น "abcd efgh ijkl mnop" ถ้าก๊อปมาทั้งเว้นวรรคจะ login ไม่ผ่าน
    // ตัดช่องว่างทั้งหมดทิ้งให้เลย เพราะรหัสจริงไม่มีช่องว่างอยู่แล้ว
    const pass = process.env.SMTP_PASSWORD?.replace(/\s+/g, '');
    this.from = process.env.MAIL_FROM?.trim() || user || 'no-reply@udomsasn.ac.th';

    // ต้องครบทั้งสามค่าถึงจะส่งจริงได้ ถ้าตั้งมาครึ่ง ๆ จะแย่กว่าไม่ตั้งเลย
    // เพราะระบบจะพยายามส่งแล้วล้มเหลว โดยไม่มีลิงก์ใน log ให้ใช้แทน
    const missing = [
      !host && 'SMTP_HOST',
      !user && 'SMTP_USER',
      !pass && 'SMTP_PASSWORD',
    ].filter(Boolean);

    if (missing.length > 0) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `ต้องตั้งค่า ${missing.join(', ')} บน production ไม่อย่างนั้นลิงก์ยืนยันอีเมลจะไปโผล่ใน log แทนที่จะส่งถึงผู้ใช้`,
        );
      }
      this.transporter = null;
      this.logger.warn(
        `ยังตั้งค่าอีเมลไม่ครบ (ขาด ${missing.join(', ')}) — จะแสดงลิงก์ยืนยันใน log แทนการส่งจริง`,
      );
      return;
    }

    const port = Number(process.env.SMTP_PORT ?? 587);
    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    this.logger.log(`ส่งอีเมลผ่าน ${host}:${port} ในนาม ${user}`);
  }

  /**
   * ทัก SMTP ตั้งแต่ตอน start เพื่อให้รู้ทันทีว่า host/รหัสผ่านผิด
   * ไม่ throw เพราะเมลล่มไม่ควรทำให้ทั้งระบบใช้งานไม่ได้ แค่ต้องเห็นใน log ชัด ๆ
   */
  async onModuleInit(): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      this.logger.log('เชื่อมต่อเซิร์ฟเวอร์อีเมลสำเร็จ พร้อมส่งอีเมลจริง');
    } catch (error) {
      this.logger.error(
        `เชื่อมต่อเซิร์ฟเวอร์อีเมลไม่สำเร็จ ผู้สมัครจะไม่ได้รับอีเมลยืนยัน: ${(error as Error).message}`,
      );
    }
  }

  /** true = ส่งอีเมลออกไปจริง, false = เขียนลง log เพราะยังไม่ได้ตั้งค่า SMTP */
  get isLive(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordResetEmail(to: string, name: string, code: string): Promise<void> {
    const subject = `รหัสตั้งรหัสผ่านใหม่ ${code} — คลังสื่อการสอน อุดมสาสน์`;
    const text = [
      `เรียน ${name}`,
      '',
      'มีการขอตั้งรหัสผ่านใหม่สำหรับบัญชีนี้ รหัสยืนยันของคุณคือ',
      '',
      `    ${code}`,
      '',
      'รหัสมีอายุ 30 นาที และใช้ได้ครั้งเดียว',
      '',
      'หากคุณไม่ได้เป็นผู้ขอ กรุณาเพิกเฉยต่ออีเมลฉบับนี้ รหัสผ่านเดิมของคุณยังใช้งานได้ตามปกติ',
    ].join('\n');

    if (!this.transporter) {
      this.logger.log(`[DEV] รหัสตั้งรหัสผ่านใหม่ของ ${to}: ${code}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text });
    } catch (error) {
      this.logger.error(`ส่งอีเมลตั้งรหัสผ่านใหม่ไปยัง ${to} ไม่สำเร็จ`, error as Error);
      throw error;
    }
  }

  /** ใช้โดยสคริปต์ `npm run mail:test` เพื่อยิงอีเมลทดสอบก่อนเปิดใช้งานจริง */
  async sendTestEmail(to: string): Promise<void> {
    if (!this.transporter) throw new Error('ยังไม่ได้ตั้งค่า SMTP_HOST');
    await this.transporter.verify();
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'ทดสอบระบบอีเมล คลังสื่อการสอน อุดมสาสน์',
      text: 'ถ้าคุณได้รับอีเมลฉบับนี้ แปลว่าระบบส่งอีเมลยืนยันตัวตนตั้งค่าถูกต้องแล้ว',
    });
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    link: string,
    code: string,
  ): Promise<void> {
    const subject = `รหัสยืนยันอีเมล ${code} — คลังสื่อการสอน อุดมสาสน์`;
    const text = [
      `เรียน ${name}`,
      '',
      'รหัสยืนยันอีเมลของคุณคือ',
      '',
      `    ${code}`,
      '',
      'นำรหัสนี้ไปกรอกในหน้าสมัครสมาชิก หรือจะกดลิงก์ด้านล่างเพื่อยืนยันทันทีก็ได้',
      link,
      '',
      'รหัสและลิงก์มีอายุ 24 ชั่วโมง และใช้ได้ครั้งเดียว',
      'เมื่อยืนยันอีเมลแล้ว หัวหน้าวิชาการจะตรวจสอบและเปิดใช้งานบัญชีให้อีกครั้ง',
      'หากคุณไม่ได้สมัครใช้งาน กรุณาเพิกเฉยต่ออีเมลฉบับนี้',
    ].join('\n');

    if (!this.transporter) {
      this.logger.log(`[DEV] รหัสยืนยันของ ${to}: ${code} — ลิงก์: ${link}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text });
    } catch (error) {
      // ผู้สมัครไม่ควรเห็น error ของระบบเมล ให้บันทึกไว้แล้วปล่อยให้กด "ส่งอีเมลอีกครั้ง" ได้
      this.logger.error(`ส่งอีเมลยืนยันไปยัง ${to} ไม่สำเร็จ`, error as Error);
      throw error;
    }
  }
}
