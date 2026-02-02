import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Pasta de origem das artes no Windows (acessível via WSL)
const ARTS_FOLDER = "/mnt/c/Users/navi/Desktop/Artes/Corel";
const TEMP_FOLDER = path.join(ARTS_FOLDER, "temp");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artNames } = body;

    if (!artNames || !Array.isArray(artNames) || artNames.length === 0) {
      return NextResponse.json(
        { error: "Nomes das artes são obrigatórios" },
        { status: 400 }
      );
    }

    // Verifica se a pasta de origem existe
    if (!fs.existsSync(ARTS_FOLDER)) {
      return NextResponse.json(
        { error: `Pasta não encontrada: ${ARTS_FOLDER}` },
        { status: 404 }
      );
    }

    // Cria a pasta temp se não existir, ou limpa se existir
    if (fs.existsSync(TEMP_FOLDER)) {
      // Limpa arquivos existentes na temp
      const existingFiles = fs.readdirSync(TEMP_FOLDER);
      for (const file of existingFiles) {
        fs.unlinkSync(path.join(TEMP_FOLDER, file));
      }
    } else {
      fs.mkdirSync(TEMP_FOLDER, { recursive: true });
    }

    // Lista todos os arquivos na pasta de origem
    const allFiles = fs.readdirSync(ARTS_FOLDER);

    const copied: string[] = [];
    const notFound: string[] = [];
    let orderNumber = 1;

    for (const artName of artNames) {
      if (!artName) continue;

      // Procura arquivos que contêm o nome da arte + " - shopee"
      // Exemplo: "Nome da Arte - shopee.cdr" ou "Nome da Arte - shopee.png"
      const cleanArtName = artName.trim();
      const searchPattern = `${cleanArtName} - shopee`.toLowerCase();

      console.log(`Buscando: "${cleanArtName}" -> pattern: "${searchPattern}"`);

      const matchingFiles = allFiles.filter(file =>
        file.toLowerCase().includes(searchPattern)
      );

      console.log(`  -> Encontrados: ${matchingFiles.length} arquivo(s)`);

      if (matchingFiles.length === 0) {
        notFound.push(cleanArtName);
      } else {
        for (const file of matchingFiles) {
          const sourcePath = path.join(ARTS_FOLDER, file);
          // Adiciona prefixo numérico para manter a ordem do PDF
          const numberedFileName = `${orderNumber} - ${file}`;
          const destPath = path.join(TEMP_FOLDER, numberedFileName);

          // Copia o arquivo (não move)
          fs.copyFileSync(sourcePath, destPath);
          copied.push(numberedFileName);
        }
        orderNumber++;
      }
    }

    return NextResponse.json({
      success: true,
      copied,
      notFound,
      tempFolder: TEMP_FOLDER,
      message: `${copied.length} arquivo(s) copiado(s) para temp`,
    });
  } catch (error) {
    console.error("Erro ao copiar artes:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Falha ao copiar artes", details: errorMessage },
      { status: 500 }
    );
  }
}

// GET para limpar a pasta temp
export async function DELETE() {
  try {
    if (fs.existsSync(TEMP_FOLDER)) {
      const files = fs.readdirSync(TEMP_FOLDER);
      for (const file of files) {
        fs.unlinkSync(path.join(TEMP_FOLDER, file));
      }
      return NextResponse.json({ success: true, message: `${files.length} arquivo(s) removido(s) da temp` });
    }
    return NextResponse.json({ success: true, message: "Pasta temp já está vazia" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Falha ao limpar temp", details: errorMessage },
      { status: 500 }
    );
  }
}
