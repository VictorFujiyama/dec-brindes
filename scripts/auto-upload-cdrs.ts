import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const STORAGE_BUCKET = "dcbrindesbucket";

const CDR_FOLDER = "/mnt/c/Users/navi/Desktop/Artes/Corel";

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
  console.log("🔍 Buscando pedidos sem CDR (APPROVED/PRODUCTION)...\n");

  // Busca todos os pedidos sem CDR que estão em produção ou aprovados
  const ordersWithoutCdr = await prisma.order.findMany({
    where: {
      artCdrUrl: null,
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

  console.log(`📋 ${ordersWithoutCdr.length} pedidos precisam de CDR\n`);

  // Lista todos os arquivos CDR na pasta
  const cdrFiles = fs.readdirSync(CDR_FOLDER).filter((f) => f.toLowerCase().endsWith(".cdr"));
  console.log(`📁 ${cdrFiles.length} arquivos CDR na pasta\n`);

  // Cria um mapa de artName -> fileName
  const artNameToFile = new Map<string, string>();
  for (const file of cdrFiles) {
    // Remove " - shopee.cdr" do final para obter o artName
    const artName = file.replace(/ - shopee\.cdr$/i, "");
    artNameToFile.set(artName.toLowerCase(), file);
  }

  let matched = 0;
  let uploaded = 0;
  let errors = 0;

  for (const order of ordersWithoutCdr) {
    if (!order.artName) continue;

    const artNameLower = order.artName.toLowerCase();
    const matchedFile = artNameToFile.get(artNameLower);

    if (matchedFile) {
      matched++;
      const filePath = path.join(CDR_FOLDER, matchedFile);
      console.log(`✅ Match: "${order.artName}" -> ${matchedFile}`);

      try {
        // Lê o arquivo
        const fileBuffer = fs.readFileSync(filePath);

        // Mantém o nome original do arquivo no storage (sanitizado)
        // Formato: orderId/NomeOriginal.cdr
        const sanitizedName = sanitizeFileName(matchedFile);
        const fileName = `${order.id}/${sanitizedName}`;

        // Upload para o Supabase
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, fileBuffer, {
            contentType: "application/octet-stream",
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
          data: { artCdrUrl: publicUrl },
        });

        console.log(`   📤 Uploaded! ${matchedFile}`);
        uploaded++;
      } catch (err) {
        console.error(`   ❌ Erro: ${err}`);
        errors++;
      }
    }
  }

  console.log("\n========================================");
  console.log(`📊 Resumo:`);
  console.log(`   Pedidos sem CDR: ${ordersWithoutCdr.length}`);
  console.log(`   Matches encontrados: ${matched}`);
  console.log(`   Uploads com sucesso: ${uploaded}`);
  console.log(`   Erros: ${errors}`);
  console.log("========================================\n");

  // Lista os que não encontraram match
  const notMatched = ordersWithoutCdr.filter((o) => {
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
