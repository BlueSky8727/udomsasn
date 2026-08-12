// backend/prisma/seed.ts
import { MediaStatus, PrismaClient, ReviewStage, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * บัญชีตัวอย่างสำหรับทดสอบกระบวนการตรวจสองชั้น (ดูรหัสผ่านใน README)
 *
 * seed ต้องบังคับตำแหน่งกลับทุกครั้ง ไม่ใช่แค่ตอนสร้างใหม่
 * เพราะระหว่างทดสอบมีการแต่งตั้งตำแหน่งผ่านหน้าผู้ดูแลระบบได้
 * ถ้า seed ไม่รีเซ็ตให้ บัญชีตัวอย่างจะเพี้ยนจากที่เอกสารบอกไว้และแก้กลับไม่ได้
 */
const DEMO_USERS = [
  {
    email: 'teacher@udomsasn.ac.th',
    name: 'อ.ปภาวี ศรีสุข',
    role: UserRole.TEACHER,
    department: null,
  },
  {
    email: 'reviewer@udomsasn.ac.th',
    name: 'อ.กิตติชัย',
    role: UserRole.REVIEWER,
    department: 'วิทยาศาสตร์และเทคโนโลยี',
  },
  {
    email: 'academic@udomsasn.ac.th',
    name: 'อ.สุนทรี ฝ่ายวิชาการ',
    role: UserRole.ACADEMIC_HEAD,
    department: null,
  },
  {
    email: 'admin@udomsasn.ac.th',
    name: 'ผอ.วราภรณ์',
    role: UserRole.ADMIN,
    department: null,
  },
] as const;

const SAMPLE_MEDIA = [
  {
    code: 'MED-260807-015',
    title: 'ระบบนิเวศและสายใยอาหาร',
    gradeLevel: 'ม.2',
    status: MediaStatus.PENDING,
  },
  {
    code: 'MED-260807-014',
    title: 'วงจรไฟฟ้ากระแสตรง: ชุดกิจกรรมทดลอง',
    gradeLevel: 'ม.3',
    status: MediaStatus.IN_REVIEW,
  },
  {
    code: 'MED-260807-010',
    title: 'การสังเคราะห์ด้วยแสง',
    gradeLevel: 'ม.1',
    status: MediaStatus.ACADEMIC_REVIEW,
  },
  {
    code: 'MED-0250',
    title: 'แรงและการเคลื่อนที่รอบตัวเรา',
    gradeLevel: 'ม.2',
    status: MediaStatus.APPROVED,
  },
] as const;

const SUBJECT = 'วิทยาศาสตร์';
const SUBJECT_GROUP = 'วิทยาศาสตร์และเทคโนโลยี';

function reviewStageFor(status: MediaStatus): ReviewStage | null {
  if (status === MediaStatus.ACADEMIC_REVIEW) return ReviewStage.ACADEMIC;
  if (status === MediaStatus.PENDING || status === MediaStatus.IN_REVIEW) {
    return ReviewStage.SUBJECT_GROUP;
  }
  return null;
}

async function main() {
  const passwordHash = await bcrypt.hash('Udomsasn@2026', 12);
  const byRole = new Map<UserRole, string>();

  for (const { email, name, role, department } of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, role, department, accountStatus: 'ACTIVE', emailVerifiedAt: new Date() },
      create: {
        email,
        name,
        passwordHash,
        role,
        department,
        accountStatus: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    byRole.set(role, user.id);
  }

  const ownerId = byRole.get(UserRole.TEACHER);
  const reviewerId = byRole.get(UserRole.REVIEWER);
  if (!ownerId || !reviewerId) throw new Error('สร้างบัญชีตัวอย่างไม่ครบ');

  for (const { code, title, gradeLevel, status } of SAMPLE_MEDIA) {
    await prisma.media.upsert({
      where: { code },
      update: {},
      create: {
        code,
        title,
        description: 'สื่อการเรียนรู้ตัวอย่างสำหรับทดสอบระบบฐานข้อมูลและกระบวนการตรวจ',
        subject: SUBJECT,
        subjectGroup: SUBJECT_GROUP,
        gradeLevel,
        mediaType: 'เอกสาร',
        learningObjectives: {
          K: ['อธิบายแนวคิดหลักได้'],
          P: ['ประยุกต์ใช้ได้'],
          A: ['เห็นคุณค่าการเรียนรู้'],
        },
        tags: ['ตัวอย่าง'],
        status,
        reviewStage: reviewStageFor(status),
        ownerId,
        assigneeId: status === MediaStatus.IN_REVIEW ? reviewerId : null,
      },
    });
  }

  console.log(`seeded ${DEMO_USERS.length} users and ${SAMPLE_MEDIA.length} media`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
