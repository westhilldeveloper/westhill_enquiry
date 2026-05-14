import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dmcs = await prisma.dmc.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(dmcs);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, phone, email, location } = body;
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const dmc = await prisma.dmc.create({
    data: { name, phone, email, location },
  });
  return NextResponse.json(dmc, { status: 201 });
}