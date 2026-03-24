import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();

    return NextResponse.json({ text: parsed.text || "" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF parsing failed" },
      { status: 500 }
    );
  }
}
