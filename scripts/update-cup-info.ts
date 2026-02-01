// Script para atualizar pedidos existentes com cupQuantity e realDescription
// Executar com: npx ts-node scripts/update-cup-info.ts

import { PrismaClient } from "@prisma/client";
import { calculateTotalCups, getRealDescription } from "../src/lib/product-mapping";

const prisma = new PrismaClient();

async function main() {
  console.log("Buscando pedidos sem info de copos...");

  // Busca pedidos que não têm cupQuantity ou realDescription
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { cupQuantity: null },
        { realDescription: null },
      ],
    },
  });

  console.log(`Encontrados ${orders.length} pedidos para atualizar`);

  let updated = 0;
  let notFound = 0;

  for (const order of orders) {
    const cupQty = calculateTotalCups(order.productName, order.quantity);
    const realDesc = getRealDescription(order.productName);

    if (cupQty || realDesc) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          cupQuantity: order.cupQuantity ?? cupQty,
          realDescription: order.realDescription ?? realDesc,
        },
      });
      updated++;
      console.log(`✓ ${order.shopeeOrderId}: ${cupQty} copos - ${realDesc}`);
    } else {
      notFound++;
      console.log(`✗ ${order.shopeeOrderId}: Produto não encontrado no mapeamento - "${order.productName}"`);
    }
  }

  console.log(`\nConcluído! ${updated} atualizados, ${notFound} sem mapeamento`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
