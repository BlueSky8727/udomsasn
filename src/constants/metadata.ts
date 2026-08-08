/**
 * metadata.ts — นิยามเดียวของคำว่า "ข้อมูลประกอบครบ"
 *
 * ใช้ที่เดียวกันทั้ง
 *  - ฟอร์มอัปโหลด (บอกผู้ใช้ว่ายังขาดช่องไหน)
 *  - ตัวคำนวณ hasCompleteMetadata ที่ส่งเข้า assertTransition()
 *  - ข้อมูลที่ส่งให้ผู้ตรวจและผู้ช่วย AI
 *
 * เหตุผลเดียวกับกฎเหล็กข้อ 1: ห้ามให้แต่ละ API เช็ค metadata กันคนละแบบ
 */

/** ฟิลด์ที่ต้องกรอกก่อนส่งตรวจ */
export const REQUIRED_METADATA_FIELDS = [
  'title',
  'description',
  'subject',
  'gradeLevel',
  'learningObjectives',
] as const;

export type RequiredMetadataField = (typeof REQUIRED_METADATA_FIELDS)[number];

/** ฟิลด์ที่ควรมีแต่ไม่บล็อกการส่งตรวจ */
export const RECOMMENDED_METADATA_FIELDS = ['license', 'tags'] as const;

export type RecommendedMetadataField = (typeof RECOMMENDED_METADATA_FIELDS)[number];

export type MetadataField = RequiredMetadataField | RecommendedMetadataField;

/** ชื่อช่องภาษาไทย ใช้ทั้งใน label ของฟอร์มและข้อความแจ้งเตือน */
export const METADATA_FIELD_LABELS: Record<MetadataField, string> = {
  title: 'ชื่อเรื่อง',
  description: 'สาระการเรียนรู้',
  subject: 'วิชา',
  gradeLevel: 'ระดับชั้น',
  learningObjectives: 'จุดประสงค์การเรียนรู้',
  license: 'สัญญาอนุญาต',
  tags: 'แท็ก',
};

export const METADATA_FIELD_HINTS: Partial<Record<MetadataField, string>> = {
  description: 'ระบุเนื้อหา สาระสำคัญ และประเด็นที่ผู้เรียนควรรู้',
  learningObjectives: 'เขียนเป็นข้อ ๆ ว่าผู้เรียนจะทำอะไรได้หลังใช้สื่อนี้',
  license: 'ระบุเงื่อนไขว่าผู้อื่นสามารถนำสื่อนี้ไปใช้ต่อได้อย่างไร',
};

/**
 * ความยาวขั้นต่ำ กันการใส่ค่ามาให้ผ่าน ๆ เช่นพิมพ์ "-"
 * ปรับได้ตามที่ใช้งานจริง แต่ต้องปรับที่นี่ที่เดียว
 */
export const MIN_LENGTH: Partial<Record<RequiredMetadataField, number>> = {
  title: 5,
  description: 20,
  learningObjectives: 15,
};

/** ทรงข้อมูลที่ฟังก์ชันในไฟล์นี้ต้องการ — รับได้ทั้งจากฟอร์มและจากแถวใน media */
export type MediaMetadataInput = Partial<Record<RequiredMetadataField, unknown>> & {
  license?: unknown;
  tags?: unknown;
};

const textLength = (value: unknown): number =>
  typeof value === 'string' ? value.trim().length : 0;

/** ช่องที่ยังกรอกไม่ครบ */
export function missingMetadataFields(
  metadata: MediaMetadataInput,
): readonly RequiredMetadataField[] {
  return REQUIRED_METADATA_FIELDS.filter(
    (field) => textLength(metadata[field]) < (MIN_LENGTH[field] ?? 1),
  );
}

/**
 * ค่าที่ต้องส่งเข้า assertTransition() ในฟิลด์ hasCompleteMetadata
 * ต้องคำนวณฝั่งเซิร์ฟเวอร์จากแถวในฐานข้อมูลเสมอ (กฎเหล็กข้อ 2)
 */
export function isMetadataComplete(metadata: MediaMetadataInput): boolean {
  return missingMetadataFields(metadata).length === 0;
}

/** ข้อความบอกผู้ใช้ว่าขาดอะไร เช่น "ยังกรอกไม่ครบ: คำอธิบาย, วิชา" */
export function describeMissingMetadata(metadata: MediaMetadataInput): string | null {
  const missing = missingMetadataFields(metadata);
  if (missing.length === 0) return null;
  return `ยังกรอกไม่ครบ: ${missing.map((f) => METADATA_FIELD_LABELS[f]).join(', ')}`;
}

/** ช่องที่แนะนำให้กรอกแต่ยังว่างอยู่ — เตือนได้ แต่ไม่บล็อกการส่งตรวจ */
export function missingRecommendedFields(
  metadata: MediaMetadataInput,
): readonly RecommendedMetadataField[] {
  return RECOMMENDED_METADATA_FIELDS.filter((field) => {
    const value = metadata[field];
    if (field === 'tags') return !Array.isArray(value) || value.length === 0;
    return textLength(value) < 1;
  });
}
