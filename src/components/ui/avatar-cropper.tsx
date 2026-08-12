// src/components/ui/avatar-cropper.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/ui/icons';

/**
 * กล่องปรับรูปโปรไฟล์ ลากเพื่อขยับ + เลื่อนแถบเพื่อซูม แล้วตัดเป็นสี่เหลี่ยมจัตุรัสก่อนอัปโหลด
 *
 * ตัดรูปที่ฝั่งเบราว์เซอร์ทั้งหมด สิ่งที่ส่งขึ้นเซิร์ฟเวอร์คือไฟล์ JPG ที่ครอบเรียบร้อยแล้ว
 * ฝั่งเซิร์ฟเวอร์ยังตรวจชนิดและขนาดไฟล์เองเหมือนเดิม (กฎเหล็กข้อ 2)
 */

const OUTPUT_SIZE = 512;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_ZOOM = 4;
const JPEG_QUALITIES = [0.92, 0.82, 0.7, 0.6];

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

async function canvasToFile(canvas: HTMLCanvasElement): Promise<File> {
  let smallest: Blob | null = null;
  for (const quality of JPEG_QUALITIES) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) continue;
    smallest = blob;
    if (blob.size <= MAX_OUTPUT_BYTES) break;
  }
  if (!smallest) throw new Error('ตัดรูปไม่สำเร็จ กรุณาลองใหม่');
  // ชื่อไฟล์ต้องลงท้าย .jpg เพราะเซิร์ฟเวอร์เทียบนามสกุลกับชนิดไฟล์จริง
  return new File([smallest], 'avatar.jpg', { type: 'image/jpeg' });
}

