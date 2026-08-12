import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { MediaStatus, UserRole } from '@prisma/client';
import { WORKFLOW_RULES, type SharedTransitionRule } from '@udomsasn/workflow';

export type WorkflowContext = {
  actorRole: UserRole;
  actorId: string;
  ownerId: string;
  assigneeId?: string | null;
  reason?: string | null;
  commentCount?: number;
  hasCompleteMetadata?: boolean;
  fileCount?: number;
  hasCompletedReview?: boolean;
};

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function assertMediaTransition(
  from: MediaStatus,
  to: MediaStatus,
  context: WorkflowContext,
): SharedTransitionRule {
  const rule = WORKFLOW_RULES.find((candidate) => candidate.from === from && candidate.to === to);
  if (!rule) throw new BadRequestException('ไม่อนุญาตให้เปลี่ยนสถานะตามเส้นทางนี้');
  if (!rule.roles.includes(context.actorRole)) {
    throw new ForbiddenException('ตำแหน่งของคุณไม่มีสิทธิ์ทำรายการนี้');
  }
  if (rule.ownerOnly && context.actorId !== context.ownerId) {
    throw new ForbiddenException('ทำได้เฉพาะเจ้าของสื่อเท่านั้น');
  }
  if (rule.assigneeOnly && context.actorId !== context.assigneeId) {
    throw new ForbiddenException('ทำได้เฉพาะผู้ตรวจที่ถือเรื่องนี้อยู่');
  }
  if (rule.requiresUnassigned && context.assigneeId) {
    throw new ConflictException('มีผู้ตรวจรับเรื่องนี้ไปแล้ว');
  }
  if (rule.requiresReason && !hasText(context.reason)) {
    throw new BadRequestException('ต้องระบุเหตุผล');
  }
  if (rule.requiresComment && (context.commentCount ?? 0) < 1) {
    throw new BadRequestException('ต้องมีคอมเมนต์ระบุจุดที่ต้องแก้อย่างน้อย 1 ข้อ');
  }
  if (rule.requiresReviewComplete && context.hasCompletedReview !== true) {
    throw new BadRequestException('ต้องบันทึกผลตรวจให้ครบทุกหัวข้อก่อนส่งต่อ');
  }
  if (rule.requiresCompleteMetadata && context.hasCompleteMetadata !== true) {
    throw new BadRequestException('กรอกข้อมูลสื่อไม่ครบ');
  }
  if (rule.requiresFile && (context.fileCount ?? 0) < 1) {
    throw new BadRequestException('ต้องแนบไฟล์อย่างน้อย 1 ไฟล์');
  }
  return rule;
}
