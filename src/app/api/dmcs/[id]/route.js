import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  const dmc = await prisma.dmc.findUnique({ where: { id } });
  if (!dmc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(dmc);
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  const body = await request.json();
  const { name, phone, email, location } = body;
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const updated = await prisma.dmc.update({
    where: { id },
    data: { name, phone, email, location },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  await prisma.dmc.delete({ where: { id } });
  return NextResponse.json({ success: true });
}