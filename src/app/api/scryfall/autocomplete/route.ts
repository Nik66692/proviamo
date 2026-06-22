import { NextResponse } from 'next/server';
import { autocomplete } from '@/providers/scryfall';
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  return NextResponse.json(q.length < 2 ? [] : await autocomplete(q));
}
