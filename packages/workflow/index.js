'use strict';

const STATUS_LABELS = Object.freeze({
  DRAFT: 'ร่าง',
  PENDING: 'รอตรวจโดยกลุ่มสาระ',
  IN_REVIEW: 'กลุ่มสาระกำลังตรวจ',
  ACADEMIC_REVIEW: 'รอตรวจโดยหัวหน้าวิชาการ',
  REVISION: 'ให้แก้ไข',
  ACADEMIC_REVISION: 'แก้ไขเล็กน้อย',
  APPROVED: 'เผยแพร่แล้ว',
  REJECTED: 'ไม่ผ่าน',
  ARCHIVED: 'ถอดออกจากคลัง',
});

const defaults = Object.freeze({
  ownerOnly: false,
  assigneeOnly: false,
  requiresReason: false,
  requiresComment: false,
  requiresUnassigned: false,
  requiresCompleteMetadata: false,
  requiresFile: false,
  requiresReviewComplete: false,
  createsNewVersion: false,
});

const define = (rule) => Object.freeze({
  ...defaults,
  ...rule,
  roles: Object.freeze([...rule.roles]),
});

const WORKFLOW_RULES = Object.freeze([
  define({ from: 'DRAFT', to: 'PENDING', roles: ['TEACHER'], ownerOnly: true, requiresCompleteMetadata: true, requiresFile: true, label: 'ส่งให้หัวหน้ากลุ่มสาระตรวจ', description: 'ส่งสื่อเข้าคิวของกลุ่มสาระที่เลือกให้หัวหน้ากลุ่มสาระพิจารณา', intent: 'primary' }),
  define({ from: 'PENDING', to: 'IN_REVIEW', roles: ['REVIEWER'], requiresUnassigned: true, label: 'รับเรื่องตรวจ', description: 'รับสื่อชิ้นนี้มาตรวจ คนอื่นจะรับซ้ำไม่ได้', intent: 'primary' }),
  define({ from: 'IN_REVIEW', to: 'PENDING', roles: ['REVIEWER'], assigneeOnly: true, label: 'คืนคิว', description: 'ปล่อยสื่อกลับเข้าคิวให้ผู้ตรวจคนอื่นรับต่อ', intent: 'neutral' }),
  define({ from: 'IN_REVIEW', to: 'ACADEMIC_REVIEW', roles: ['REVIEWER'], assigneeOnly: true, requiresReviewComplete: true, label: 'ส่งต่อหัวหน้าวิชาการ', description: 'ตรวจครบทุกหัวข้อแล้ว ส่งต่อให้หัวหน้าวิชาการตรวจขั้นสุดท้าย', intent: 'primary' }),
  define({ from: 'IN_REVIEW', to: 'REVISION', roles: ['REVIEWER'], assigneeOnly: true, requiresComment: true, label: 'ส่งกลับให้อาจารย์แก้ไข', description: 'ส่งกลับให้เจ้าของแก้ ต้องระบุจุดที่ต้องแก้อย่างน้อย 1 ข้อ', intent: 'warning' }),
  define({ from: 'IN_REVIEW', to: 'REJECTED', roles: ['REVIEWER'], assigneeOnly: true, requiresReason: true, label: 'ไม่ผ่าน', description: 'ปิดเรื่อง ไม่นำเข้าคลัง ต้องระบุเหตุผล', intent: 'danger' }),
  define({ from: 'REVISION', to: 'PENDING', roles: ['TEACHER'], ownerOnly: true, requiresCompleteMetadata: true, requiresFile: true, createsNewVersion: true, label: 'ส่งฉบับแก้ไข', description: 'ส่งกลับเข้าคิวเป็น version ใหม่ ไฟล์เดิมยังถูกเก็บไว้', intent: 'primary' }),
  define({ from: 'ACADEMIC_REVIEW', to: 'APPROVED', roles: ['ACADEMIC_HEAD'], label: 'อนุมัติผ่าน', description: 'หัวหน้าวิชาการยืนยันผลขั้นสุดท้าย แจ้งผลกลับให้อาจารย์ และเผยแพร่สื่อเข้าคลัง', intent: 'primary' }),
  define({ from: 'ACADEMIC_REVIEW', to: 'ACADEMIC_REVISION', roles: ['ACADEMIC_HEAD'], requiresComment: true, label: 'ส่งกลับแก้ไขเล็กน้อย', description: 'ส่งกลับให้อาจารย์แก้ไขจุดเล็กน้อย พร้อมคอมเมนต์รายหัวข้อ', intent: 'warning' }),
  define({ from: 'ACADEMIC_REVISION', to: 'ACADEMIC_REVIEW', roles: ['TEACHER'], ownerOnly: true, requiresCompleteMetadata: true, requiresFile: true, createsNewVersion: true, label: 'ส่งฉบับแก้ไขให้หัวหน้าวิชาการ', description: 'ส่งเวอร์ชันใหม่กลับไปให้หัวหน้าวิชาการตรวจขั้นสุดท้ายโดยไม่ย้อนกลับกลุ่มสาระ', intent: 'primary' }),
  define({ from: 'APPROVED', to: 'ARCHIVED', roles: ['ACADEMIC_HEAD'], requiresReason: true, label: 'ถอดออกจากคลัง', description: 'นำออกจากผลค้นหา ต้องระบุเหตุผล', intent: 'danger' }),
  define({ from: 'ARCHIVED', to: 'PENDING', roles: ['TEACHER'], ownerOnly: true, requiresCompleteMetadata: true, requiresFile: true, createsNewVersion: true, label: 'ส่งตรวจอีกครั้ง', description: 'ส่งสื่อที่ถูกถอดกลับเข้าคิวเป็น version ใหม่', intent: 'primary' }),
]);

module.exports = { STATUS_LABELS, WORKFLOW_RULES };
