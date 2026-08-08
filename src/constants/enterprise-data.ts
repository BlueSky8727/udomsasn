// src/constants/enterprise-data.ts
import type { MediaStatus } from './workflow';
export type ReviewJob = {
  id: string;
  title: string;
  owner: string;
  subject: string;
  department: string;
  grade: string;
  version: number;
  status: MediaStatus;
  age: string;
  aiRisk: 'ต่ำ' | 'กลาง' | 'สูง';
  assignee?: string;
};
export const REVIEW_JOBS: ReviewJob[] = [
  {
    id: 'MED-260807-015',
    title: 'ระบบนิเวศและสายใยอาหาร',
    owner: 'อ.ชลธิชา แก้วใส',
    subject: 'วิทยาศาสตร์',
    department: 'วิทยาศาสตร์และเทคโนโลยี',
    grade: 'ม.2',
    version: 1,
    status: 'PENDING',
    age: '9 นาที',
    aiRisk: 'กลาง',
  },
  {
    id: 'MED-260807-014',
    title: 'วงจรไฟฟ้ากระแสตรง: ชุดกิจกรรมทดลอง',
    owner: 'อ.นภัสสร สุขใจ',
    subject: 'วิทยาศาสตร์',
    department: 'วิทยาศาสตร์และเทคโนโลยี',
    grade: 'ม.3',
    version: 2,
    status: 'IN_REVIEW',
    age: '18 นาที',
    aiRisk: 'ต่ำ',
    assignee: 'อ.กิตติชัย',
  },
  {
    id: 'MED-260807-013',
    title: 'การอ่านจับใจความจากข่าวร่วมสมัย',
    owner: 'อ.วรรณา แสงทอง',
    subject: 'ภาษาไทย',
    department: 'ภาษาไทย',
    grade: 'ม.2',
    version: 1,
    status: 'PENDING',
    age: '42 นาที',
    aiRisk: 'กลาง',
  },
  {
    id: 'MED-260807-012',
    title: 'Worksheet: Linear Equation',
    owner: 'อ.ธนวัฒน์ มณี',
    subject: 'คณิตศาสตร์',
    department: 'คณิตศาสตร์',
    grade: 'ม.1',
    version: 3,
    status: 'REVISION',
    age: '2 ชม.',
    aiRisk: 'สูง',
  },
  {
    id: 'MED-260807-011',
    title: 'ภูมิอากาศเอเชียตะวันออกเฉียงใต้',
    owner: 'อ.ปภาวดี ใจดี',
    subject: 'สังคมศึกษา',
    department: 'สังคมศึกษา ศาสนา และวัฒนธรรม',
    grade: 'ม.2',
    version: 1,
    status: 'PENDING',
    age: '3 ชม.',
    aiRisk: 'ต่ำ',
  },
  {
    id: 'MED-260807-010',
    title: 'การสังเคราะห์ด้วยแสง',
    owner: 'อ.สุเมธ พัฒนศิลป์',
    subject: 'วิทยาศาสตร์',
    department: 'วิทยาศาสตร์และเทคโนโลยี',
    grade: 'ม.1',
    version: 2,
    status: 'ACADEMIC_REVIEW',
    age: '26 นาที',
    aiRisk: 'ต่ำ',
    assignee: 'หัวหน้าวิชาการ',
  },
];
export const TIMELINE = [
  {
    time: '09:05',
    title: 'อนุมัติสื่อ MED-260807-010',
    detail: 'อ.กิตติชัย · ตรวจครบและเผยแพร่เข้าคลัง',
  },
  {
    time: '08:47',
    title: 'Typhoon คัดกรองเสร็จ',
    detail: 'MED-260807-014 · พบ 1 จุดที่ควรตรวจเรื่องแหล่งที่มา',
  },
  {
    time: '08:31',
    title: 'ส่งฉบับแก้ไข v3',
    detail: 'Worksheet: Linear Equation · กลับเข้าคิวตรวจ',
  },
  {
    time: '08:10',
    title: 'ดาวน์โหลดสื่อไปใช้สอน',
    detail: 'การสังเคราะห์ด้วยแสง · ดาวน์โหลดครั้งที่ 38',
  },
];
export const QA_STATS = [
  { label: 'สื่อในคลัง', value: '428', detail: '+24 เดือนนี้' },
  { label: 'รอตรวจ', value: '12', detail: 'เฉลี่ย 5.2 ชม.' },
  { label: 'อัตราผ่าน', value: '81%', detail: '+4.1% จากเดือนก่อน' },
  { label: 'นำกลับไปใช้', value: '1,284', detail: '+18% เดือนนี้' },
];