export function AvatarCropper({
  source,
  shape = 'rounded',
  onCancel,
  onConfirm,
}: {
  /** ไฟล์รูปต้นฉบับที่ผู้ใช้เลือก หรือรูปเดิมที่ดึงกลับมาจากเซิร์ฟเวอร์ */
  source: File;
  shape?: 'rounded' | 'circle';
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Point | null>(null);

  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [view, setView] = useState(288);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<Point>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ใส่ src ให้ img ตรง ๆ จาก effect เพื่อให้ revoke object URL ได้ตรงกับรอบที่สร้าง
  // ค่า natural/zoom/center ตั้งใหม่ใน onLoad ทุกครั้งที่ src เปลี่ยน
  useEffect(() => {
    const url = URL.createObjectURL(source);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [source]);

  // ล็อกการเลื่อนหน้าหลังไว้ระหว่างเปิดกล่อง และปิดด้วยปุ่ม Esc ได้
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onCancel]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (width > 0) setView(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /** ด้านของกรอบตัด วัดเป็นพิกเซลของรูปต้นฉบับ — zoom 1 คือสี่เหลี่ยมจัตุรัสที่ใหญ่ที่สุดที่รูปให้ได้ */
  const cropSize = useMemo(() => {
    if (!natural) return 0;
    return Math.min(natural.width, natural.height) / zoom;
  }, [natural, zoom]);

  const scaleFactor = cropSize > 0 ? view / cropSize : 1;

  const clampCenter = useCallback(
    (point: Point, size: number): Point => {
      if (!natural) return point;
      return {
        x: clamp(point.x, size / 2, natural.width - size / 2),
        y: clamp(point.y, size / 2, natural.height - size / 2),
      };
    },
    [natural],
  );

  function handleImageLoad() {
    const image = imageRef.current;
    if (!image) return;
    const size = { width: image.naturalWidth, height: image.naturalHeight };
    setNatural(size);
    setZoom(1);
    setCenter({ x: size.width / 2, y: size.height / 2 });
  }

  const changeZoom = useCallback(
    (next: number) => {
      if (!natural) return;
      const nextZoom = clamp(next, 1, MAX_ZOOM);
      const nextCrop = Math.min(natural.width, natural.height) / nextZoom;
      setZoom(nextZoom);
      setCenter((current) => clampCenter(current, nextCrop));
    },
    [clampCenter, natural],
  );

  // ต้องผูก wheel เอง เพราะ onWheel ของ React เป็น passive จึงเรียก preventDefault ไม่ได้
  useEffect(() => {
    const element = viewportRef.current;
    if (!element || !natural) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      changeZoom(zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [changeZoom, natural, zoom]);

  function movePixels(dx: number, dy: number) {
    if (!natural || scaleFactor <= 0) return;
    setCenter((current) => clampCenter({ x: current.x - dx / scaleFactor, y: current.y - dy / scaleFactor }, cropSize));
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!natural) return;
    // บางเบราว์เซอร์ปฏิเสธการจับ pointer ลากต่อได้อยู่ จึงไม่ให้ error หยุดการลาก
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ไม่ต้องทำอะไร
    }
    dragRef.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const last = dragRef.current;
    if (!last) return;
    movePixels(event.clientX - last.x, event.clientY - last.y);
    dragRef.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 20 : 6;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      // ปุ่มลูกศรเลื่อน "กรอบ" ไปทางนั้น จึงต้องลากรูปไปทางตรงข้าม
      movePixels(-move[0], -move[1]);
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      changeZoom(zoom + 0.15);
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      changeZoom(zoom - 0.15);
    }
  }

  function reset() {
    if (!natural) return;
    setZoom(1);
    setCenter({ x: natural.width / 2, y: natural.height / 2 });
  }

  async function confirm() {
    const image = imageRef.current;
    if (!image || !natural || cropSize <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const size = Math.max(128, Math.min(OUTPUT_SIZE, Math.round(cropSize)));
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('เบราว์เซอร์นี้ตัดรูปไม่ได้ กรุณาลองเบราว์เซอร์อื่น');
      context.imageSmoothingQuality = 'high';
      // เติมพื้นขาวก่อน เพราะ JPG ไม่มีพื้นโปร่งใส
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, size, size);
      context.drawImage(
        image,
        center.x - cropSize / 2,
        center.y - cropSize / 2,
        cropSize,
        cropSize,
        0,
        0,
        size,
        size,
      );
      onConfirm(await canvasToFile(canvas));
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : 'ตัดรูปไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  }

  const displayWidth = natural ? natural.width * scaleFactor : 0;
  const displayHeight = natural ? natural.height * scaleFactor : 0;
  const maskClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ปรับตำแหน่งรูปโปรไฟล์"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-panel p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-ink">ปรับตำแหน่งรูปโปรไฟล์</h3>
            <p className="mt-1 text-xs text-ink-muted">ลากรูปเพื่อขยับ และเลื่อนแถบด้านล่างเพื่อซูมเข้า-ออก</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="ปิด"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition hover:bg-surface hover:text-ink"
          >
            <Icon name="x" className="size-4" />
          </button>
        </div>

        <div
          ref={viewportRef}
          tabIndex={0}
          role="application"
          aria-label="พื้นที่ปรับรูป ใช้ปุ่มลูกศรเพื่อขยับ และปุ่มบวกลบเพื่อซูม"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className="relative mx-auto mt-4 aspect-square w-full max-w-[288px] cursor-grab touch-none select-none overflow-hidden rounded-xl bg-surface outline-none ring-brand/40 focus-visible:ring-4 active:cursor-grabbing"
        >
          {/* รูปยังอยู่ในเครื่องผู้ใช้ ไม่มี URL จากเซิร์ฟเวอร์ จึงใช้ img ตรง ๆ */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            alt="รูปที่กำลังปรับตำแหน่ง"
            onLoad={handleImageLoad}
            draggable={false}
            className="absolute max-w-none origin-top-left"
            style={{
              width: displayWidth ? `${displayWidth}px` : undefined,
              height: displayHeight ? `${displayHeight}px` : undefined,
              left: natural ? `${view / 2 - center.x * scaleFactor}px` : 0,
              top: natural ? `${view / 2 - center.y * scaleFactor}px` : 0,
              visibility: natural ? 'visible' : 'hidden',
            }}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,.28)] ${maskClass}`}
          />
          {!natural && (
            <p className="absolute inset-0 grid place-items-center text-xs text-ink-faint">กำลังโหลดรูป...</p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Icon name="image" className="size-4 shrink-0 text-ink-faint" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!natural}
            onChange={(event) => changeZoom(Number(event.target.value))}
            aria-label="ระดับการซูม"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand disabled:opacity-50"
          />
          <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-ink-faint">
            {zoom.toFixed(1)}x
          </span>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-status-rejected/10 px-3 py-2 text-xs text-status-rejected">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={reset}
            disabled={!natural || busy}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-panel px-4 text-xs font-semibold text-ink-muted transition hover:bg-panel-hover disabled:opacity-50"
          >
            <Icon name="refresh" className="size-4" />
            รีเซ็ตตำแหน่ง
          </button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="h-10 rounded-lg border border-line bg-panel px-5 text-xs font-semibold text-ink-muted transition hover:bg-panel-hover disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={!natural || busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-coral px-5 text-xs font-semibold text-white transition hover:bg-coral-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name={busy ? 'refresh' : 'check'} className={`size-4 ${busy ? 'animate-spin' : ''}`} />
              {busy ? 'กำลังตัดรูป...' : 'ใช้รูปนี้'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
