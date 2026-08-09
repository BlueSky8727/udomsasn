// src/lib/auth-client.ts
'use client';
import type {UserRole} from '@/constants/workflow';
const ACCESS_TOKEN_COOKIE='udomsasn_access_token';
export type Credentials={email:string;password:string}; export type SignInOptions={role:UserRole;remember:boolean}; export type SignInResult={ok:true}|{ok:false;message:string}; export const DEV_LOGIN_ENABLED=false;
export async function signIn(credentials:Credentials,options:SignInOptions):Promise<SignInResult>{try{const base=process.env.NEXT_PUBLIC_BACKEND_URL??'http://localhost:4000/api';const r=await fetch(`${base}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...credentials,role:options.role})});if(!r.ok)return{ok:false,message:'อีเมล รหัสผ่าน หรือบทบาทไม่ถูกต้อง'};const data=await r.json();const max=options.remember?'; Max-Age=604800':'';document.cookie=`${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(data.accessToken)}; Path=/; SameSite=Lax${max}`;return{ok:true}}catch{return{ok:false,message:'เชื่อมต่อ Backend ไม่สำเร็จ'}}}
export async function signOut(){document.cookie=`${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`}
