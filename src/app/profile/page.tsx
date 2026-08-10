import { AppShell } from '@/components/ui/app-shell';
import { Pill, SectionCard } from '@/components/ui/enterprise';
import { Icon, type IconName } from '@/components/ui/icons';
import { PageHeading } from '@/components/ui/page-heading';
import { ROLE_LABELS, USER_ROLE, type UserRole } from '@/constants/workflow';
import { getViewerName, getViewerRole, getViewerSubjectGroup } from '@/lib/auth';

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

function ProfileDetail({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-surface p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
        <Icon name={icon} className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-ink-faint">{label}</p>
        <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const [role, name, subjectGroup] = await Promise.all([
    getViewerRole(),
    getViewerName(),
    getViewerSubjectGroup(),
  ]);

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
    <AppShell role={role}>
      <PageHeading
        eyebrow="My Profile"
        title="ข้อมูลของฉัน"
        description="ดูข้อมูลบัญชี ตำแหน่ง และขอบเขตงานที่ได้รับในระบบคลังสื่อการสอน"
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard title="ข้อมูลบัญชี" description="ข้อมูลที่ระบบใช้แสดงตัวตนและกำหนดหน้าที่ของคุณ">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-strong text-xl font-bold text-brand-contrast shadow-lg shadow-brand/15">
              {avatarLabel}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-[-.025em]">{name}</h2>
                <Pill tone="ok">พร้อมใช้งาน</Pill>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{ROLE_LABELS[role]}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ProfileDetail icon="users" label="ตำแหน่งในระบบ" value={ROLE_LABELS[role]} />
            <ProfileDetail icon="book" label="ขอบเขตที่รับผิดชอบ" value={responsibility} />
            <ProfileDetail icon="shield" label="ประเภทบัญชี" value="บัญชีบุคลากรของระบบ" />
            <ProfileDetail icon="clock" label="สถานะบัญชี" value="เข้าใช้งานได้" />
          </div>
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
                ชื่อ ตำแหน่ง และกลุ่มสาระอ่านจากบัญชีที่เข้าสู่ระบบ การเปลี่ยนตำแหน่งทำได้โดยหัวหน้าวิชาการเท่านั้น
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
