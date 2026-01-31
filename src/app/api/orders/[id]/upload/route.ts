import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase, STORAGE_BUCKET, getPublicUrl } from "@/lib/supabase";

// Remove acentos e caracteres especiais do nome do arquivo
function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "") // Remove outros caracteres especiais
    .replace(/\s+/g, " ") // Normaliza espaços
    .trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("type") as string; // "png" or "cdr"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!["png", "cdr"].includes(fileType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Get order to use shopeeOrderId in filename
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Create filename - usa artName se existir, senão usa nome original do arquivo
    const extension = fileType === "png" ? "png" : "cdr";
    let fileName: string;

    if (order.artName) {
      // Usa o padrão "ArtName - shopee.ext" (sanitizado)
      fileName = sanitizeFileName(`${order.artName} - shopee.${extension}`);
    } else {
      // Usa o nome original do arquivo (sanitizado)
      const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extensão
      fileName = sanitizeFileName(`${originalName}.${extension}`);
    }

    const filePath = `${id}/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const publicUrl = getPublicUrl(filePath);

    // Update order with file URL
    const updateData =
      fileType === "png" ? { artPngUrl: publicUrl } : { artCdrUrl: publicUrl };

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get("type"); // "png" or "cdr"

    if (!fileType || !["png", "cdr"].includes(fileType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get the current file URL and extract the path
    const currentUrl = fileType === "png" ? order.artPngUrl : order.artCdrUrl;

    if (currentUrl) {
      // Extract path from URL: .../storage/v1/object/public/bucket/path
      const urlParts = currentUrl.split(`${STORAGE_BUCKET}/`);
      if (urlParts[1]) {
        const filePath = decodeURIComponent(urlParts[1]);
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      }
    }

    // Update order to remove URL
    const updateData =
      fileType === "png" ? { artPngUrl: null } : { artCdrUrl: null };

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
