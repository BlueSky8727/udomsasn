// src/components/media/submit-form.tsx
'use client';

import { useState, type ReactNode } from 'react';
import { FilePicker } from './file-picker';
import { Icon } from '@/components/ui/icons';
import { Pill } from '@/components/ui/enterprise';
import {
  DURATION_OPTIONS,
  GRADE_LEVELS,
  LEARNING_DOMAINS,
  MAX_OBJECTIVES_PER_DOMAIN,
  SUBJECT_GROUPS,
  type LearningDomainCode,
} from '@/constants/media-options';
import { METADATA_FIELD_LABELS, MIN_LENGTH, missingMetadataFields } from '@/constants/metadata';
import {
  checkTransition,
  getTransition,
  MEDIA_STATUS,
  USER_ROLE,
  type MediaStatus,
} from '@/constants/workflow';

/* ------------------------------------------------------------------ */
/* รูปร่างข้อมูลในฟอร์ม                                                  */
/* ------------------------------------------------------------------ */

type Assessment = { indicator: string; criteria: string; passing: string };

/**
 * จุดประสงค์ 1 ข้อ พร้อมเกณฑ์วัดผลของข้อนั้น
 *
 * เก็บเกณฑ์ไว้ในแถวเดียวกับจุดประสงค์ เพื่อให้ตารางการวัดผลมีจำนวนแถว
 * เท่ากับจุดประสงค์เสมอโดยอัตโนมัติ ไม่ต้องคอยซิงก์สองก้อนให้ตรงกัน
 * และ id ทำให้ลบแถวกลางแล้ว input ที่เหลือไม่สลับค่าหรือเสียโฟกัส
 */
type ObjectiveRow = { id: string; text: string; assessment: Assessment };

type FormState = {
  title: string;
  subject: string;
  gradeLevel: string;
  durationMinutes: number;
  description: string;
  learningProcess: string;
  attachmentNote: string;
  /**
   * ชั่วคราวจนกว่าจะต่อ auth เสร็จ — พอต่อแล้วให้ดึงจาก session + profiles แทน
   * และห้ามเชื่อค่านี้ฝั่งเซิร์ฟเวอร์เด็ดขาด เจ้าของสื่อต้องอ่านจาก session เท่านั้น (กฎเหล็กข้อ 2)
   */
  submitterName: string;
  objectives: Record<LearningDomainCode, ObjectiveRow[]>;
};

export type SubmitFormInitialMedia = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: MediaStatus;
};

const EMPTY_ASSESSMENT: Assessment = { indicator: '', criteria: '', passing: '' };

let objectiveSeq = 0;
const newObjective = (): ObjectiveRow => ({
  id: `obj-${++objectiveSeq}`,
  text: '',
  assessment: { ...EMPTY_ASSESSMENT },
});

const EMPTY_FORM: FormState = {
  title: '',
  subject: '',
  gradeLevel: '',
  durationMinutes: DURATION_OPTIONS[0],
  description: '',
  learningProcess: '',
  attachmentNote: '',
  submitterName: '',
  objectives: {
    K: [{ id: 'obj-K', text: '', assessment: { ...EMPTY_ASSESSMENT } }],
    P: [{ id: 'obj-P', text: '', assessment: { ...EMPTY_ASSESSMENT } }],
    A: [{ id: 'obj-A', text: '', assessment: { ...EMPTY_ASSESSMENT } }],
  },
};

/** สีประจำด้าน K/P/A — เขียนเป็นสตริงเต็มเพราะ Tailwind ต้องเห็นชื่อคลาสตรง ๆ */
const DOMAIN_BADGE: Record<LearningDomainCode, string> = {
  K: 'bg-brand/10 text-brand',
  P: 'bg-status-approved/10 text-status-approved',
  A: 'bg-status-revision/10 text-status-revision',
};

