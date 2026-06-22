import { NextResponse } from 'next/server';
import { namedCard } from '@/providers/scryfall';
export async function GET(req: Request) {
  return NextResponse.json(
    await namedCard(new URL(req.url).searchParams.get('name') ?? ''),
  );
}
