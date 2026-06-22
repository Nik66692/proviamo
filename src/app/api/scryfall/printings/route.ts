import { NextResponse } from 'next/server';
import { printings } from '@/providers/scryfall';
export async function GET(req: Request) {
  return NextResponse.json(
    await printings(new URL(req.url).searchParams.get('oracleId') ?? ''),
  );
}
