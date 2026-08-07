// src/constants/mock-data.ts
import { MEDIA_STATUS, type MediaStatus } from './workflow';

export type DemoMedia = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  type: string;
  author: string;
  updated: string;
  status: MediaStatus;
  downloads: number;
  tags: string[];
  accent: string;
};

export const DEMO_MEDIA: DemoMedia[] = [
  {
    id: 'MED-0248',
    title: 'การเดินทางของหยดน้ำ',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
    grade: 'ป.5',
    type: 'สไลด์ประกอบการสอน',
    author: 'อ.ปภาวี ศรีสุข',
    updated: 'วันนี้ 08:45',
    status: MEDIA_STATUS.APPROVED,
    downloads: 128,
    tags: ['วัฏจักรน้ำ', 'สิ่งแวดล้อม'],
    accent: 'sky',
  },
  {
    id: 'MED-0247',
    title: 'เศษส่วนในชีวิตประจำวัน',
    subject: 'คณิตศาสตร์',
    grade: 'ป.4',
    type: 'ชุดกิจกรรม',
    author: 'อ.ณัฐวุฒิ วงศ์ชัย',
    updated: 'เมื่อวาน 16:20',
    status: MEDIA_STATUS.IN_REVIEW,
    downloads: 0,
    tags: ['เศษส่วน', 'กิจกรรม'],
    accent: 'violet',
  },
  {
    id: 'MED-0245',
    title: 'อ่านจับใจความจากเรื่องสั้น',
    subject: 'ภาษาไทย',
    grade: 'ม.1',
    type: 'ใบงาน / ใบความรู้',
    author: 'อ.วรรณภา คงดี',
    updated: '6 ส.ค. 2569',
    status: MEDIA_STATUS.REVISION,
    downloads: 14,
    tags: ['การอ่าน', 'ภาษาไทย'],
    accent: 'rose',
  },
  {
    id: 'MED-0241',
    title: 'ระบบสุริยะและดาวเคราะห์',
    subject: 'วิทยาศาสตร์และเทคโนโลยี',
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
    grade: 'ม.3',
    type: 'ข้อสอบ / แบบฝึกหัด',
    author: 'อ.กมลชนก ใจดี',
    updated: '2 ส.ค. 2569',
    status: MEDIA_STATUS.PENDING,
    downloads: 0,
    tags: ['English', 'Conversation'],
    accent: 'emerald',
  },
  {
    id: 'MED-0232',
    title: 'หน้าที่พลเมืองและสังคม',
    subject: 'สังคมศึกษา ศาสนา และวัฒนธรรม',
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