const OBJECTIVE_PLACEHOLDER: Record<LearningDomainCode, string> = {
  K: 'ระบุจุดประสงค์ด้านความรู้ (Knowledge)',
  P: 'ระบุจุดประสงค์ด้านทักษะ (Process)',
  A: 'ระบุจุดประสงค์ด้านเจตคติ/คุณลักษณะ (Attitude)',
};

/* ------------------------------------------------------------------ */
/* ชิ้นส่วนหน้าตา                                                        */
/* ------------------------------------------------------------------ */

const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand/45 focus:ring-4 focus:ring-brand/5';

function Card({ title, hint, children }: { title?: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line/80 bg-panel p-5 shadow-sm">
      {title && (
        <div className="mb-4 flex items-center gap-1.5">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          {hint && (
            <span title={hint} className="text-ink-faint">
              <Icon name="info" className="size-3.5" />
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-2 block text-xs font-semibold text-ink">
      {children}
      {required && <span className="ml-0.5 text-status-rejected">*</span>}
    </span>
  );
}

function DomainBadge({ code }: { code: LearningDomainCode }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${DOMAIN_BADGE[code]}`}
    >
      {code}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ฟอร์ม                                                               */
/* ------------------------------------------------------------------ */

export function SubmitForm({ initialMedia }: { initialMedia?: SubmitFormInitialMedia }) {
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY_FORM,
    title: initialMedia?.title ?? '',
    subject: initialMedia?.subject ?? '',
    gradeLevel: initialMedia?.grade ?? '',
    objectives: {
      K: [{ id: 'obj-K', text: '', assessment: { ...EMPTY_ASSESSMENT } }],
      P: [{ id: 'obj-P', text: '', assessment: { ...EMPTY_ASSESSMENT } }],
      A: [{ id: 'obj-A', text: '', assessment: { ...EMPTY_ASSESSMENT } }],
    },
  }));
  const [files, setFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice(null);
  };

  const updateObjectives = (
    code: LearningDomainCode,
    change: (rows: ObjectiveRow[]) => ObjectiveRow[],
  ) => {
    setForm((prev) => ({
      ...prev,
      objectives: { ...prev.objectives, [code]: change(prev.objectives[code]) },
    }));
    setNotice(null);
  };

  const setObjective = (code: LearningDomainCode, id: string, text: string) =>
    updateObjectives(code, (rows) => rows.map((row) => (row.id === id ? { ...row, text } : row)));

  const addObjective = (code: LearningDomainCode) =>
    updateObjectives(code, (rows) =>
      rows.length >= MAX_OBJECTIVES_PER_DOMAIN ? rows : [...rows, newObjective()],
    );

  // เหลือข้อสุดท้ายห้ามลบ ไม่งั้นด้านนั้นจะไม่มีช่องให้กรอกเลย
  const removeObjective = (code: LearningDomainCode, id: string) =>
    updateObjectives(code, (rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)));

  const setAssessment = (
    code: LearningDomainCode,
    id: string,
    field: keyof Assessment,
    value: string,
  ) =>
    updateObjectives(code, (rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, assessment: { ...row.assessment, [field]: value } } : row,
      ),
    );

  /**
   * จุดประสงค์ K/P/A สามช่อง ถูกรวมเป็น learningObjectives ก้อนเดียว
   * เพื่อให้ยังตรวจด้วย missingMetadataFields() ตัวเดิมได้ (กฎเหล็กข้อ 1)
   */
  const learningObjectives = LEARNING_DOMAINS.flatMap((d) =>
    form.objectives[d.code].map((row) => row.text.trim()).filter(Boolean),
  ).join('\n');

  const metadata = {
    title: form.title,
    description: form.description,
    subject: form.subject,
    gradeLevel: form.gradeLevel,
    learningObjectives,
  };

  const missing = missingMetadataFields(metadata);

  const fromStatus = initialMedia?.status ?? MEDIA_STATUS.DRAFT;
  const toStatus =
    fromStatus === MEDIA_STATUS.ACADEMIC_REVISION
      ? MEDIA_STATUS.ACADEMIC_REVIEW
      : MEDIA_STATUS.PENDING;

  // ปุ่มส่งตรวจยังต้องผ่านตารางเส้นทางเดียวกับฝั่งเซิร์ฟเวอร์เสมอ
  const submitCheck = checkTransition(fromStatus, toStatus, {
    actorRole: USER_ROLE.TEACHER,
    actorId: 'preview-user',
    ownerId: 'preview-user',
    hasCompleteMetadata: missing.length === 0,
    fileCount: files.length,
  });
  const submitRule = getTransition(fromStatus, toStatus);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-bold tracking-[-.02em]">
          {initialMedia
            ? initialMedia.status === MEDIA_STATUS.REVISION ||
              initialMedia.status === MEDIA_STATUS.ACADEMIC_REVISION
              ? 'แก้ไขสื่อตามข้อเสนอแนะ'
              : 'แก้ไขฉบับร่าง'
            : 'ข้อมูลประกอบ'}
        </h1>
        {initialMedia && <Pill tone="neutral">{initialMedia.id}</Pill>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ---------------- คอลัมน์ซ้าย ---------------- */}
        <div className="space-y-5">
          <Card title="ข้อมูลเบื้องต้น">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <Label required>ชื่อสื่อ</Label>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="เช่น ชุดกิจกรรมวงจรไฟฟ้า"
                />
              </label>

              <label className="block">
                <Label required>ส่งตรวจไปยังกลุ่มสาระ</Label>
                <select
                  className={inputClass}
                  value={form.subject}
                  onChange={(e) => set('subject', e.target.value)}
                >
                  <option value="">เลือกกลุ่มสาระปลายทาง</option>
                  {SUBJECT_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.subjects.map((subject) => (
                        <option key={subject}>{subject}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span className="mt-1.5 block text-[11px] leading-5 text-ink-faint">
                  ระบบจะส่งให้หัวหน้ากลุ่มสาระนี้เป็นผู้ตรวจรอบแรก
                </span>
              </label>

              <label className="block">
                <Label required>ชั้น</Label>
                <select
                  className={inputClass}
                  value={form.gradeLevel}
                  onChange={(e) => set('gradeLevel', e.target.value)}
                >
                  <option value="">เลือกชั้น</option>
                  {GRADE_LEVELS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <Label>ชื่อผู้สอน / ผู้ส่ง</Label>
                <input
                  className={inputClass}
                  value={form.submitterName}
                  onChange={(e) => set('submitterName', e.target.value)}
                  placeholder="เช่น อ.สมชาย ใจดี"
                />
                <span className="mt-1.5 block text-[11px] leading-5 text-ink-faint">
                  ช่องชั่วคราว เมื่อต่อระบบล็อกอินแล้วจะดึงชื่อจากบัญชีผู้ใช้ให้อัตโนมัติ
                </span>
              </label>
            </div>
          </Card>

          <Card title="ระยะเวลา">
            <div className="flex flex-wrap gap-2.5">
              {DURATION_OPTIONS.map((minutes) => {
                const active = form.durationMinutes === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => set('durationMinutes', minutes)}
                    className={`min-w-24 rounded-xl border px-4 py-2.5 text-sm transition ${
                      active
                        ? 'border-brand bg-brand/8 font-semibold text-brand'
                        : 'border-line bg-surface text-ink-muted hover:bg-panel-hover'
                    }`}
                  >
                    {minutes} นาที
                  </button>
                );
              })}
            </div>
          </Card>

          <Card
            title="จุดประสงค์การเรียนรู้"
            hint="เขียนเป็นข้อ ๆ ว่าผู้เรียนจะทำอะไรได้หลังใช้สื่อนี้ แยกตามด้านความรู้ ทักษะ และเจตคติ"
          >
            <div className="space-y-5">
              {LEARNING_DOMAINS.map((domain) => {
                const rows = form.objectives[domain.code];
                const full = rows.length >= MAX_OBJECTIVES_PER_DOMAIN;
                return (
                  <div key={domain.code} className="space-y-2">
                    {rows.map((row, index) => (
                      <div key={row.id} className="flex items-center gap-3">
                        <DomainBadge code={domain.code} />
                        <input
                          className={inputClass}
                          value={row.text}
                          onChange={(e) => setObjective(domain.code, row.id, e.target.value)}
                          placeholder={
                            index === 0 ? OBJECTIVE_PLACEHOLDER[domain.code] : `ข้อที่ ${index + 1}`
                          }
                          aria-label={`จุดประสงค์ด้าน${domain.label} ข้อที่ ${index + 1}`}
                        />
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeObjective(domain.code, row.id)}
                            aria-label={`ลบจุดประสงค์ด้าน${domain.label} ข้อที่ ${index + 1}`}
                            className="shrink-0 rounded-lg p-2 text-ink-faint transition hover:bg-panel-hover hover:text-status-rejected"
                          >
                            <Icon name="x" className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addObjective(domain.code)}
                      disabled={full}
                      className="ml-12 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brand transition hover:bg-brand/8 disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent"
                    >
                      <Icon name="plus" className="size-3.5" />
                      {full
                        ? `ครบ ${MAX_OBJECTIVES_PER_DOMAIN} ข้อแล้ว`
                        : `เพิ่มข้อ (${rows.length}/${MAX_OBJECTIVES_PER_DOMAIN})`}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <label className="block">
              <Label required>สาระการเรียนรู้</Label>
              <textarea
                rows={4}
                className={`${inputClass} resize-y`}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder={`ระบุเนื้อหา สาระสำคัญ และประเด็นที่ผู้เรียนควรรู้ อย่างน้อย ${MIN_LENGTH.description} ตัวอักษร`}
              />
            </label>

            <label className="mt-4 block">
              <Label>กระบวนการเรียนรู้</Label>
              <textarea
                rows={4}
                className={`${inputClass} resize-y`}
                value={form.learningProcess}
                onChange={(e) => set('learningProcess', e.target.value)}
                placeholder="อธิบายขั้นตอนการจัดกิจกรรม/วิธีใช้สื่อในการจัดการเรียนรู้"
              />
            </label>
          </Card>
        </div>

        {/* ---------------- คอลัมน์ขวา ---------------- */}
        <aside className="space-y-5">
          <Card title="เส้นทางการส่งตรวจ">
            <div className="space-y-3">
              {[
                {
                  number: '1',
                  title: 'อาจารย์สร้างและส่งสื่อ',
                  detail: form.subject
                    ? `ส่งไปยังกลุ่มสาระ${form.subject}`
                    : 'กรุณาเลือกกลุ่มสาระปลายทาง',
                },
                {
                  number: '2',
                  title: 'หัวหน้ากลุ่มสาระตรวจรอบแรก',
                  detail: 'ถ้าต้องแก้ไขหรือไม่ผ่าน จะส่งเหตุผลกลับมาที่อาจารย์',
                },
                {
                  number: '3',
                  title: 'หัวหน้าวิชาการอนุมัติ',
                  detail: 'เมื่อผ่านขั้นสุดท้าย ระบบจะแจ้งผลและเผยแพร่เข้าคลัง',
                },
              ].map((step) => (
                <div key={step.number} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
                    {step.number}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">{step.title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-ink-faint">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Pill>Typhoon</Pill>
            <p className="mt-3 text-xs leading-6 text-ink-muted">
              จะเริ่มคัดกรองเบื้องต้นทั้งเนื้อหาและ metadata เมื่อข้อมูลเพียงพอ ผล AI
              ไม่เปลี่ยนสถานะ และไม่สรุปความถูกต้องทางวิชาการ
            </p>

            <button
              type="button"
              onClick={() => setNotice('โหมดพรีวิวยังไม่เชื่อมฐานข้อมูล จึงยังบันทึกร่างไม่ได้')}
              className="mt-4 w-full rounded-xl border border-line bg-surface py-2.5 text-sm font-medium text-ink-muted transition hover:bg-panel-hover"
            >
              บันทึกร่าง
            </button>

            <button
              type="button"
              disabled={!submitCheck.ok}
              title={submitCheck.ok ? submitRule?.description : submitCheck.message}
              onClick={() =>
                setNotice(
                  `พร้อมส่งให้หัวหน้ากลุ่มสาระ${form.subject} (${files.length} ไฟล์) แต่โหมดพรีวิวยังไม่เชื่อมฐานข้อมูล`,
                )
              }
              className="mt-2 w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-contrast transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitRule?.label ?? 'ส่งให้ตรวจ'}
            </button>

            {!submitCheck.ok && (
              <p className="mt-2.5 text-center text-[11px] leading-5 text-ink-faint">
                {submitCheck.message}
                {missing.length > 0 && (
                  <>
                    <br />
                    ยังขาด: {missing.map((f) => METADATA_FIELD_LABELS[f]).join(', ')}
                  </>
                )}
              </p>
            )}

            {notice && (
              <p className="mt-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-[11px] leading-5 text-ink-muted">
                {notice}
              </p>
            )}
          </Card>

          <Card title="สื่อประกอบ">
            <FilePicker files={files} onChange={setFiles} />

            <label className="mt-3 block rounded-xl border border-line bg-surface p-3">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
                <Icon name="image" className="size-4 shrink-0 text-ink-faint" />
                หมายเหตุเพิ่มเติม
              </span>
              <textarea
                rows={3}
                className={`${inputClass} resize-y bg-panel py-2 text-xs`}
                value={form.attachmentNote}
                onChange={(e) => set('attachmentNote', e.target.value)}
                placeholder="อัปโหลดไฟล์ตัวอย่าง หรือแนบหมายเหตุเพิ่มเติม เพื่อประกอบการพิจารณาสื่อ"
              />
            </label>
          </Card>

          <Card
            title="การวัดและประเมินผล"
            hint="หนึ่งแถวต่อจุดประสงค์หนึ่งข้อ เพิ่มหรือลบจุดประสงค์แล้วตารางนี้จะเปลี่ยนตามเอง"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-80 text-left text-[11px]">
                <thead>
                  <tr className="text-ink-faint">
                    <th className="w-10 pb-2 font-semibold">ด้าน</th>
                    <th className="px-1 pb-2 font-semibold">ตัวชี้วัด</th>
                    <th className="px-1 pb-2 font-semibold">เกณฑ์การวัด</th>
                    <th className="px-1 pb-2 font-semibold">เกณฑ์ผ่าน</th>
                  </tr>
                </thead>
                <tbody>
                  {LEARNING_DOMAINS.flatMap((domain) => {
                    const rows = form.objectives[domain.code];
                    return rows.map((row, index) => {
                      const tag = rows.length > 1 ? `${domain.code}${index + 1}` : domain.code;
                      return (
                        <tr key={row.id}>
                          <td className="py-1.5 pr-1 align-middle">
                            <span
                              title={
                                row.text.trim() || `ยังไม่ได้กรอกจุดประสงค์ด้าน${domain.label}`
                              }
                              className={`grid h-7 min-w-7 place-items-center rounded-md px-1 text-xs font-bold ${DOMAIN_BADGE[domain.code]}`}
                            >
                              {tag}
                            </span>
                          </td>
                          {(
                            [
                              ['indicator', 'ระบุตัวชี้วัด'],
                              ['criteria', 'ระบุเกณฑ์การวัด'],
                              ['passing', 'ระบุเกณฑ์ผ่าน'],
                            ] as const
                          ).map(([field, placeholder]) => (
                            <td key={field} className="px-1 py-1.5">
                              <input
                                className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-[11px] outline-none transition placeholder:text-ink-faint focus:border-brand/45"
                                value={row.assessment[field]}
                                onChange={(e) =>
                                  setAssessment(domain.code, row.id, field, e.target.value)
                                }
                                placeholder={placeholder}
                                aria-label={`${placeholder} ${tag}`}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}
