import { NextResponse } from "next/server";
import { store } from "@/lib/data";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(store().meta);
}
