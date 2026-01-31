"use client";

import { useState } from "react";
import { Factory, FileText, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";

interface BatchActionsProps {
  orders: Order[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSendToProduction: (orderIds: string[]) => Promise<void>;
}

export function BatchActions({
  orders,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onSendToProduction,
}: BatchActionsProps) {
  const [isSending, setIsSending] = useState(false);

  const selectedOrders = orders.filter((o) => selectedIds.has(o.id));
  const allSelected = orders.length > 0 && selectedIds.size === orders.length;

  const generatePDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedidos para Producao - ${new Date().toLocaleDateString("pt-BR")}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 10px; font-size: 18px; }
          .date { text-align: center; margin-bottom: 20px; color: #666; font-size: 12px; }
          .order { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
          .order-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
          .order-id { font-weight: bold; font-size: 14px; }
          .art-name { color: #2563eb; font-weight: bold; }
          .product { font-size: 13px; margin-bottom: 8px; }
          .details { font-size: 12px; color: #666; }
          .details span { margin-right: 15px; }
          .note { background: #f0f9ff; border: 1px solid #bae6fd; padding: 10px; margin-top: 10px; font-size: 12px; }
          .note-title { font-weight: bold; color: #0369a1; margin-bottom: 5px; }
          .internal-note { background: #faf5ff; border: 1px solid #e9d5ff; padding: 10px; margin-top: 10px; font-size: 12px; }
          .internal-note-title { font-weight: bold; color: #7c3aed; margin-bottom: 5px; }
          .summary { margin-top: 30px; padding-top: 20px; border-top: 2px solid #000; }
          .summary h2 { font-size: 14px; margin-bottom: 10px; }
          .summary p { font-size: 12px; margin-bottom: 5px; }
          @media print {
            body { padding: 10px; }
            .order { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Pedidos para Producao</h1>
        <p class="date">${new Date().toLocaleDateString("pt-BR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        ${selectedOrders
          .map(
            (order) => `
          <div class="order">
            <div class="order-header">
              <span class="order-id">${order.shopeeOrderId}</span>
              ${order.artName ? `<span class="art-name">${order.artName}</span>` : ""}
            </div>
            <p class="product">${order.productName}</p>
            <div class="details">
              <span><strong>Qtd:</strong> ${order.quantity}</span>
              <span><strong>Cliente:</strong> @${order.customerUser}</span>
              ${order.variation ? `<span><strong>Variacao:</strong> ${order.variation}</span>` : ""}
            </div>
            ${order.customerNote ? `
              <div class="note">
                <p class="note-title">Observacao do Cliente:</p>
                <p>${order.customerNote}</p>
              </div>
            ` : ""}
            ${order.internalNote ? `
              <div class="internal-note">
                <p class="internal-note-title">Anotacao Interna:</p>
                <p>${order.internalNote}</p>
              </div>
            ` : ""}
          </div>
        `
          )
          .join("")}

        <div class="summary">
          <h2>Resumo</h2>
          <p><strong>Total de pedidos:</strong> ${selectedOrders.length}</p>
          <p><strong>Total de itens:</strong> ${selectedOrders.reduce((acc, o) => acc + o.quantity, 0)}</p>
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSendToProduction = async () => {
    if (selectedIds.size === 0) return;

    setIsSending(true);
    try {
      generatePDF();
      await onSendToProduction(Array.from(selectedIds));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? (
            <CheckSquare className="h-4 w-4 mr-2" />
          ) : (
            <Square className="h-4 w-4 mr-2" />
          )}
          {allSelected ? "Desmarcar Todos" : "Selecionar Todos"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedIds.size} de {orders.length} selecionados
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generatePDF}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button
            size="sm"
            onClick={handleSendToProduction}
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Factory className="h-4 w-4 mr-2" />
            Enviar para Producao ({selectedIds.size})
          </Button>
        </div>
      )}
    </div>
  );
}
