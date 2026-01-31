import * as XLSX from "xlsx";
import { OrderFromXLS } from "@/types/order";

interface ShopeeRow {
  "ID do pedido"?: string;
  "Nome de usuário (comprador)"?: string;
  "Nome do destinatário"?: string;
  "Nome do Produto"?: string;
  "Nome da variação"?: string;
  Quantidade?: number;
  "Preço total do produto"?: number;
  "Observação do comprador"?: string;
  "Data prevista de envio"?: string;
  "Data de criação do pedido"?: string;
}

function parseDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();

  // Try to parse DD/MM/YYYY format
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Fallback to standard parsing
  return new Date(dateStr);
}

function parseValue(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  // Remove currency symbols and convert comma to dot
  const cleaned = value.replace(/[R$\s]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

export function parseShopeeXLS(buffer: ArrayBuffer): OrderFromXLS[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<ShopeeRow>(sheet);

  const orders: OrderFromXLS[] = [];

  for (const row of rows) {
    const shopeeOrderId = row["ID do pedido"];
    if (!shopeeOrderId) continue;

    orders.push({
      shopeeOrderId: String(shopeeOrderId),
      customerUser: row["Nome de usuário (comprador)"] || "",
      customerName: row["Nome do destinatário"] || "",
      productName: row["Nome do Produto"] || "",
      variation: row["Nome da variação"] || "",
      quantity: Number(row["Quantidade"]) || 1,
      totalValue: parseValue(row["Preço total do produto"]),
      customerNote: row["Observação do comprador"] || null,
      shippingDate: parseDate(row["Data prevista de envio"]),
      orderDate: parseDate(row["Data de criação do pedido"]),
    });
  }

  return orders;
}
