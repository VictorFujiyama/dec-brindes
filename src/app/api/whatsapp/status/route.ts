import { NextResponse } from "next/server";
import { getStatus, getQRCode } from "@/lib/whatsapp";

export async function GET() {
  const status = getStatus();
  const qrCode = getQRCode();

  return NextResponse.json({
    ...status,
    qrCode,
  });
}
