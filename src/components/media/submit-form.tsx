// src/components/media/submit-form.tsx
'use client';

import { useState, type ReactNode } from 'react';
import { FilePicker } from './file-picker';
import { Icon } from '@/components/ui/icons';
import { GRADE_LEVELS, LICENSES, MEDIA_TYPES, SUBJECTS } from '@/constants/media-options';
import { METADATA_FIELD_HINTS, METADATA_FIELD_LABELS, MIN_LENGTH, missingMetadataFields, missingRecommendedFields } from '@/constants/metadata';
import { checkTransition, getTransition, MEDIA_STATUS, USER_ROLE } from '@/constants/workflow';

type FormState = { title: string; description: string; subject: string; gradeLevel: string; learningObjectives: string; mediaType: string; license: string; tags: string };
const EMPTY_FORM: FormState = { title: '', description: '', subject: '', gradeLevel: '', learningObjectives: '', mediaType: '', license: '', tags: '' };

function Field({ name, required, children }: { name: keyof typeof METADATA_FIELD_LABELS; required?: boolean; children: ReactNode }) {
  const hint = METADATA_FIELD_HINTS[name];
  return <label className="block"><span className="text-sm font-semibold text-ink">{METADATA_FIELD_LABELS[name]}{required && <span className="ml-1 text-status-rejected">*</span>}</span>{hint && <span className="mt-1 block text-xs leading-5 text-ink-faint">{hint}</span>}<div className="mt-2">{children}</div></label>;
}

const inputClass = 'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-black/[0.01] outline-none transition placeholder:text-ink-faint focus:border-brand/45 focus:ring-4 focus:ring-brand/5';

function StepLabel({ number, title, description, icon }: { number: string; title: string; description: string; icon: 'edit' | 'paperclip' }) {
  return <div className="mb-5 flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name={icon} className="size-4.5"/></span><div><div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">STEP {number}</span></div><h2 className="mt-0.5 font-bold text-ink">{title}</h2><p className="mt-1 text-xs text-ink-faint">{description}</p></div></div>;
}

