import { NextResponse } from 'next/server';
import { checkSession } from '@/app/actions/auth';

export async function GET() {
  const user = await checkSession();
  return NextResponse.json({ admin: !!user });
}
