/**
 * workflow.ts — จุดตัดสินใจเดียวของการเปลี่ยนสถานะสื่อทั้งระบบ
 *
 * กฎเหล็กข้อ 1: ห้ามเขียนเงื่อนไขสถานะกระจายไว้ตาม API แต่ละตัว
 * ทุก route / server action ที่จะเปลี่ยนสถานะต้องเรียก assertTransition() ที่นี่ก่อนเสมอ
 *
 * กฎเหล็กข้อ 2: ไฟล์นี้ตั้งใจให้รันฝั่งเซิร์ฟเวอร์ ค่าใน TransitionContext
 * ต้องอ่านจาก session + ฐานข้อมูลเท่านั้น ห้ามรับมาจาก request body ของ client
 */

/* ------------------------------------------------------------------ */
/* สถานะ                                                               */
/* ------------------------------------------------------------------ */

export const MEDIA_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  REVISION: 'REVISION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type MediaStatus = (typeof MEDIA_STATUS)[keyof typeof MEDIA_STATUS];

export const MEDIA_STATUS_LIST = Object.values(MEDIA_STATUS) as readonly MediaStatus[];

/** ข้อความสถานะสำหรับแสดงบนหน้าจอ (กฎเหล็กข้อ 9: UI เป็นภาษาไทย) */
export const STATUS_LABELS: Record<MediaStatus, string> = {
  DRAFT: 'ร่าง',
  PENDING: 'รอตรวจ',
  IN_REVIEW: 'กำลังตรวจ',
  REVISION: 'ให้แก้ไข',
  APPROVED: 'เผยแพร่แล้ว',
  REJECTED: 'ไม่ผ่าน',
  ARCHIVED: 'ถอดออกจากคลัง',
};

export const STATUS_DESCRIPTIONS: Record<MediaStatus, string> = {
  DRAFT: 'เจ้าของยังแก้ไขได้ ยังไม่เข้าสู่กระบวนการตรวจ',
  PENDING: 'อยู่ในคิวรอผู้ตรวจรับเรื่อง',
  IN_REVIEW: 'มีผู้ตรวจถือเรื่องอยู่',
  REVISION: 'ผู้ตรวจขอให้แก้ไขแล้วส่งกลับมาใหม่',
  APPROVED: 'อยู่ในคลัง ค้นหาและดาวน์โหลดได้',
  REJECTED: 'ไม่ผ่านการตรวจ ไม่เข้าคลัง',
  ARCHIVED: 'เคยเผยแพร่แล้วแต่ถูกถอดออกจากคลัง',
};

/** สถานะที่ผู้ใช้ทั่วไป (VIEWER) เห็นได้ — กฎเหล็กข้อ 6 ยังคุมเรื่องไฟล์แยกต่างหาก */
export const PUBLIC_STATUSES: readonly MediaStatus[] = [MEDIA_STATUS.APPROVED];

/** สถานะที่เจ้าของยังแก้เนื้อหาเดิมได้โดยตรง */
export const EDITABLE_BY_OWNER_STATUSES: readonly MediaStatus[] = [
  MEDIA_STATUS.DRAFT,
  MEDIA_STATUS.REVISION,
];

/** กฎเหล็กข้อ 5: ลบถาวรได้เฉพาะ DRAFT เท่านั้น */
export const HARD_DELETABLE_STATUSES: readonly MediaStatus[] = [MEDIA_STATUS.DRAFT];

/* ------------------------------------------------------------------ */
/* บทบาท                                                               */
/* ------------------------------------------------------------------ */

