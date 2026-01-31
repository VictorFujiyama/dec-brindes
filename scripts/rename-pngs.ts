import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const STORAGE_BUCKET = "dcbrindesbucket";

// Remove acentos e caracteres especiais do nome do arquivo
function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "") // Remove outros caracteres especiais
    .replace(/\s+/g, " ") // Normaliza espaços
    .trim();
}

async function main() {
  console.log("🔍 Buscando pedidos com PNG para renomear...\n");

  // Busca todos os pedidos que têm PNG e artName
  const ordersWithPng = await prisma.order.findMany({
    where: {
      artPngUrl: { not: null },
      artName: { not: null },
    },
    select: {
      id: true,
      artName: true,
      artPngUrl: true,
    },
  });

  console.log(`📋 ${ordersWithPng.length} pedidos com PNG encontrados\n`);

  let renamed = 0;
  let skipped = 0;
  let errors = 0;

  for (const order of ordersWithPng) {
    if (!order.artPngUrl || !order.artName) continue;

    // Nome esperado: "ArtName - shopee.png" (sanitizado)
    const expectedFileName = sanitizeFileName(`${order.artName} - shopee.png`);
    const expectedPath = `${order.id}/${expectedFileName}`;

    // Verifica se já está com o nome correto
    if (order.artPngUrl.includes(expectedFileName)) {
      skipped++;
      continue;
    }

    console.log(`🔄 Renomeando: "${order.artName}"`);
    console.log(`   De: ${order.artPngUrl.split("/").pop()}`);
    console.log(`   Para: ${expectedFileName}`);

    try {
      // Baixa o arquivo atual
      const response = await fetch(order.artPngUrl);
      if (!response.ok) {
        console.error(`   ❌ Erro ao baixar: ${response.statusText}`);
        errors++;
        continue;
      }

      const blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());

      // Faz upload com o novo nome
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(expectedPath, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(`   ❌ Erro upload: ${uploadError.message}`);
        errors++;
        continue;
      }

      // Obtém nova URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(expectedPath);

      // Atualiza no banco
      await prisma.order.update({
        where: { id: order.id },
        data: { artPngUrl: publicUrl },
      });

      // Tenta deletar o arquivo antigo
      const oldPath = order.artPngUrl
        .split(`${STORAGE_BUCKET}/`)[1];
      if (oldPath && oldPath !== expectedPath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
      }

      console.log(`   ✅ Renomeado!`);
      renamed++;
    } catch (err) {
      console.error(`   ❌ Erro: ${err}`);
      errors++;
    }
  }

  console.log("\n========================================");
  console.log(`📊 Resumo:`);
  console.log(`   Total com PNG: ${ordersWithPng.length}`);
  console.log(`   Renomeados: ${renamed}`);
  console.log(`   Já corretos: ${skipped}`);
  console.log(`   Erros: ${errors}`);
  console.log("========================================\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
