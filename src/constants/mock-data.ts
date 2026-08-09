// src/constants/mock-data.ts
import { MEDIA_STATUS, type MediaStatus } from './workflow';
import type { ReviewTopicId } from './review-topics';

export type ReviewStage = 'SUBJECT_GROUP' | 'ACADEMIC';

export type DemoFeedback = {
  fromRole: 'SUBJECT_HEAD' | 'ACADEMIC_HEAD';
  from: string;
  decision: 'REVISION' | 'MINOR_REVISION' | 'REJECTED' | 'APPROVED';
  message: string;
  /** คอมเมนต์ที่ผู้ตรวจเขียนแยกตามหัวข้อในแบบฟอร์ม */
  topicComments?: Partial<Record<ReviewTopicId, string>>;
  /** ผลตรวจครบทุกหัวข้อที่อาจารย์ส่งมา */
  topicResults?: Partial<Record<ReviewTopicId, 'PASS' | 'NEEDS_WORK'>>;
  at: string;
};

export type DemoMedia = {
  id: string;
  title: string;
  subject: string;
  /** กลุ่มสาระปลายทางที่อาจารย์เลือกตอนส่งตรวจ */
  subjectGroup: string;
  grade: string;
  type: string;
  author: string;
  updated: string;
  status: MediaStatus;
  downloads: number;
  tags: string[];
  accent: string;
  /** ขั้นที่กำลังตรวจ ใช้แสดงเส้นทางในหน้าของเจ้าของ */
  reviewStage?: ReviewStage;
  /** ผลที่ส่งกลับถึงเจ้าของ พร้อมผู้ตัดสินและข้อความที่ต้องเก็บย้อนหลัง */
  feedback?: DemoFeedback;
};