export const USER_ROLE = {
  TEACHER: 'TEACHER',
  REVIEWER: 'REVIEWER',
  ADMIN: 'ADMIN',
  VIEWER: 'VIEWER',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const ROLE_LABELS: Record<UserRole, string> = {
  TEACHER: 'อาจารย์',
  REVIEWER: 'ผู้ตรวจ',
  ADMIN: 'ผู้ดูแลระบบ',
  VIEWER: 'ผู้ใช้ทั่วไป',
};

/** บทบาทที่เป็นเจ้าของสื่อได้ (VIEWER อัปโหลดไม่ได้) */
const OWNER_CAPABLE_ROLES: readonly UserRole[] = [
  USER_ROLE.TEACHER,
  USER_ROLE.REVIEWER,
  USER_ROLE.ADMIN,
];

/** บทบาทที่ตรวจสื่อได้ */
const REVIEW_ROLES: readonly UserRole[] = [USER_ROLE.REVIEWER, USER_ROLE.ADMIN];

/* ------------------------------------------------------------------ */
/* นิยาม transition                                                    */
/* ------------------------------------------------------------------ */

export type TransitionRule = {
  from: MediaStatus;
  to: MediaStatus;

  /** บทบาทที่มีสิทธิ์ "ลองทำ" — เงื่อนไขตัวตนจริงอยู่ที่ ownerOnly / assigneeOnly */
  roles: readonly UserRole[];

  /** ต้องเป็นเจ้าของสื่อชิ้นนั้น */
  ownerOnly: boolean;
  /** ต้องเป็นผู้ตรวจที่ถือเรื่องอยู่ */
  assigneeOnly: boolean;
  /** ต้องระบุเหตุผล (บันทึกลง status_logs.reason) */
  requiresReason: boolean;
  /** ต้องมีคอมเมนต์บอกจุดที่ให้แก้ อย่างน้อย 1 รายการ */
  requiresComment: boolean;
  /** ต้องยังไม่มีผู้ตรวจถือเรื่องอยู่ */
  requiresUnassigned: boolean;
  /** ต้องมี metadata ครบตามเกณฑ์ R1 */
  requiresCompleteMetadata: boolean;
  /** ต้องมีไฟล์แนบอย่างน้อย 1 ไฟล์ */
  requiresFile: boolean;
  /** กฎเหล็กข้อ 4: ต้องสร้าง media_version ใหม่ ห้ามทับของเดิม */
  createsNewVersion: boolean;

  /** ข้อความบนปุ่ม (ภาษาไทย) */
  label: string;
  /** คำอธิบายสั้นสำหรับ tooltip / กล่องยืนยัน */
  description: string;
  /** ใช้เลือกสีปุ่มในชั้น UI */
  intent: 'primary' | 'neutral' | 'warning' | 'danger';
};

const rule = (r: Partial<TransitionRule> & Pick<TransitionRule, 'from' | 'to' | 'roles' | 'label' | 'description' | 'intent'>): TransitionRule => ({
  ownerOnly: false,
  assigneeOnly: false,
  requiresReason: false,
  requiresComment: false,
  requiresUnassigned: false,
  requiresCompleteMetadata: false,
  requiresFile: false,
  createsNewVersion: false,
  ...r,
});

/**
 * ตาราง transition ทั้งหมดของระบบ
 * เส้นทางใดไม่อยู่ในตารางนี้ = ปฏิเสธ ไม่มีข้อยกเว้น
 */
export const TRANSITIONS: readonly TransitionRule[] = [
  rule({
    from: MEDIA_STATUS.DRAFT,
    to: MEDIA_STATUS.PENDING,
    roles: OWNER_CAPABLE_ROLES,
    ownerOnly: true,
    requiresCompleteMetadata: true,
    requiresFile: true,
    label: 'ส่งตรวจ',
    description: 'ส่งสื่อเข้าคิวให้ผู้ตรวจพิจารณา',
    intent: 'primary',
  }),
  rule({
    from: MEDIA_STATUS.PENDING,
    to: MEDIA_STATUS.IN_REVIEW,
    roles: REVIEW_ROLES,
    requiresUnassigned: true,
    label: 'รับเรื่องตรวจ',
    description: 'รับสื่อชิ้นนี้มาตรวจ คนอื่นจะรับซ้ำไม่ได้',
    intent: 'primary',
  }),
  rule({
    from: MEDIA_STATUS.IN_REVIEW,
    to: MEDIA_STATUS.PENDING,
    roles: REVIEW_ROLES,
    assigneeOnly: true,
    label: 'คืนคิว',
    description: 'ปล่อยสื่อกลับเข้าคิวให้ผู้ตรวจคนอื่นรับต่อ',
    intent: 'neutral',
  }),
  rule({
    from: MEDIA_STATUS.IN_REVIEW,
    to: MEDIA_STATUS.APPROVED,
    roles: REVIEW_ROLES,
    assigneeOnly: true,
    label: 'อนุมัติเผยแพร่',
    description: 'ผ่านเกณฑ์ BLOCKING ครบ นำเข้าคลังให้อาจารย์คนอื่นค้นหาได้',
    intent: 'primary',
  }),
  rule({
    from: MEDIA_STATUS.IN_REVIEW,
    to: MEDIA_STATUS.REVISION,
    roles: REVIEW_ROLES,
    assigneeOnly: true,
    requiresComment: true,
    label: 'ให้แก้ไข',
    description: 'ส่งกลับให้เจ้าของแก้ ต้องระบุจุดที่ต้องแก้อย่างน้อย 1 ข้อ',
    intent: 'warning',
  }),
  rule({
    from: MEDIA_STATUS.IN_REVIEW,
    to: MEDIA_STATUS.REJECTED,
    roles: REVIEW_ROLES,
    assigneeOnly: true,
    requiresReason: true,
    label: 'ไม่ผ่าน',
    description: 'ปิดเรื่อง ไม่นำเข้าคลัง ต้องระบุเหตุผล',
    intent: 'danger',
  }),
  rule({
    from: MEDIA_STATUS.REVISION,
    to: MEDIA_STATUS.PENDING,
    roles: OWNER_CAPABLE_ROLES,
    ownerOnly: true,
    requiresCompleteMetadata: true,
    requiresFile: true,
    createsNewVersion: true,
    label: 'ส่งฉบับแก้ไข',
    description: 'ส่งกลับเข้าคิวเป็น version ใหม่ ไฟล์เดิมยังถูกเก็บไว้',
    intent: 'primary',
  }),
  rule({
    from: MEDIA_STATUS.APPROVED,
    to: MEDIA_STATUS.ARCHIVED,
    roles: [USER_ROLE.ADMIN],
    requiresReason: true,
    label: 'ถอดออกจากคลัง',
    description: 'นำออกจากผลค้นหา ต้องระบุเหตุผล',
    intent: 'danger',
  }),
  rule({
    from: MEDIA_STATUS.ARCHIVED,
    to: MEDIA_STATUS.PENDING,
    roles: OWNER_CAPABLE_ROLES,
    ownerOnly: true,
    requiresCompleteMetadata: true,
    requiresFile: true,
    createsNewVersion: true,
    label: 'ส่งตรวจอีกครั้ง',
    description: 'ส่งสื่อที่ถูกถอดกลับเข้าคิวเป็น version ใหม่',
    intent: 'primary',
  }),
];

/* ------------------------------------------------------------------ */
/* บริบทที่ใช้ตัดสิน                                                    */
/* ------------------------------------------------------------------ */

/**
 * ทุกฟิลด์ต้องมาจาก session + ฐานข้อมูลฝั่งเซิร์ฟเวอร์
 * ห้าม map มาจาก request body โดยตรง (กฎเหล็กข้อ 2)
 */
export type TransitionContext = {
  /** บทบาทของผู้กระทำ อ่านจาก profiles */
  actorRole: UserRole;
  /** profiles.id ของผู้กระทำ อ่านจาก session */
  actorId: string;
  /** media.owner_id อ่านจากฐานข้อมูล */
  ownerId: string;
  /** reviews.reviewer_id ที่ถือเรื่องอยู่ (null = ยังไม่มีใครถือ) */
  assigneeId?: string | null;
  /** เหตุผลที่ผู้ใช้กรอก */
  reason?: string | null;
  /** จำนวนคอมเมนต์ที่ผูกกับ version ปัจจุบัน */
  commentCount?: number;
  /** metadata ครบตามเกณฑ์ R1 หรือยัง — ตรวจฝั่งเซิร์ฟเวอร์ */
  hasCompleteMetadata?: boolean;
  /** จำนวนไฟล์ใน version ปัจจุบัน */
  fileCount?: number;
};

export type DenialCode =
  | 'UNKNOWN_STATUS'
  | 'SAME_STATUS'
  | 'NO_SUCH_TRANSITION'
  | 'ROLE_NOT_ALLOWED'
  | 'NOT_OWNER'
  | 'NOT_ASSIGNEE'
  | 'ALREADY_ASSIGNED'
  | 'REASON_REQUIRED'
  | 'COMMENT_REQUIRED'
  | 'METADATA_INCOMPLETE'
  | 'FILE_REQUIRED';

/** ข้อความอธิบายเหตุที่ถูกปฏิเสธ สำหรับแสดงต่อผู้ใช้ */
export const DENIAL_MESSAGES: Record<DenialCode, string> = {
  UNKNOWN_STATUS: 'สถานะไม่ถูกต้อง',
  SAME_STATUS: 'สถานะปลายทางเหมือนสถานะปัจจุบัน',
  NO_SUCH_TRANSITION: 'ไม่อนุญาตให้เปลี่ยนสถานะตามเส้นทางนี้',
  ROLE_NOT_ALLOWED: 'บทบาทของคุณไม่มีสิทธิ์ทำรายการนี้',
  NOT_OWNER: 'ทำได้เฉพาะเจ้าของสื่อเท่านั้น',
  NOT_ASSIGNEE: 'ทำได้เฉพาะผู้ตรวจที่ถือเรื่องนี้อยู่',
  ALREADY_ASSIGNED: 'มีผู้ตรวจรับเรื่องนี้ไปแล้ว',
  REASON_REQUIRED: 'ต้องระบุเหตุผล',
  COMMENT_REQUIRED: 'ต้องมีคอมเมนต์ระบุจุดที่ต้องแก้อย่างน้อย 1 ข้อ',
  METADATA_INCOMPLETE: 'กรอกข้อมูลสื่อไม่ครบตามเกณฑ์ R1',
  FILE_REQUIRED: 'ต้องแนบไฟล์อย่างน้อย 1 ไฟล์',
};

export type TransitionCheck =
  | { ok: true; rule: TransitionRule }
  | { ok: false; code: DenialCode; message: string };

export class WorkflowError extends Error {
  readonly code: DenialCode;
  readonly from: string;
  readonly to: string;
  /** ใช้ตอบกลับเป็น HTTP status ที่ API layer */
  readonly httpStatus: number;

  constructor(code: DenialCode, from: string, to: string) {
    super(DENIAL_MESSAGES[code]);
    this.name = 'WorkflowError';
    this.code = code;
    this.from = from;
    this.to = to;
    this.httpStatus = HTTP_STATUS_BY_CODE[code];
  }
}

const HTTP_STATUS_BY_CODE: Record<DenialCode, number> = {
  UNKNOWN_STATUS: 400,
  SAME_STATUS: 400,
  NO_SUCH_TRANSITION: 409,
  ROLE_NOT_ALLOWED: 403,
  NOT_OWNER: 403,
  NOT_ASSIGNEE: 403,
  ALREADY_ASSIGNED: 409,
  REASON_REQUIRED: 422,
  COMMENT_REQUIRED: 422,
  METADATA_INCOMPLETE: 422,
  FILE_REQUIRED: 422,
};

/* ------------------------------------------------------------------ */
/* ตัวช่วยภายใน                                                        */
/* ------------------------------------------------------------------ */

const isMediaStatus = (value: unknown): value is MediaStatus =>
  typeof value === 'string' && (MEDIA_STATUS_LIST as readonly string[]).includes(value);

const findRule = (from: MediaStatus, to: MediaStatus): TransitionRule | undefined =>
  TRANSITIONS.find((t) => t.from === from && t.to === to);

const hasText = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

/** เงื่อนไขที่ขึ้นกับ "ตัวผู้กระทำและสถานะของเรื่อง" — ใช้ตัดสินว่าจะโชว์ปุ่มไหม */
const checkActorEligibility = (r: TransitionRule, ctx: TransitionContext): DenialCode | null => {
  if (!r.roles.includes(ctx.actorRole)) return 'ROLE_NOT_ALLOWED';
  if (r.ownerOnly && ctx.actorId !== ctx.ownerId) return 'NOT_OWNER';
  if (r.assigneeOnly && (!ctx.assigneeId || ctx.actorId !== ctx.assigneeId)) return 'NOT_ASSIGNEE';
  if (r.requiresUnassigned && ctx.assigneeId) return 'ALREADY_ASSIGNED';
  if (r.requiresCompleteMetadata && ctx.hasCompleteMetadata !== true) return 'METADATA_INCOMPLETE';
  if (r.requiresFile && (ctx.fileCount ?? 0) < 1) return 'FILE_REQUIRED';
  return null;
};

/** เงื่อนไขที่ผู้ใช้กรอกตอนกดยืนยัน — ยังไม่ต้องผ่านตอนเรนเดอร์ปุ่ม */
const checkInputRequirements = (r: TransitionRule, ctx: TransitionContext): DenialCode | null => {
  if (r.requiresReason && !hasText(ctx.reason)) return 'REASON_REQUIRED';
  if (r.requiresComment && (ctx.commentCount ?? 0) < 1) return 'COMMENT_REQUIRED';
  return null;
};

/* ------------------------------------------------------------------ */
/* API สาธารณะ                                                         */
/* ------------------------------------------------------------------ */

/**
 * ตรวจเส้นทางแบบละเอียด คืนเหตุผลที่ถูกปฏิเสธด้วย
 * ใช้เมื่ออยากแสดงข้อความบอกผู้ใช้ว่าติดตรงไหน
 */
export function checkTransition(
  from: unknown,
  to: unknown,
  ctx: TransitionContext,
): TransitionCheck {
  if (!isMediaStatus(from) || !isMediaStatus(to)) {
    return { ok: false, code: 'UNKNOWN_STATUS', message: DENIAL_MESSAGES.UNKNOWN_STATUS };
  }
  if (from === to) {
    return { ok: false, code: 'SAME_STATUS', message: DENIAL_MESSAGES.SAME_STATUS };
  }

  const r = findRule(from, to);
  if (!r) {
    return { ok: false, code: 'NO_SUCH_TRANSITION', message: DENIAL_MESSAGES.NO_SUCH_TRANSITION };
  }

  const denial = checkActorEligibility(r, ctx) ?? checkInputRequirements(r, ctx);
  if (denial) return { ok: false, code: denial, message: DENIAL_MESSAGES[denial] };

  return { ok: true, rule: r };
}

/** เวอร์ชันคืนค่า boolean สำหรับเช็คเร็ว ๆ */
export function canTransition(from: unknown, to: unknown, ctx: TransitionContext): boolean {
  return checkTransition(from, to, ctx).ok;
}

/**
 * ด่านบังคับก่อนเขียนฐานข้อมูลทุกครั้ง (กฎเหล็กข้อ 1)
 * ถ้าไม่ผ่านจะโยน WorkflowError ถ้าผ่านจะคืน rule กลับมา
 * ให้ผู้เรียกใช้ flag ต่อได้ เช่น createsNewVersion / requiresReason
 *
 * @throws {WorkflowError}
 */
export function assertTransition(
  from: unknown,
  to: unknown,
  ctx: TransitionContext,
): TransitionRule {
  const result = checkTransition(from, to, ctx);
  if (!result.ok) {
    throw new WorkflowError(result.code, String(from), String(to));
  }
  return result.rule;
}

/**
 * รายการปุ่มที่ควรแสดงให้ผู้ใช้คนนี้เห็นในสถานะนี้
 *
 * ข้ามการเช็ค reason / comment เพราะเป็นค่าที่ผู้ใช้จะกรอกในกล่องยืนยันทีหลัง
 * ปุ่มที่โผล่จากฟังก์ชันนี้ยังต้องผ่าน assertTransition() ฝั่งเซิร์ฟเวอร์อีกรอบเสมอ
 */
export function availableTransitions(
  from: unknown,
  ctx: TransitionContext,
): readonly TransitionRule[] {
  if (!isMediaStatus(from)) return [];
  return TRANSITIONS.filter((r) => r.from === from && checkActorEligibility(r, ctx) === null);
}

/**
 * ดึงนิยามของเส้นทางหนึ่ง โดยไม่สนใจว่าใครทำได้
 * ใช้ตอนต้องการ label หรือ flag ของปุ่ม แม้ตอนนั้นยังกดไม่ได้
 */
export function getTransition(from: unknown, to: unknown): TransitionRule | undefined {
  if (!isMediaStatus(from) || !isMediaStatus(to)) return undefined;
  return findRule(from, to);
}

/** เส้นทางทั้งหมดที่ออกจากสถานะนี้ได้ตามตาราง โดยไม่สนใจตัวผู้ใช้ — ใช้ทำเอกสาร/ผังงาน */
export function transitionsFrom(from: unknown): readonly TransitionRule[] {
  if (!isMediaStatus(from)) return [];
  return TRANSITIONS.filter((r) => r.from === from);
}
