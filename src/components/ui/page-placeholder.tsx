/**
 * หน้ารอการพัฒนา ใช้ชั่วคราวเพื่อให้เมนูใน sidebar กดเข้าได้จริง
 * ลบทิ้งได้เมื่อหน้าจริงเสร็จครบแล้ว
 */
export function PagePlaceholder({
  title,
  description,
  next,
}: {
  title: string;
  description: string;
  /** สิ่งที่หน้านี้จะทำได้เมื่อพัฒนาเสร็จ */
  next: readonly string[];
}) {
  return (
    <>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-ink-muted">{description}</p>

      <div className="mt-8 rounded-xl border border-line bg-panel p-5">
        <p className="text-sm text-ink-muted">หน้านี้ยังอยู่ระหว่างพัฒนา สิ่งที่จะมีในหน้านี้:</p>
        <ul className="mt-3 space-y-2">
          {next.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
