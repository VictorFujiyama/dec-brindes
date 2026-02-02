"use client";

import { useState } from "react";
import { Factory, FileText, CheckSquare, Square, Paintbrush, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import { generateOrdersPDF } from "@/lib/generate-order-pdf";

// Verifica se o pedido precisa de pintura (degradê, bicolor, borda)
function needsPainting(realDescription: string | null, productName: string): boolean {
  const desc = (realDescription || productName).toLowerCase();
  const paintingKeywords = ["degradê", "degrade", "bicolor", "borda"];
  return paintingKeywords.some(keyword => desc.includes(keyword));
}

// Agrupa pedidos por cliente e artGroupId (mesma ordenação do PDF)
function groupOrdersForPainting(orders: Order[]): Order[][] {
  const groups: Record<string, Order[]> = {};

  for (const order of orders) {
    // Só inclui pedidos que precisam de pintura
    if (!needsPainting(order.realDescription, order.productName)) continue;

    // Agrupa por cliente + artGroupId
    const key = `${order.customerUser}_${order.artGroupId ?? 0}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(order);
  }

  // Converte para array com metadados para ordenação
  const orderGroups = Object.values(groups)
    .filter(group => group.some(o => o.artPngUrl)) // Só grupos com imagem
    .map((groupOrders) => {
      const earliestShipping = Math.min(...groupOrders.map(o => new Date(o.shippingDate).getTime()));
      const isUrgent = groupOrders.some(o => o.isUrgent);
      return {
        orders: groupOrders,
        customerUser: groupOrders[0].customerUser,
        earliestShipping,
        isUrgent,
      };
    });

  // Calcula data mais cedo e urgência por cliente
  const customerEarliestDate: Record<string, number> = {};
  const customerHasUrgent: Record<string, boolean> = {};
  for (const group of orderGroups) {
    const current = customerEarliestDate[group.customerUser];
    if (current === undefined || group.earliestShipping < current) {
      customerEarliestDate[group.customerUser] = group.earliestShipping;
    }
    if (group.isUrgent) {
      customerHasUrgent[group.customerUser] = true;
    }
  }

  // Ordena igual ao PDF: urgentes primeiro, por data do cliente, por data do grupo
  orderGroups.sort((a, b) => {
    // 1. Clientes com pedidos urgentes primeiro
    const aCustomerUrgent = customerHasUrgent[a.customerUser] ? 1 : 0;
    const bCustomerUrgent = customerHasUrgent[b.customerUser] ? 1 : 0;
    if (bCustomerUrgent !== aCustomerUrgent) return bCustomerUrgent - aCustomerUrgent;

    // 2. Por data mais cedo do cliente
    const aCustomerDate = customerEarliestDate[a.customerUser];
    const bCustomerDate = customerEarliestDate[b.customerUser];
    if (aCustomerDate !== bCustomerDate) return aCustomerDate - bCustomerDate;

    // 3. Dentro do mesmo cliente, urgentes primeiro
    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;

    // 4. Dentro do mesmo cliente, por data do grupo
    return a.earliestShipping - b.earliestShipping;
  });

  return orderGroups.map(g => g.orders);
}

interface BatchActionsProps {
  orders: Order[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSendToProduction: (orderIds: string[]) => Promise<void>;
  whatsappGroupId?: string | null;
}

export function BatchActions({
  orders,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onSendToProduction,
  whatsappGroupId,
}: BatchActionsProps) {
  const [isSending, setIsSending] = useState(false);
  const [isSendingPainting, setIsSendingPainting] = useState(false);
  const [paintingProgress, setPaintingProgress] = useState({ current: 0, total: 0 });

  const selectedOrders = orders.filter((o) => selectedIds.has(o.id));
  const allSelected = orders.length > 0 && selectedIds.size === orders.length;

  // Grupos que precisam de pintura (dos selecionados)
  const paintingGroups = groupOrdersForPainting(selectedOrders);

  const handleGeneratePDF = () => {
    generateOrdersPDF(selectedOrders);
  };

  const handleSendToProduction = async () => {
    if (selectedIds.size === 0) return;

    setIsSending(true);
    try {
      handleGeneratePDF();
      await onSendToProduction(Array.from(selectedIds));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPainting = async () => {
    if (!whatsappGroupId || paintingGroups.length === 0) return;

    setIsSendingPainting(true);
    setPaintingProgress({ current: 0, total: paintingGroups.length });

    try {
      for (let i = 0; i < paintingGroups.length; i++) {
        const group = paintingGroups[i];
        setPaintingProgress({ current: i + 1, total: paintingGroups.length });

        await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderIds: group.map(o => o.id),
            groupId: whatsappGroupId,
          }),
        });

        // Delay de 4 segundos entre envios (exceto no último)
        if (i < paintingGroups.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      }
    } finally {
      setIsSendingPainting(false);
      setPaintingProgress({ current: 0, total: 0 });
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
          <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          {whatsappGroupId && paintingGroups.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendPainting}
              disabled={isSendingPainting}
              className="text-purple-500 hover:text-purple-600 hover:border-purple-500"
            >
              {isSendingPainting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando {paintingProgress.current}/{paintingProgress.total}...
                </>
              ) : (
                <>
                  <Paintbrush className="h-4 w-4 mr-2" />
                  Enviar Pintura ({paintingGroups.length})
                </>
              )}
            </Button>
          )}
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
