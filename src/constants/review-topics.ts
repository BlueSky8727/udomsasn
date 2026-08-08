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