export const DEMO_MEDIA: DemoMedia[] = [
  {
    id: 'MED-0250',
    title: 'แรงและการเคลื่อนที่รอบตัวเรา',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
    subjectGroup: 'วิทยาศาสตร์และเทคโนโลยี',
    grade: 'ป.6',
    type: 'ชุดกิจกรรม',
    author: 'อ.ปภาวี ศรีสุข',
    updated: 'วันนี้ 10:20',
    status: MEDIA_STATUS.DRAFT,
    downloads: 0,
    tags: ['แรง', 'การเคลื่อนที่'],
    accent: 'cyan',
  },
  {
    id: 'MED-0248',
    title: 'การเดินทางของหยดน้ำ',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
    subjectGroup: 'วิทยาศาสตร์และเทคโนโลยี',
    grade: 'ป.5',
    type: 'สไลด์ประกอบการสอน',
    author: 'อ.ปภาวี ศรีสุข',
    updated: 'วันนี้ 08:45',
    status: MEDIA_STATUS.APPROVED,
    downloads: 128,
    tags: ['วัฏจักรน้ำ', 'สิ่งแวดล้อม'],
    accent: 'sky',
    reviewStage: 'ACADEMIC',
    feedback: {
      fromRole: 'ACADEMIC_HEAD',
      from: 'หัวหน้าวิชาการ',
      decision: 'APPROVED',
      message: 'ผ่านการอนุมัติขั้นสุดท้ายแล้ว สื่อถูกเผยแพร่เข้าคลังเรียบร้อย',
      topicResults: {
        learning_objectives: 'PASS',
        learning_content: 'PASS',
        learning_process: 'PASS',
        assessment: 'PASS',
        supporting_media: 'PASS',
      },
      at: 'วันนี้ 09:05',
    },
  },
  {
    id: 'MED-0247',
    title: 'เศษส่วนในชีวิตประจำวัน',
    subject: 'คณิตศาสตร์',
    subjectGroup: 'คณิตศาสตร์',
    grade: 'ป.4',
    type: 'ชุดกิจกรรม',
    author: 'อ.ปภาวี ศรีสุข',
    updated: 'เมื่อวาน 16:20',
    status: MEDIA_STATUS.IN_REVIEW,
    downloads: 0,
    tags: ['เศษส่วน', 'กิจกรรม'],
    accent: 'violet',
    reviewStage: 'SUBJECT_GROUP',
  },
  {
    id: 'MED-0245',
    title: 'อ่านจับใจความจากเรื่องสั้น',
    subject: 'ภาษาไทย',
    subjectGroup: 'ภาษาไทย',
    grade: 'ม.1',
    type: 'ใบงาน / ใบความรู้',
    author: 'อ.ปภาวี ศรีสุข',
    updated: '6 ส.ค. 2569',
    status: MEDIA_STATUS.REVISION,
    downloads: 14,
    tags: ['การอ่าน', 'ภาษาไทย'],
    accent: 'rose',
    reviewStage: 'SUBJECT_GROUP',
    feedback: {
      fromRole: 'SUBJECT_HEAD',
      from: 'หัวหน้ากลุ่มสาระภาษาไทย',
      decision: 'REVISION',
      message: 'กรุณาเพิ่มเกณฑ์ประเมินข้อ 2 และระบุแหล่งที่มาของเรื่องสั้นให้ชัดเจน',
      topicComments: {
        assessment: 'เพิ่มเกณฑ์ประเมินข้อ 2 พร้อมระบุเกณฑ์ผ่านให้ชัดเจน',
        supporting_media: 'ระบุแหล่งที่มาของเรื่องสั้นและสิทธิ์การนำมาใช้ประกอบการสอน',
      },
      topicResults: {
        learning_objectives: 'PASS',
        learning_content: 'PASS',
        learning_process: 'PASS',
        assessment: 'NEEDS_WORK',
        supporting_media: 'NEEDS_WORK',
      },
      at: '6 ส.ค. 2569 · 14:30',
    },
  },
  {
    id: 'MED-0246',
    title: 'การเปลี่ยนสถานะของสสาร',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
    subjectGroup: 'วิทยาศาสตร์และเทคโนโลยี',
    grade: 'ป.5',
    type: 'สไลด์ประกอบการสอน',
    author: 'อ.ปภาวี ศรีสุข',
    updated: '6 ส.ค. 2569',
    status: MEDIA_STATUS.ACADEMIC_REVISION,
    downloads: 0,
    tags: ['สสาร', 'การทดลอง'],
    accent: 'teal',
    reviewStage: 'ACADEMIC',
    feedback: {
      fromRole: 'ACADEMIC_HEAD',
      from: 'หัวหน้าวิชาการ',
      decision: 'MINOR_REVISION',
      message: 'เนื้อหาผ่านแล้ว กรุณาขยายตัวอักษรหน้า 12 และแก้คำสะกดหน้า 18 ก่อนส่งกลับมาตรวจอีกครั้ง',
      topicComments: {
        learning_content: 'เนื้อหาถูกต้องและผ่านการตรวจแล้ว ไม่ต้องแก้ไขส่วนนี้',
        supporting_media: 'ขยายขนาดตัวอักษรหน้า 12 และแก้คำสะกดหน้า 18 ก่อนส่งกลับมาตรวจอีกครั้ง',
      },
      topicResults: {
        learning_objectives: 'PASS',
        learning_content: 'PASS',
        learning_process: 'PASS',
        assessment: 'PASS',
        supporting_media: 'NEEDS_WORK',
      },
      at: '6 ส.ค. 2569 · 16:10',
    },
  },
  {
    id: 'MED-0243',
    title: 'แบบฝึกทักษะการสื่อสารภาษาอังกฤษ',
    subject: 'ภาษาต่างประเทศ',
    subjectGroup: 'ภาษาต่างประเทศ',
    grade: 'ม.1',
    type: 'ข้อสอบ / แบบฝึกหัด',
    author: 'อ.ปภาวี ศรีสุข',
    updated: '5 ส.ค. 2569',
    status: MEDIA_STATUS.REJECTED,
    downloads: 0,
    tags: ['English', 'Communication'],
    accent: 'orange',
    reviewStage: 'SUBJECT_GROUP',
    feedback: {
      fromRole: 'SUBJECT_HEAD',
      from: 'หัวหน้ากลุ่มสาระภาษาต่างประเทศ',
      decision: 'REJECTED',
      message: 'ไม่ผ่าน เนื่องจากไฟล์แนบไม่มีเฉลยและยังไม่ระบุสิทธิ์การใช้ภาพประกอบ',
      topicComments: {
        assessment: 'เพิ่มเฉลยแบบฝึกหัดให้ครบทุกข้อ เพื่อให้อาจารย์ตรวจคำตอบได้',
        supporting_media: 'ระบุแหล่งที่มาและสิทธิ์การใช้ภาพประกอบทุกภาพในไฟล์แนบ',
      },
      topicResults: {
        learning_objectives: 'PASS',
        learning_content: 'PASS',
        learning_process: 'PASS',
        assessment: 'NEEDS_WORK',
        supporting_media: 'NEEDS_WORK',
      },
      at: '5 ส.ค. 2569 · 11:10',
    },
  },
  {
    id: 'MED-0241',
    title: 'ระบบสุริยะและดาวเคราะห์',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
    subjectGroup: 'วิทยาศาสตร์และเทคโนโลยี',
    grade: 'ม.2',
    type: 'วิดีโอ',
    author: 'อ.สุเมธ พัฒนศิลป์',
    updated: '4 ส.ค. 2569',
    status: MEDIA_STATUS.APPROVED,
    downloads: 256,
    tags: ['อวกาศ', 'ดาราศาสตร์'],
    accent: 'amber',
  },
  {
    id: 'MED-0238',
    title: 'English for Everyday Life',
    subject: 'ภาษาต่างประเทศ',
    subjectGroup: 'ภาษาต่างประเทศ',
    grade: 'ม.3',
    type: 'ข้อสอบ / แบบฝึกหัด',
    author: 'อ.กมลชนก ใจดี',
    updated: '2 ส.ค. 2569',
    status: MEDIA_STATUS.PENDING,
    downloads: 0,
    tags: ['English', 'Conversation'],
    accent: 'emerald',
    reviewStage: 'SUBJECT_GROUP',
  },
  {
    id: 'MED-0232',
    title: 'หน้าที่พลเมืองและสังคม',
    subject: 'สังคมศึกษา ศาสนา และวัฒนธรรม',
    subjectGroup: 'สังคมศึกษา ศาสนา และวัฒนธรรม',
    grade: 'ป.6',
    type: 'แผนการจัดการเรียนรู้',
    author: 'อ.ชยพล ยอดคำ',
    updated: '30 ก.ค. 2569',
    status: MEDIA_STATUS.APPROVED,
    downloads: 91,
    tags: ['พลเมือง', 'สังคม'],
    accent: 'indigo',
  },
];

export const DASHBOARD_STATS = [
  { label: 'สื่อทั้งหมด', value: '248', delta: '+18 เดือนนี้', icon: 'layers' as const },
  { label: 'เผยแพร่แล้ว', value: '196', delta: '79% ของทั้งหมด', icon: 'check' as const },
  { label: 'รอตรวจ', value: '17', delta: '5 รายการใหม่วันนี้', icon: 'clock' as const },
  {
    label: 'ดาวน์โหลดเดือนนี้',
    value: '1,284',
    delta: '+12.4% จากเดือนก่อน',
    icon: 'download' as const,
  },
];
