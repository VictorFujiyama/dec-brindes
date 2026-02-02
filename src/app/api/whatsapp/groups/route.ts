import { NextResponse } from "next/server";
import { getGroups, getStatus } from "@/lib/whatsapp";

export async function GET() {
  const status = getStatus();

  if (!status.connected) {
    return NextResponse.json(
      { error: "WhatsApp não está conectado" },
      { status: 400 }
    );
  }

  try {
    const groups = await getGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    return NextResponse.json(
      { error: "Falha ao buscar grupos" },
      { status: 500 }
    );
  }
}
