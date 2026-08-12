import assert from 'node:assert/strict';
import test from 'node:test';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

test('backend authorization, versioned reviews และ archived resubmission', {
  skip: testDatabaseUrl ? false : 'กำหนด TEST_DATABASE_URL เพื่อรัน integration tests',
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'integration-test-jwt-secret-at-least-32-characters';
  process.env.CODE_HASH_SECRET = process.env.CODE_HASH_SECRET ?? 'integration-test-code-secret-at-least-32-characters';
  process.env.NODE_ENV = 'test';
  process.env.SMTP_HOST = '';
  process.env.SMTP_USER = '';
  process.env.SMTP_PASSWORD = '';

  const [{ NestFactory }, { AppModule }, { PrismaClient }, bcrypt] = await Promise.all([
    import('@nestjs/core'),
    import('../dist/app.module.js'),
    import('@prisma/client'),
    import('bcrypt'),
  ]);

  const prisma = new PrismaClient();
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  const clearDatabase = async () => {
    await prisma.rateLimitBucket.deleteMany();
    await prisma.reviewItem.deleteMany();
    await prisma.review.deleteMany();
    await prisma.statusLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.aiReview.deleteMany();
    await prisma.download.deleteMany();
    await prisma.mediaVersion.deleteMany();
    await prisma.mediaFile.deleteMany();
    await prisma.media.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany();
  };

  const password = 'Integration@2026';
  const passwordHash = await bcrypt.hash(password, 4);
  const createUser = (email: string, role: 'TEACHER' | 'REVIEWER' | 'ACADEMIC_HEAD', department?: string) =>
    prisma.user.create({
      data: {
        email,
        passwordHash,
        name: email,
        role,
        department,
        accountStatus: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

  const login = async (email: string) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = (await response.json()) as { accessToken?: string; message?: string };
    assert.equal(response.status, 201, payload.message ?? JSON.stringify(payload));
    assert.ok(payload.accessToken);
    return payload.accessToken;
  };

  const authorized = (token: string, init: RequestInit = {}): RequestInit => ({
    ...init,
    headers: { ...Object.fromEntries(new Headers(init.headers)), authorization: `Bearer ${token}` },
  });

  try {
    await clearDatabase();

    const owner = await createUser('owner@test.local', 'TEACHER');
    const reviewer = await createUser('reviewer@test.local', 'REVIEWER', 'วิทยาศาสตร์');
    const otherReviewer = await createUser('other-reviewer@test.local', 'REVIEWER', 'วิทยาศาสตร์');
    const ownerToken = await login(owner.email);
    const reviewerToken = await login(reviewer.email);

    // JWT ต้องใช้สถานะและตำแหน่งล่าสุดจากฐานข้อมูล
    await prisma.user.update({ where: { id: owner.id }, data: { accountStatus: 'DISABLED' } });
    assert.equal((await fetch(`${baseUrl}/api/auth/me`, authorized(ownerToken))).status, 401);
    await prisma.user.update({
      where: { id: owner.id },
      data: { accountStatus: 'ACTIVE', role: 'REVIEWER', department: 'คณิตศาสตร์' },
    });
    assert.equal((await fetch(`${baseUrl}/api/media/queue`, authorized(ownerToken))).status, 200);
    await prisma.user.update({ where: { id: owner.id }, data: { role: 'TEACHER', department: null } });

    // ผู้ใช้แก้ได้เฉพาะข้อมูลโปรไฟล์ของตัวเอง และห้ามยกระดับสิทธิ์ผ่าน request body
    const profileResponse = await fetch(`${baseUrl}/api/auth/me`, authorized(ownerToken, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'อาจารย์ทดสอบ',
        phone: '0812345678',
        role: 'ACADEMIC_HEAD',
        department: 'วิทยาศาสตร์',
        id: reviewer.id,
      }),
    }));
    assert.equal(profileResponse.status, 200);
    const updatedProfile = await prisma.user.findUniqueOrThrow({ where: { id: owner.id } });
    assert.equal(updatedProfile.name, 'อาจารย์ทดสอบ');
    assert.equal(updatedProfile.phone, '0812345678');
    assert.equal(updatedProfile.role, 'TEACHER');
    assert.equal(updatedProfile.department, null);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: reviewer.id } })).name, reviewer.name);

    // Reviewer ห้ามเห็น draft และงานที่ Reviewer คนอื่นถืออยู่
    const accessMedia = await prisma.media.create({
      data: {
        code: 'INT-ACCESS', title: 'Access test', description: 'description', subject: 'วิทยาศาสตร์',
        subjectGroup: 'วิทยาศาสตร์', gradeLevel: 'ม.1', mediaType: 'เอกสาร',
        learningObjectives: { K: ['test'] }, tags: [], ownerId: owner.id,
      },
    });
    assert.equal((await fetch(`${baseUrl}/api/media/${accessMedia.id}`, authorized(reviewerToken))).status, 404);
    await prisma.media.update({ where: { id: accessMedia.id }, data: { status: 'PENDING', reviewStage: 'SUBJECT_GROUP' } });
    assert.equal((await fetch(`${baseUrl}/api/media/${accessMedia.id}`, authorized(reviewerToken))).status, 200);
    await prisma.media.update({ where: { id: accessMedia.id }, data: { status: 'IN_REVIEW', assigneeId: otherReviewer.id } });
    assert.equal((await fetch(`${baseUrl}/api/media/${accessMedia.id}`, authorized(reviewerToken))).status, 404);

    // Review ของเวอร์ชันเก่าต้องไม่ทำให้ฉบับใหม่ผ่านโดยไม่ตรวจซ้ำ
    const reviewMedia = await prisma.media.create({
      data: {
        code: 'INT-REVIEW', title: 'Review test', description: 'description', subject: 'วิทยาศาสตร์',
        subjectGroup: 'วิทยาศาสตร์', gradeLevel: 'ม.1', mediaType: 'เอกสาร',
        learningObjectives: { K: ['test'] }, tags: [], ownerId: owner.id, assigneeId: reviewer.id,
        status: 'IN_REVIEW', reviewStage: 'SUBJECT_GROUP', version: 1,
      },
    });
    const completeResults = Object.fromEntries([
      'learning_objectives', 'learning_content', 'learning_process', 'assessment', 'supporting_media',
    ].map((topic) => [topic, 'PASS']));
    let response = await fetch(`${baseUrl}/api/reviews/${reviewMedia.id}/decision`, authorized(reviewerToken, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ results: completeResults, comments: { learning_content: 'แก้ไข' }, to: 'REVISION' }),
    }));
    assert.equal(response.status, 201);
    await prisma.media.update({
      where: { id: reviewMedia.id },
      data: { version: 2, status: 'IN_REVIEW', reviewStage: 'SUBJECT_GROUP', assigneeId: reviewer.id },
    });
    response = await fetch(`${baseUrl}/api/reviews/${reviewMedia.id}/decision`, authorized(reviewerToken, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: 'ACADEMIC_REVIEW' }),
    }));
    assert.equal(response.status, 400);
    response = await fetch(`${baseUrl}/api/reviews/${reviewMedia.id}/decision`, authorized(reviewerToken, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ results: completeResults, to: 'ACADEMIC_REVIEW' }),
    }));
    assert.equal(response.status, 201);
    assert.deepEqual(
      (await prisma.review.findMany({ where: { mediaId: reviewMedia.id }, orderBy: { mediaVersion: 'asc' }, select: { mediaVersion: true } })).map((item) => item.mediaVersion),
      [1, 2],
    );

    // เจ้าของส่งสื่อ ARCHIVED กลับเข้าคิวได้และเพิ่ม version
    const archived = await prisma.media.create({
      data: {
        code: 'INT-ARCHIVED', title: 'Archived test', description: 'description', subject: 'วิทยาศาสตร์',
        subjectGroup: 'วิทยาศาสตร์', gradeLevel: 'ม.1', mediaType: 'เอกสาร',
        learningObjectives: { K: ['test'] }, tags: [], ownerId: owner.id,
        status: 'ARCHIVED', version: 1,
        files: { create: { name: 'existing.pdf', mimeType: 'application/pdf', size: 5, path: 'uploads/existing.pdf' } },
      },
    });
    const form = new FormData();
    form.set('metadata', JSON.stringify({ submit: true }));
    response = await fetch(`${baseUrl}/api/media/${archived.id}`, authorized(ownerToken, { method: 'PATCH', body: form }));
    assert.equal(response.status, 200);
    const resubmitted = await prisma.media.findUniqueOrThrow({ where: { id: archived.id } });
    assert.equal(resubmitted.status, 'PENDING');
    assert.equal(resubmitted.version, 2);
  } finally {
    await clearDatabase();
    await app.close();
    await prisma.$disconnect();
  }
});
