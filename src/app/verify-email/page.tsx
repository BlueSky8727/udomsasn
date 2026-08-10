import { VerifyEmailClient } from './verify-email-client';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-5 py-10">
      <VerifyEmailClient token={value ?? null} />
    </main>
  );
}
