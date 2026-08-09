import Image from 'next/image';

export function SchoolLogo({ className = 'size-12' }: { className?: string }) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full border border-line bg-white ${className}`}
    >
      <Image
        src="/udomsasnwittaya-school-logo-centered.png"
        alt="ตราโรงเรียนอุดมศาสน์วิทยา"
        fill
        sizes="56px"
        className="object-contain"
        priority
      />
    </span>
  );
}
