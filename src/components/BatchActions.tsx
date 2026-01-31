"use client";

import { useState } from "react";
import { Factory, FileText, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import { generateOrdersPDF } from "@/lib/generate-order-pdf";

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
