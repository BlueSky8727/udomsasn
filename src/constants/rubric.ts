/**
 * rubric.ts — เกณฑ์ตรวจ R1–R9 ในรูปโค้ด
 *
 * แหล่งความจริงเดียวของเกณฑ์ ใช้ร่วมกันระหว่าง
 * หน้าตรวจของผู้ตรวจ (review_items) และตัวคัดกรองของ AI (ai_reviews)
 * คำอธิบายฉบับเต็มอยู่ที่ docs/rubric.md
 */

export const RUBRIC_CODES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9'] as const;
export type RubricCode = (typeof RUBRIC_CODES)[number];

/** BLOCKING = ไม่ผ่านข้อใดข้อหนึ่งแล้วอนุมัติไม่ได้ */
export type RubricLevel = 'BLOCKING' | 'ADVISORY';

/**
 * บทบาทของ AI ในแต่ละข้อ (กฎเหล็กข้อ 8: AI ไม่ตัดสิน คนตัดสินเสมอ)
 * - CHECKS       ตรวจได้ค่อนข้างแน่นอน ผลใช้ประกอบได้โดยตรง
 * - FLAGS        ชี้จุดน่าสงสัยได้ แต่คนต้องเปิดดูเองก่อนตัดสิน
 * - HUMAN_ONLY   AI ห้ามให้ข้อสรุปผ่าน/ไม่ผ่าน ยกข้อความให้คนอ่านเท่านั้น
 */
export type RubricAiRole = 'CHECKS' | 'FLAGS' | 'HUMAN_ONLY';

export const RUBRIC_LEVEL_LABELS: Record<RubricLevel, string> = {
  BLOCKING: 'จำเป็นต้องผ่าน',
  ADVISORY: 'ข้อเสนอแนะ',
};

export const RUBRIC_AI_ROLE_LABELS: Record<RubricAiRole, string> = {
  CHECKS: 'AI ตรวจได้',
  FLAGS: 'AI ช่วยขึ้นธง',
  HUMAN_ONLY: 'AI ห้ามสรุป ให้คนตัดสิน',
};

/** ผลตรวจรายข้อ */
export const RUBRIC_RESULT = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  NA: 'NA',
} as const;

export type RubricResult = (typeof RUBRIC_RESULT)[keyof typeof RUBRIC_RESULT];

export const RUBRIC_RESULT_LABELS: Record<RubricResult, string> = {
  PASS: 'ผ่าน',
  FAIL: 'ไม่ผ่าน',
  NA: 'ไม่เกี่ยวข้อง',
};

export type RubricItem = {
  code: RubricCode;
  title: string;
  level: RubricLevel;
  aiRole: RubricAiRole;
  /** คำอธิบายสำหรับแสดงในหน้าตรวจ */
  description: string;
  /** จุดที่ผู้ตรวจควรดู — ใช้เป็น checklist ย่อยในหน้าตรวจ */
  checkpoints: readonly string[];
};

