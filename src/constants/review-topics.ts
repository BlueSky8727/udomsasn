import type { ReviewDecision } from '@/types/backend';

export const REVIEW_TOPIC_IDS = [
  'learning_objectives',
  'learning_content',
  'learning_process',
  'assessment',
  'supporting_media',
] as const;

export type ReviewTopicId = (typeof REVIEW_TOPIC_IDS)[number];

export type ReviewTopic = {
  id: ReviewTopicId;
  title: string;
  description: string;
};

/** หัวข้อคอมเมนต์ตรงกับส่วนที่อาจารย์กรอกในแบบฟอร์มส่งสื่อ */
export const REVIEW_TOPICS: readonly ReviewTopic[] = [
  {
    id: 'learning_objectives',
    title: 'จุดประสงค์การเรียนรู้',
    description: 'ตรวจจุดประสงค์ด้านความรู้ (K) ทักษะ (P) และเจตคติ (A) ที่อาจารย์ระบุ',
  },
  {
    id: 'learning_content',
    title: 'สาระการเรียนรู้',
    description: 'ตรวจความถูกต้อง ความครบถ้วน และความเหมาะสมของสาระสำคัญที่อาจารย์ระบุ',
  },
  {
    id: 'learning_process',
    title: 'กระบวนการเรียนรู้',
    description: 'ตรวจขั้นตอนการจัดกิจกรรมและวิธีใช้สื่อในการจัดการเรียนรู้',
  },
  {
    id: 'assessment',
    title: 'การวัดและประเมินผล',
    description: 'ตรวจตัวชี้วัด เกณฑ์การวัด และเกณฑ์ผ่านของจุดประสงค์แต่ละด้าน',
  },
  {
    id: 'supporting_media',
    title: 'สื่อประกอบ',
    description:
      'ตรวจไฟล์และหมายเหตุเพิ่มเติม รวมถึงความครบถ้วน แหล่งที่มา สิทธิ์การใช้ และข้อมูลส่วนบุคคล',
  },
];

/** ผลการตัดสินของผู้ตรวจแต่ละรอบ (กฎเหล็กข้อ 9: UI เป็นภาษาไทย) */
export const REVIEW_DECISION_LABELS: Record<ReviewDecision, string> = {
  FORWARD: 'ส่งต่อหัวหน้าวิชาการ',
  REVISION: 'ส่งกลับแก้ไข',
  MINOR_REVISION: 'ส่งกลับแก้ไขเล็กน้อย',
  APPROVED: 'อนุมัติเผยแพร่',
  REJECTED: 'ไม่ผ่าน',
};

/** โทนป้ายของผลการตัดสิน ให้สายผ่านเป็นเขียว สายแก้ไขเป็นเหลือง สายไม่ผ่านเป็นแดง */
export const REVIEW_DECISION_TONES: Record<ReviewDecision, 'ok' | 'warn' | 'danger'> = {
  FORWARD: 'ok',
  REVISION: 'warn',
  MINOR_REVISION: 'warn',
  APPROVED: 'ok',
  REJECTED: 'danger',
};