export function SubmitForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const set = (key: keyof FormState) => (value: string) => { setForm(prev => ({ ...prev, [key]: value })); setNotice(null); };
  const metadata = { ...form, tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean) };
  const missing = missingMetadataFields(metadata);
  const missingRecommended = missingRecommendedFields(metadata);
  const completedRequired = 5 - Math.min(5, missing.length);
  const progress = Math.max(8, Math.round((completedRequired / 5) * 85) + (files.length ? 15 : 0));
  const submitCheck = checkTransition(MEDIA_STATUS.DRAFT, MEDIA_STATUS.PENDING, { actorRole: USER_ROLE.TEACHER, actorId: 'preview-user', ownerId: 'preview-user', hasCompleteMetadata: missing.length === 0, fileCount: files.length });
  const submitRule = getTransition(MEDIA_STATUS.DRAFT, MEDIA_STATUS.PENDING);

  return <form onSubmit={e => e.preventDefault()} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
    <div className="space-y-6">
      <section className="rounded-2xl border border-line/80 bg-panel p-5 shadow-sm sm:p-6">
        <StepLabel number="01" title="ข้อมูลสื่อ" description="ข้อมูลส่วนนี้จะใช้ในการค้นหาและแสดงผลในคลัง" icon="edit" />
        <div className="space-y-5">
          <Field name="title" required><input className={inputClass} value={form.title} onChange={e => set('title')(e.target.value)} placeholder={`ชื่อสื่ออย่างน้อย ${MIN_LENGTH.title} ตัวอักษร`} /></Field>
          <Field name="description" required><textarea className={`${inputClass} min-h-28 resize-y`} value={form.description} onChange={e => set('description')(e.target.value)} placeholder={`อธิบายเนื้อหาและวิธีนำไปใช้อย่างน้อย ${MIN_LENGTH.description} ตัวอักษร`} /></Field>
          <div className="grid gap-5 sm:grid-cols-2"><Field name="subject" required><select className={inputClass} value={form.subject} onChange={e => set('subject')(e.target.value)}><option value="">เลือกวิชา</option>{SUBJECTS.map(x => <option key={x}>{x}</option>)}</select></Field><Field name="gradeLevel" required><select className={inputClass} value={form.gradeLevel} onChange={e => set('gradeLevel')(e.target.value)}><option value="">เลือกระดับชั้น</option>{GRADE_LEVELS.map(x => <option key={x}>{x}</option>)}</select></Field></div>
          <Field name="learningObjectives" required><textarea className={`${inputClass} min-h-24 resize-y`} value={form.learningObjectives} onChange={e => set('learningObjectives')(e.target.value)} placeholder="เช่น อธิบายวัฏจักรน้ำได้ / เชื่อมโยงการเปลี่ยนสถานะของน้ำกับสิ่งรอบตัวได้" /></Field>
          <div className="grid gap-5 sm:grid-cols-2"><Field name="mediaType" required><select className={inputClass} value={form.mediaType} onChange={e => set('mediaType')(e.target.value)}><option value="">เลือกประเภทสื่อ</option>{MEDIA_TYPES.map(x => <option key={x}>{x}</option>)}</select></Field><Field name="license"><select className={inputClass} value={form.license} onChange={e => set('license')(e.target.value)}><option value="">ยังไม่ระบุ</option>{LICENSES.map(x => <option key={x}>{x}</option>)}</select></Field></div>
          <Field name="tags"><input className={inputClass} value={form.tags} onChange={e => set('tags')(e.target.value)} placeholder="เช่น วัฏจักรน้ำ, การทดลอง, ป.5" /></Field>
        </div>
      </section>

      <section className="rounded-2xl border border-line/80 bg-panel p-5 shadow-sm sm:p-6"><StepLabel number="02" title="ไฟล์สื่อ" description="แนบไฟล์ต้นฉบับที่ต้องการส่งตรวจ อย่างน้อย 1 ไฟล์" icon="paperclip" /><FilePicker files={files} onChange={setFiles} /></section>
    </div>

    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section className="rounded-2xl border border-line/80 bg-panel p-5 shadow-sm"><h3 className="text-sm font-bold">ความพร้อมก่อนส่ง</h3><div className="mt-4 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${Math.min(progress,100)}%` }}/></div><div className="mt-2 flex items-center justify-between text-xs"><span className="text-ink-faint">ความครบถ้วน</span><strong className="text-brand">{Math.min(progress,100)}%</strong></div>
        <div className="mt-5 space-y-3 border-t border-line pt-4">{[
          [missing.length === 0, 'ข้อมูลที่จำเป็นครบถ้วน'], [files.length > 0, `แนบไฟล์แล้ว ${files.length} ไฟล์`], [missingRecommended.length === 0, 'ข้อมูลแนะนำครบถ้วน']
        ].map(([ok,label]) => <div key={String(label)} className="flex items-center gap-2.5 text-xs"><span className={`grid size-5 place-items-center rounded-full ${ok ? 'bg-status-approved/12 text-status-approved' : 'bg-surface text-ink-faint'}`}>{ok ? <Icon name="check" className="size-3"/> : <span className="size-1.5 rounded-full bg-current"/>}</span><span className={ok ? 'text-ink-muted' : 'text-ink-faint'}>{label}</span></div>)}</div>
      </section>

      <section className="rounded-2xl border border-brand/15 bg-brand/5 p-5"><div className="flex gap-3"><Icon name="shield" className="mt-0.5 size-5 shrink-0 text-brand"/><div><h3 className="text-sm font-semibold">ก่อนส่งตรวจ</h3><p className="mt-1 text-xs leading-5 text-ink-muted">ระบบจะตรวจ metadata และไฟล์อีกครั้งฝั่งเซิร์ฟเวอร์ ก่อนอนุญาตให้เปลี่ยนสถานะ</p></div></div></section>

      <div className="space-y-2"><button type="button" disabled={!submitCheck.ok} title={submitCheck.ok ? submitRule?.description : submitCheck.message} onClick={() => setNotice(`ข้อมูลครบตามเงื่อนไขแล้ว (${files.length} ไฟล์) แต่โหมดพรีวิวยังไม่เชื่อมฐานข้อมูล`)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-contrast shadow-lg shadow-brand/15 transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-45"><Icon name="upload" className="size-4"/>{submitRule?.label ?? 'ส่งตรวจ'}</button><button type="button" onClick={() => setNotice('โหมดพรีวิวยังไม่เชื่อมฐานข้อมูล จึงยังบันทึกร่างไม่ได้')} className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm font-medium text-ink-muted transition hover:bg-panel-hover">บันทึกร่าง</button></div>
      {!submitCheck.ok && <p className="text-center text-xs leading-5 text-ink-faint">{submitCheck.message}</p>}
      {notice && <p className="rounded-xl border border-line bg-panel px-4 py-3 text-xs leading-5 text-ink-muted">{notice}</p>}
    </aside>
  </form>;
}
