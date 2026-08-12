'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AvatarCropper } from '@/components/ui/avatar-cropper';
import { Pill } from '@/components/ui/enterprise';
import { Icon, type IconName } from '@/components/ui/icons';
import { ROLE_LABELS } from '@/constants/workflow';
import type { BackendUser } from '@/types/backend';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

type FieldErrors = Partial<Record<'name' | 'phone' | 'avatar' | 'form', string>>;

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
        <p className="mt-1 break-words text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function errorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่';
  const message = 'message' in payload ? payload.message : undefined;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string').join(', ');
  return typeof message === 'string' ? message : 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่';
}

export function ProfileEditor({
  viewer,
  avatarLabel,
  responsibility,
}: {
  viewer: BackendUser;
  avatarLabel: string;
  responsibility: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [account, setAccount] = useState(viewer);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(viewer.name);
  const [phone, setPhone] = useState(viewer.phone ?? '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  /** ไฟล์ต้นฉบับก่อนครอบ เก็บไว้เพื่อกดปรับตำแหน่งซ้ำได้โดยไม่เสียคุณภาพเพิ่ม */
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [cropSource, setCropSource] = useState<File | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const existingAvatarUrl = account.hasAvatar
    ? `/api/backend/auth/avatar/${encodeURIComponent(account.id)}?v=${avatarVersion}`
    : null;
  const shownAvatarUrl = previewUrl ?? existingAvatarUrl;

  function resetForm() {
    setName(account.name);
    setPhone(account.phone ?? '');
    setAvatar(null);
    setPreviewUrl(null);
    setSourceFile(null);
    setCropSource(null);
    setErrors({});
    setEditing(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function pickAvatar(file?: File) {
    setErrors((current) => ({ ...current, avatar: undefined, form: undefined }));
    if (!file) return;
    if (!AVATAR_TYPES.has(file.type)) {
      setErrors((current) => ({ ...current, avatar: 'รองรับเฉพาะรูป PNG, JPG หรือ WebP' }));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setErrors((current) => ({ ...current, avatar: 'รูปโปรไฟล์ต้องมีขนาดไม่เกิน 2 MB' }));
      return;
    }
    // เลือกไฟล์แล้วเข้าหน้าครอบรูปทันที ไฟล์ที่ใช้จริงคือไฟล์ที่ผ่านการครอบแล้ว
    setSourceFile(file);
    setCropSource(file);
  }

  /** ดึงรูปเดิมจากเซิร์ฟเวอร์กลับมาครอบใหม่ โดยไม่ต้องเลือกไฟล์อีกรอบ */
  async function recropCurrentAvatar() {
    if (!existingAvatarUrl) return;
    setErrors((current) => ({ ...current, avatar: undefined, form: undefined }));
    try {
      const response = await fetch(existingAvatarUrl);
      if (!response.ok) throw new Error('โหลดรูปเดิมไม่สำเร็จ');
      const blob = await response.blob();
      const current = new File([blob], 'current-avatar', { type: blob.type || 'image/jpeg' });
      setSourceFile(current);
      setCropSource(current);
    } catch {
      setErrors((current) => ({ ...current, avatar: 'โหลดรูปเดิมไม่สำเร็จ กรุณาเลือกรูปใหม่แทน' }));
    }
  }

  function applyCrop(cropped: File) {
    setCropSource(null);
    setAvatar(cropped);
    // effect ด้านบนคืนหน่วยความจำของ URL ก่อนหน้าให้เองเมื่อค่าเปลี่ยน
    setPreviewUrl(URL.createObjectURL(cropped));
  }

  function cancelCrop() {
    setCropSource(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const nextErrors: FieldErrors = {};
    if (cleanName.length < 3) nextErrors.name = 'กรอกชื่อ-นามสกุลอย่างน้อย 3 ตัวอักษร';
    if (!/^[0-9]{9,10}$/.test(cleanPhone)) nextErrors.phone = 'กรอกเบอร์โทรเป็นตัวเลข 9-10 หลัก';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setBusy(true);
    setErrors({});
    setNotice(null);
    try {
      const body = new FormData();
      body.set('name', cleanName);
      body.set('phone', cleanPhone);
      if (avatar) body.set('avatar', avatar);
      const response = await fetch('/api/backend/auth/me', { method: 'PATCH', body });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(errorMessage(payload));

      const updated = payload as BackendUser;
      setAccount(updated);
      setName(updated.name);
      setPhone(updated.phone ?? '');
      setAvatar(null);
      setPreviewUrl(null);
      setSourceFile(null);
      setAvatarVersion(Date.now());
      setEditing(false);
      setNotice('บันทึกข้อมูลบัญชีเรียบร้อยแล้ว');
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {cropSource && <AvatarCropper source={cropSource} onCancel={cancelCrop} onConfirm={applyCrop} />}

      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-strong text-xl font-bold text-brand-contrast shadow-lg shadow-brand/15">
          {shownAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownAvatarUrl} alt={`รูปโปรไฟล์ของ ${account.name}`} className="size-full object-cover" />
          ) : (
            avatarLabel
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-[-.025em]">{account.name}</h2>
            <Pill tone="ok">พร้อมใช้งาน</Pill>
          </div>
          <p className="mt-1 text-sm text-ink-muted">{ROLE_LABELS[account.role]}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setNotice(null);
            }}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-brand-contrast transition hover:bg-brand-strong"
          >
            <Icon name="edit" className="size-4" />
            แก้ไขข้อมูล
          </button>
        )}
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-status-approved/10 px-4 py-3 text-xs font-medium text-status-approved">
          {notice}
        </p>
      )}

      {editing ? (
        <form onSubmit={save} noValidate className="mt-5 space-y-4">
          <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-panel px-4 text-xs font-semibold transition hover:bg-panel-hover"
                >
                  <Icon name="cloudUpload" className="size-4" />
                  {account.hasAvatar || avatar ? 'เปลี่ยนรูปโปรไฟล์' : 'เพิ่มรูปโปรไฟล์'}
                </button>
                {(avatar || account.hasAvatar) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (sourceFile) {
                        setCropSource(sourceFile);
                        return;
                      }
                      void recropCurrentAvatar();
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-panel px-4 text-xs font-semibold transition hover:bg-panel-hover"
                  >
                    <Icon name="edit" className="size-4" />
                    ปรับตำแหน่ง / ครอบรูป
                  </button>
                )}
                <p className="text-[11px] text-ink-faint">
                  {avatar ? 'ครอบรูปแล้ว พร้อมบันทึก' : 'PNG, JPG หรือ WebP ขนาดไม่เกิน 2 MB'}
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => pickAvatar(event.target.files?.[0])}
                className="sr-only"
              />
              {errors.avatar && <p className="mt-2 text-xs text-status-rejected">{errors.avatar}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-ink-muted">
                ชื่อ-นามสกุล
                <input
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setErrors((current) => ({ ...current, name: undefined, form: undefined }));
                  }}
                  autoComplete="name"
                  maxLength={120}
                  aria-invalid={Boolean(errors.name)}
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-panel px-3 text-sm text-ink outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
                />
                {errors.name && <span className="mt-1.5 block text-xs font-normal text-status-rejected">{errors.name}</span>}
              </label>
              <label className="block text-xs font-semibold text-ink-muted">
                เบอร์โทรศัพท์
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/[^0-9 -]/g, '').slice(0, 12));
                    setErrors((current) => ({ ...current, phone: undefined, form: undefined }));
                  }}
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  className="mt-2 h-11 w-full rounded-lg border border-line bg-panel px-3 text-sm text-ink outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
                />
                {errors.phone && <span className="mt-1.5 block text-xs font-normal text-status-rejected">{errors.phone}</span>}
              </label>
            </div>

            <label className="block text-xs font-semibold text-ink-muted">
              อีเมลบัญชี
              <input
                type="email"
                value={account.email}
                readOnly
                aria-readonly="true"
                className="mt-2 h-11 w-full cursor-not-allowed rounded-lg border border-line bg-surface px-3 text-sm text-ink-faint"
              />
              <span className="mt-1.5 block text-[11px] font-normal text-ink-faint">อีเมลและสิทธิ์การใช้งานเปลี่ยนจากหน้านี้ไม่ได้</span>
            </label>
          </fieldset>

          {errors.form && (
            <p role="alert" className="rounded-lg bg-status-rejected/10 px-4 py-3 text-xs text-status-rejected">
              {errors.form}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              disabled={busy}
              className="h-10 rounded-lg border border-line bg-panel px-5 text-xs font-semibold text-ink-muted transition hover:bg-panel-hover disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-coral px-5 text-xs font-semibold text-white transition hover:bg-coral-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name={busy ? 'refresh' : 'check'} className={`size-4 ${busy ? 'animate-spin' : ''}`} />
              {busy ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ProfileDetail icon="users" label="ตำแหน่งในระบบ" value={ROLE_LABELS[account.role]} />
          <ProfileDetail icon="book" label="ขอบเขตที่รับผิดชอบ" value={responsibility} />
          <ProfileDetail icon="message" label="อีเมลบัญชี" value={account.email} />
          <ProfileDetail icon="info" label="เบอร์โทรศัพท์" value={account.phone || 'ยังไม่ได้ระบุ'} />
        </div>
      )}
    </div>
  );
}
