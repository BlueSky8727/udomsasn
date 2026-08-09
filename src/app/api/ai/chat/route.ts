import { NextResponse } from 'next/server';
import { z } from 'zod';
import { REVIEW_JOBS } from '@/constants/enterprise-data';
import { REVIEW_TOPICS } from '@/constants/review-topics';
import { USER_ROLE } from '@/constants/workflow';
import { getViewerRole, getViewerSubjectGroup } from '@/lib/auth';
import { chatWithTyphoon, isTyphoonConfigured } from '@/lib/ai/typhoon';
import { canOpenReviewJob } from '@/lib/review-access';
import {
  isSameOriginRequest,
  readJsonBody,
  RequestSecurityError,
  takeRateLimit,
} from '@/lib/request-security';

const ChatBody = z.object({
  jobId: z.string().min(1).max(80),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4_000),
      }),
    )
    .min(1)
    .max(12),
  review: z.object({
    results: z.record(z.string(), z.enum(['PASS', 'NEEDS_WORK']).nullable()),
    comments: z.record(z.string(), z.string().max(2_000)),
    summary: z.string().max(4_000),
  }),
});

function previewAnswer(question: string, isAcademic: boolean): string {
  const normalized = question.toLowerCase();

  if (/ผ่าน|อนุมัติ|ตัดสิน/.test(normalized)) {
    return 'ฉันไม่สามารถตัดสินหรืออนุมัติแทนผู้ตรวจได้ค่ะ จากข้อมูลที่มี แนะนำให้ยืนยันแหล่งที่มาของภาพหน้า 18 ตรวจสิทธิ์การใช้ และอ่านผลรายหัวข้อให้ครบก่อนที่คุณจะตัดสินด้วยตนเอง';
  }
  if (/แหล่ง|ภาพ|ลิขสิทธิ์|สิทธิ์/.test(normalized)) {
    return 'จุดที่ควรตรวจคือภาพประกอบหน้า 18 ค่ะ ควรขอให้ระบุชื่อเจ้าของผลงาน แหล่งที่มา ลิงก์อ้างอิง และเงื่อนไขสิทธิ์การใช้ให้ครบ หากเป็นภาพที่สร้างเองควรระบุไว้ชัดเจนในหัวข้อ “สื่อประกอบ”';
  }
  if (/คอมเมนต์|ร่าง|ส่งกลับ/.test(normalized)) {
    return 'ร่างคอมเมนต์: “กรุณาเพิ่มแหล่งที่มาและรายละเอียดสิทธิ์การใช้ของภาพประกอบหน้า 18 เพื่อให้ตรวจสอบการนำไปใช้ซ้ำได้อย่างชัดเจน พร้อมปรับขนาดตัวอักษรหน้า 12 ให้อ่านง่ายขึ้น” คุณสามารถปรับถ้อยคำก่อนนำไปใส่ในหัวข้อสื่อประกอบได้ค่ะ';
  }
  if (/เทียบ|รอบแรก|กลุ่มสาระ/.test(normalized)) {
    return 'ผลรอบกลุ่มสาระระบุว่าตรวจครบและเพิ่มแหล่งที่มาของภาพแล้วค่ะ จุดที่หัวหน้าวิชาการควรยืนยันต่อคือหลักฐานสิทธิ์การใช้ภาพหน้า 18 และตรวจว่าขนาดตัวอักษรหน้า 12 อ่านได้ชัดจริงหรือไม่ หากสองจุดนี้ครบจึงค่อยใช้ดุลยพินิจตัดสินด้วยตนเอง';
  }
  if (/สรุป|เสี่ยง|ตรวจอะไร/.test(normalized)) {
    return `${isAcademic ? 'เมื่อเทียบกับผลรอบกลุ่มสาระ ' : ''}พบประเด็นหลัก 2 จุดค่ะ: (1) ยืนยันแหล่งที่มาและสิทธิ์ของภาพหน้า 18 ในหัวข้อสื่อประกอบ และ (2) ตรวจความอ่านง่ายของตัวอักษรหน้า 12 ส่วนการตัดสินขั้นสุดท้ายยังเป็นหน้าที่ของผู้ตรวจ`;
  }

  return 'ฉันช่วยตรวจได้ทั้งจุดประสงค์ เนื้อหา กระบวนการเรียนรู้ การวัดผล และสื่อประกอบค่ะ ลองถามเจาะจง เช่น “ช่วยร่างคอมเมนต์เรื่องภาพหน้า 18” หรือ “สรุปจุดเสี่ยงที่ควรตรวจ”';
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'ไม่อนุญาตคำขอจากเว็บไซต์อื่น' }, { status: 403 });
    }

    const [role, subjectGroup] = await Promise.all([getViewerRole(), getViewerSubjectGroup()]);

    if (role !== USER_ROLE.REVIEWER && role !== USER_ROLE.ADMIN) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ใช้ผู้ช่วยตรวจ AI' }, { status: 403 });
    }

    const rateLimit = takeRateLimit(request, `ai-chat:${role}`, 30, 10 * 60 * 1_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'ถามถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const body = ChatBody.parse(await readJsonBody(request, 128 * 1_024));

    const job = REVIEW_JOBS.find((item) => item.id === body.jobId);
    if (!job || !canOpenReviewJob(job, role, subjectGroup)) {
      return NextResponse.json({ error: 'ไม่พบงานตรวจที่เข้าถึงได้' }, { status: 404 });
    }

    const topicNotes = REVIEW_TOPICS.map((topic) => {
      const result = body.review.results[topic.id];
      const resultLabel = result === 'PASS' ? 'เรียบร้อย' : result === 'NEEDS_WORK' ? 'ควรแก้' : 'ยังไม่ตรวจ';
      const comment = body.review.comments[topic.id]?.trim() || '-';
      return `- ${topic.title}: ${resultLabel}; คอมเมนต์: ${comment}`;
    }).join('\n');

    const reviewContext = `รหัสงาน: ${job.id}
ชื่อสื่อ: ${job.title}
เจ้าของ: ${job.owner}
วิชา/กลุ่มสาระ: ${job.subject} / ${job.department}
ระดับชั้น: ${job.grade}
เวอร์ชัน: ${job.version}
ความเสี่ยงจากการคัดกรองเบื้องต้น: ${job.aiRisk}
ข้อสังเกต AI เดิม: ภาพประกอบหน้า 18 ควรยืนยันแหล่งที่มาและสิทธิ์การนำไปใช้
${role === USER_ROLE.ADMIN ? 'ผลรอบกลุ่มสาระ: ตรวจครบทุกหัวข้อ ระบุแหล่งที่มาของภาพแล้ว และเสนอให้ปรับขนาดตัวอักษรหน้า 12' : ''}

สถานะร่างการตรวจปัจจุบัน:
${topicNotes}
สรุปร่างของผู้ตรวจ: ${body.review.summary.trim() || '-'}`;

    const reviewerRole =
      role === USER_ROLE.ADMIN ? ('หัวหน้าวิชาการ' as const) : ('หัวหน้ากลุ่มสาระ' as const);

    if (!isTyphoonConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่าบริการ AI' }, { status: 503 });
      }

      const question = body.messages.at(-1)?.content ?? '';
      return NextResponse.json({
        provider: 'preview',
        answer: previewAnswer(question, role === USER_ROLE.ADMIN),
        canChangeStatus: false,
      });
    }

    const answer = await chatWithTyphoon({
      reviewerRole,
      reviewContext,
      messages: body.messages,
    });

    return NextResponse.json({ provider: 'typhoon', answer, canChangeStatus: false });
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'ข้อมูลคำถามไม่ถูกต้อง' }, { status: 400 });
    }

    console.error('AI review chat failed', error);
    return NextResponse.json(
      { error: 'ผู้ช่วย AI ยังตอบไม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง' },
      { status: 502 },
    );
  }
}
