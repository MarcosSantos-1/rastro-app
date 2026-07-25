import { NextResponse } from "next/server";
import { seedFirestore } from "@/lib/firestore/seed";

export async function POST() {
  try {
    const result = await seedFirestore();
    return NextResponse.json({
      ok: true,
      message: "Dados iniciais criados com sucesso",
      ...result,
    });
  } catch (e) {
    console.error("Seed error:", e);
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
