import { AppShell } from '@/components/ui/app-shell';
import { ProfileEditor } from '@/components/profile/profile-editor';
import { SectionCard } from '@/components/ui/enterprise';
import { Icon } from '@/components/ui/icons';
import { PageHeading } from '@/components/ui/page-heading';
import { ROLE_LABELS, USER_ROLE, type UserRole } from '@/constants/workflow';
import { requireViewer } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ROLE_ACCESS: Record<UserRole, readonly string[]> = {
  [USER_ROLE.TEACHER]: [
    'สร้างและบันทึกสื่อเป็นฉบับร่าง',
    'ส่งสื่อไปยังกลุ่มสาระที่เลือก',
    'ติดตามสถานะและอ่านคอมเมนต์ที่ส่งกลับมา',
  ],
  [USER_ROLE.REVIEWER]: [
    'ดูสื่อที่ส่งมายังกลุ่มสาระที่ได้รับมอบหมาย',
    'คอมเมนต์แยกตามหัวข้อและส่งกลับแก้ไข',
    'ส่งสื่อที่ตรวจแล้วต่อให้หัวหน้าวิชาการ',
  ],
  [USER_ROLE.ACADEMIC_HEAD]: [
    'ตรวจและอนุมัติสื่อขั้นสุดท้าย',
    'ส่งสื่อกลับให้อาจารย์แก้ไขพร้อมคอมเมนต์',
    'ดูรายชื่อบุคลากรและตำแหน่งได้ แต่ตั้งตำแหน่งไม่ได้',
  ],
  [USER_ROLE.ADMIN]: [
    'ดูรายชื่อผู้สมัครและบุคลากรทั้งหมด',
    'แต่งตั้งตำแหน่งและกำหนดกลุ่มสาระรับผิดชอบ',
    'เปิดหรือปิดการใช้งานบัญชี',
  ],
};

export default async function ProfilePage() {
  const viewer = await requireViewer();
  const role = viewer.role;
  const subjectGroup = viewer.department;

  const avatarLabel =
    role === USER_ROLE.TEACHER
      ? 'อจ'
      : role === USER_ROLE.REVIEWER
        ? 'ผต'
        : role === USER_ROLE.ACADEMIC_HEAD
          ? 'วก'
          : 'AD';
  const responsibility =
    role === USER_ROLE.REVIEWER
      ? subjectGroup ?? 'ยังไม่ได้กำหนดกลุ่มสาระ'
      : role === USER_ROLE.ACADEMIC_HEAD
        ? 'ดูแลทุกกลุ่มสาระ'
        : role === USER_ROLE.ADMIN
          ? 'ดูแลบัญชีผู้ใช้ทั้งระบบ'
          : 'เลือกกลุ่มสาระปลายทางเมื่อส่งสื่อ';

  return (
    <AppShell role={role} viewerName={viewer.name}>
      <PageHeading
        eyebrow="My Profile"
        title="ข้อมูลของฉัน"
        description="ดูข้อมูลบัญชี ตำแหน่ง และขอบเขตงานที่ได้รับในระบบคลังสื่อการสอน"
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard title="ข้อมูลบัญชี" description="ข้อมูลที่ระบบใช้แสดงตัวตนและกำหนดหน้าที่ของคุณ">
          <ProfileEditor viewer={viewer} avatarLabel={avatarLabel} responsibility={responsibility} />
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="สิทธิ์การใช้งาน" description={`สิทธิ์ตามตำแหน่ง${ROLE_LABELS[role]}`}>
            <div className="space-y-3">
              {ROLE_ACCESS[role].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl bg-surface p-3.5">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-status-approved/10 text-status-approved">
                    <Icon name="check" className="size-3.5" />
                  </span>
                  <p className="text-xs leading-5 text-ink-muted">{item}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="ความปลอดภัยของบัญชี">
            <div className="flex gap-3 rounded-xl border border-status-pending/20 bg-status-pending/5 p-4">
              <Icon name="info" className="mt-0.5 size-4 shrink-0 text-status-pending" />
              <p className="text-xs leading-5 text-ink-muted">
                ชื่อ เบอร์โทร และรูปโปรไฟล์แก้ไขได้จากหน้านี้ ส่วนอีเมล ตำแหน่ง
                และกลุ่มสาระต้องให้ผู้ดูแลระบบเป็นผู้แก้ไข เพื่อป้องกันการเปลี่ยนสิทธิ์ของบัญชีด้วยตนเอง
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