export const RUBRIC_ITEMS: readonly RubricItem[] = [
  {
    code: 'R1',
    title: 'metadata ครบ',
    level: 'BLOCKING',
    aiRole: 'CHECKS',
    description: 'ข้อมูลประกอบสื่อกรอกครบตามที่ระบบกำหนด',
    checkpoints: [
      'ชื่อเรื่อง คำอธิบาย วิชา ระดับชั้น จุดประสงค์ ครบทุกช่อง',
      'ข้อความในแต่ละช่องสื่อความได้จริง ไม่ใช่ใส่มาให้ผ่าน ๆ',
    ],
  },
  {
    code: 'R2',
    title: 'ตรงกับจุดประสงค์ที่ระบุ',
    level: 'BLOCKING',
    aiRole: 'FLAGS',
    description: 'เนื้อหาในไฟล์สอดคล้องกับจุดประสงค์การเรียนรู้ที่เจ้าของเขียนไว้',
    checkpoints: [
      'เนื้อหาครอบคลุมจุดประสงค์ที่ระบุครบทุกข้อ',
      'ไม่มีเนื้อหาส่วนใหญ่ที่หลุดออกนอกจุดประสงค์',
    ],
  },
  {
    code: 'R3',
    title: 'ความถูกต้องทางวิชาการ',
    level: 'BLOCKING',
    aiRole: 'HUMAN_ONLY',
    description: 'เนื้อหาถูกต้องตามหลักวิชา ผู้ตรวจที่เป็นคนต้องเป็นผู้ตัดสินข้อนี้เสมอ',
    checkpoints: [
      'ข้อเท็จจริง นิยาม และสูตรถูกต้อง',
      'ไม่มีข้อสรุปที่ล้าสมัยหรือถูกแย้งไปแล้ว',
      'ตัวอย่างและเฉลยคำนวณถูก',
    ],
  },
  {
    code: 'R4',
    title: 'เหมาะกับระดับชั้น',
    level: 'BLOCKING',
    aiRole: 'FLAGS',
    description: 'ความยาก คำศัพท์ ความยาว และตัวอย่าง เหมาะกับระดับชั้นที่ระบุ',
    checkpoints: [
      'คำศัพท์และภาษาเหมาะกับวัยผู้เรียน',
      'ความยาวและปริมาณเนื้อหาใช้ได้จริงในคาบเรียน',
      'ตัวอย่างอยู่ในประสบการณ์ของผู้เรียนระดับนั้น',
    ],
  },
  {
    code: 'R5',
    title: 'ใช้ต่อได้โดยไม่ต้องถามเจ้าของ',
    level: 'BLOCKING',
    aiRole: 'FLAGS',
    description: 'ข้อที่สำคัญที่สุด อาจารย์คนอื่นที่ไม่เคยคุยกับเจ้าของต้องเปิดไฟล์แล้วสอนได้เลย',
    checkpoints: [
      'ไม่อ้างถึงสิ่งที่คนนอกไม่มี เช่น "ตามที่คุยกันคาบที่แล้ว" หรือใบงานที่ไม่ได้แนบมา',
      'ไม่ผูกกับบริบทเฉพาะห้อง เช่น ชื่อนักเรียน ตารางสอน กำหนดส่งงานจริง',
      'มีคำแนะนำการใช้พอให้คนอื่นใช้ตามได้',
      'ไฟล์ครบชุด ไม่มีการอ้างถึงไฟล์เสียง วิดีโอ หรือเฉลยที่ไม่ได้อัปโหลดมา',
      'ลิงก์ภายนอกเปิดได้โดยไม่ต้องขอสิทธิ์',
    ],
  },
  {
    code: 'R6',
    title: 'ลิขสิทธิ์และแหล่งที่มา',
    level: 'BLOCKING',
    aiRole: 'FLAGS',
    description: 'สิ่งที่นำมาจากที่อื่นต้องอ้างอิงแหล่งที่มา และอยู่ในเงื่อนไขที่นำไปใช้สอนต่อได้',
    checkpoints: [
      'รูป ตาราง และข้อความที่นำมาจากที่อื่นมีการอ้างอิง',
      'ไม่มีลายน้ำหรือโลโก้ของเจ้าของสิทธิ์รายอื่น',
      'สัญญาอนุญาตที่ระบุไว้สอดคล้องกับเนื้อหาจริง',
    ],
  },
  {
    code: 'R7',
    title: 'ไม่มีข้อมูลส่วนบุคคลนักเรียนหลุด',
    level: 'BLOCKING',
    aiRole: 'CHECKS',
    description:
      'ไม่มีข้อมูลที่ระบุตัวนักเรียนได้ปรากฏในไฟล์ ถ้าขึ้นธงข้อนี้ต้องให้คนตรวจซ้ำทุกครั้ง',
    checkpoints: [
      'ไม่มีชื่อ-นามสกุล เลขประจำตัว เลขบัตรประชาชน คะแนนรายบุคคล',
      'ไม่มีเบอร์โทร ที่อยู่ อีเมล หรือรูปถ่ายที่ระบุตัวนักเรียนได้',
      'ตรวจจุดที่มองข้ามบ่อย: หัว/ท้ายกระดาษ ชื่อไฟล์ comment ในสไลด์ ชีตที่ซ่อนไว้ metadata ของไฟล์',
    ],
  },
  {
    code: 'R8',
    title: 'คุณภาพไฟล์',
    level: 'ADVISORY',
    aiRole: 'CHECKS',
    description: 'ไฟล์เปิดได้ อ่านออก และมีขนาดเหมาะสม',
    checkpoints: [
      'ไฟล์ไม่เสีย เปิดได้ปกติ',
      'ความละเอียดพออ่านออก เสียงได้ยินชัด',
      'ฟอนต์ไม่เพี้ยน ขนาดไฟล์ไม่ใหญ่เกินจำเป็น',
    ],
  },
  {
    code: 'R9',
    title: 'ภาษาและการนำเสนอ',
    level: 'ADVISORY',
    aiRole: 'CHECKS',
    description: 'สะกดถูก ใช้ภาษาสม่ำเสมอ จัดหน้าอ่านง่าย',
    checkpoints: ['สะกดคำถูกต้อง', 'ใช้ภาษาและรูปแบบสม่ำเสมอทั้งไฟล์', 'ลำดับเนื้อหาเป็นระบบ'],
  },
];

export const RUBRIC_BY_CODE: Record<RubricCode, RubricItem> = Object.fromEntries(
  RUBRIC_ITEMS.map((item) => [item.code, item]),
) as Record<RubricCode, RubricItem>;

export const BLOCKING_RUBRIC_CODES: readonly RubricCode[] = RUBRIC_ITEMS.filter(
  (item) => item.level === 'BLOCKING',
).map((item) => item.code);

export const ADVISORY_RUBRIC_CODES: readonly RubricCode[] = RUBRIC_ITEMS.filter(
  (item) => item.level === 'ADVISORY',
).map((item) => item.code);

/** ข้อที่ AI ห้ามให้ข้อสรุป — ใช้กันไม่ให้เผลอเอาผล AI ไปแสดงเป็นคำตัดสิน */
export const AI_NO_CONCLUSION_CODES: readonly RubricCode[] = RUBRIC_ITEMS.filter(
  (item) => item.aiRole === 'HUMAN_ONLY',
).map((item) => item.code);

export const isRubricCode = (value: unknown): value is RubricCode =>
  typeof value === 'string' && (RUBRIC_CODES as readonly string[]).includes(value);

/**
 * ข้อ BLOCKING ที่ยังไม่ได้ผล PASS
 *
 * ใช้เตือนผู้ตรวจก่อนกดอนุมัติ **ไม่ใช่ตัวบล็อกอัตโนมัติ**
 * การอนุมัติยังเป็นการตัดสินใจของคน และยังต้องผ่าน assertTransition() เหมือนเดิม
 */
export function unresolvedBlockingCodes(
  results: Partial<Record<RubricCode, RubricResult>>,
): readonly RubricCode[] {
  return BLOCKING_RUBRIC_CODES.filter((code) => results[code] !== RUBRIC_RESULT.PASS);
}
