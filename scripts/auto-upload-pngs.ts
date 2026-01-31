import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const STORAGE_BUCKET = "dcbrindesbucket";

const PNG_FOLDER = "/mnt/c/Users/navi/Desktop/Artes/PNG";

async function main() {
  console.log("🔍 Buscando pedidos sem PNG (APPROVED/PRODUCTION)...\n");

  // Busca todos os pedidos sem PNG que estão em produção ou aprovados
  const ordersWithoutPng = await prisma.order.findMany({
    where: {
      artPngUrl: null,
      artName: { not: null },
      artStatus: { in: ["APPROVED", "PRODUCTION"] },
    },
    select: {
      id: true,
      artName: true,
      customerUser: true,
      shopeeOrderId: true,
    },
  });

  console.log(`📋 ${ordersWithoutPng.length} pedidos precisam de PNG\n`);

  // Lista todos os arquivos PNG na pasta
  const pngFiles = fs.readdirSync(PNG_FOLDER).filter((f) => f.endsWith(".png"));
  console.log(`📁 ${pngFiles.length} arquivos PNG na pasta\n`);

  // Cria um mapa de artName -> filePath
  const artNameToFile = new Map<string, string>();
  for (const file of pngFiles) {
    // Remove " - shopee.png" do final para obter o artName
    const artName = file.replace(/ - shopee\.png$/i, "");
    artNameToFile.set(artName.toLowerCase(), file);
  }

  let matched = 0;
  let uploaded = 0;
  let errors = 0;

  for (const order of ordersWithoutPng) {
    if (!order.artName) continue;

    const artNameLower = order.artName.toLowerCase();
    const matchedFile = artNameToFile.get(artNameLower);

    if (matchedFile) {
      matched++;
      const filePath = path.join(PNG_FOLDER, matchedFile);
      console.log(`✅ Match: "${order.artName}" -> ${matchedFile}`);

      try {
        // Lê o arquivo
        const fileBuffer = fs.readFileSync(filePath);

        // Gera nome único para o storage
        const fileName = `${order.id}/arte-${Date.now()}.png`;

        // Upload para o Supabase
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, fileBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error(`   ❌ Erro upload: ${uploadError.message}`);
          errors++;
          continue;
        }

        // Obtém URL pública
        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

        // Atualiza no banco
        await prisma.order.update({
          where: { id: order.id },
          data: { artPngUrl: publicUrl },
        });

        console.log(`   📤 Uploaded! ${publicUrl.substring(0, 60)}...`);
        uploaded++;
      } catch (err) {
        console.error(`   ❌ Erro: ${err}`);
        errors++;
      }
    }
  }

  console.log("\n========================================");
  console.log(`📊 Resumo:`);
  console.log(`   Pedidos sem PNG: ${ordersWithoutPng.length}`);
  console.log(`   Matches encontrados: ${matched}`);
  console.log(`   Uploads com sucesso: ${uploaded}`);
  console.log(`   Erros: ${errors}`);
  console.log("========================================\n");

  // Lista os que não encontraram match
  const notMatched = ordersWithoutPng.filter((o) => {
    if (!o.artName) return true;
    return !artNameToFile.has(o.artName.toLowerCase());
  });

  if (notMatched.length > 0) {
    console.log(`\n⚠️ ${notMatched.length} pedidos sem match:`);
    notMatched.forEach((o) => console.log(`   - ${o.artName}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
