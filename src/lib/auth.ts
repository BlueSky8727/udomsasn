import { cache } from 'react';
import { redirect } from 'next/navigation';
import { backendFetch } from '@/lib/backend';
import type { BackendUser } from '@/types/backend';
import type { UserRole } from '@/constants/workflow';

export const getViewer = cache(async (): Promise<BackendUser | null> => {
  try {
    return await backendFetch<BackendUser>('/auth/me');
  } catch {
    return null;
  }
});

export async function requireViewer(): Promise<BackendUser> {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  return viewer;
}

export async function getViewerRole(): Promise<UserRole> {
  return (await requireViewer()).role;
}

export async function getViewerName(): Promise<string> {
  return (await requireViewer()).name;
}

export async function getViewerSubjectGroup(): Promise<string | null> {
  return (await requireViewer()).department;
}
