import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseShopeeXLS } from "@/lib/xlsx-parser";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ status: "parsing", message: "Lendo arquivo..." });

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
          send({ status: "error", message: "Nenhum arquivo enviado" });
          controller.close();
          return;
        }

        const buffer = await file.arrayBuffer();
        const orders = parseShopeeXLS(buffer);

        if (orders.length === 0) {
          send({ status: "error", message: "Nenhum pedido encontrado no arquivo" });
          controller.close();
          return;
        }

        send({ status: "processing", message: `Processando ${orders.length} pedidos...`, total: orders.length, processed: 0 });

        let created = 0;
        let updated = 0;
        let processed = 0;

        const batchSize = 20;
        for (let i = 0; i < orders.length; i += batchSize) {
          const batch = orders.slice(i, i + batchSize);

          const results = await prisma.$transaction(
            batch.map((order) =>
              prisma.order.upsert({
                where: { shopeeOrderId: order.shopeeOrderId },
                create: order,
                update: {
                  customerUser: order.customerUser,
                  customerName: order.customerName,
                  productName: order.productName,
                  variation: order.variation,
                  quantity: order.quantity,
                  totalValue: order.totalValue,
                  customerNote: order.customerNote,
                  shippingDate: order.shippingDate,
                  orderDate: order.orderDate,
                },
              })
            )
          );

          for (const result of results) {
            const isNew = new Date(result.createdAt).getTime() === new Date(result.updatedAt).getTime();
            if (isNew) created++;
            else updated++;
          }

          processed += batch.length;
          send({
            status: "processing",
            message: `Processando pedidos...`,
            total: orders.length,
            processed,
            percent: Math.round((processed / orders.length) * 100)
          });
        }

        // Detecta pedidos enviados (estavam em PRODUCTION mas não estão no XLS)
        send({ status: "checking_shipped", message: "Verificando pedidos enviados..." });

        const importedOrderIds = orders.map(o => o.shopeeOrderId);

        // Busca pedidos em PRODUCTION que NÃO estão no XLS importado
        const shippedOrders = await prisma.order.updateMany({
          where: {
            artStatus: "PRODUCTION",
            shopeeOrderId: { notIn: importedOrderIds }
          },
          data: {
            artStatus: "SHIPPED",
            shippedAt: new Date(),
            inDailyQueue: false
          }
        });

        const shipped = shippedOrders.count;

        send({
          status: "done",
          message: `Importado! ${created} novos, ${updated} atualizados${shipped > 0 ? `, ${shipped} enviados` : ""}`,
          created,
          updated,
          shipped,
          total: orders.length
        });

      } catch (error) {
        console.error("Upload error:", error);
        send({ status: "error", message: "Erro ao processar arquivo" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
