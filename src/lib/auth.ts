// src/lib/auth.ts
import { USER_ROLE, type UserRole } from '@/constants/workflow'; import { backendFetch } from '@/lib/backend';
type Me={id:string;name:string;email:string;role:UserRole;department:string|null};
async function me():Promise<Me|null>{try{return await backendFetch<Me>('/auth/me')}catch{return null}}
export async function getViewerRole():Promise<UserRole>{return (await me())?.role??USER_ROLE.TEACHER}
export async function getViewerName():Promise<string>{return (await me())?.name??'ผู้ใช้งาน'}
export async function getViewerSubjectGroup():Promise<string|null>{return (await me())?.department??null}
export async function getViewer(){return me()}
