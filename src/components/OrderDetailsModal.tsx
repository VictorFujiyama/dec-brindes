"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Calendar, Check, User, Factory, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge, DaysUntilBadge } from "./StatusBadge";
import { Order, ArtStatus } from "@/types/order";

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdateOrder: (order: Order) => void;
}

export function OrderDetailsModal({ order, onClose, onUpdateOrder }: OrderDetailsModalProps) {
  const [internalNote, setInternalNote] = useState(order.internalNote || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = async (newStatus: ArtStatus) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artStatus: newStatus }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateOrder(updated);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNote = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNote }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateOrder(updated);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={order.artStatus} />
            <DaysUntilBadge shippingDate={order.shippingDate} />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">{order.productName}</h4>
            {order.variation && (
              <p className="text-sm text-muted-foreground">
                Variacao: {order.variation}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-muted-foreground">@{order.customerUser}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(new Date(order.shippingDate), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-muted-foreground">Data de envio</p>
              </div>
            </div>
          </div>

          <div className="text-sm">
            <p>
              <span className="text-muted-foreground">Pedido Shopee:</span>{" "}
              {order.shopeeOrderId}
            </p>
            <p>
              <span className="text-muted-foreground">Quantidade:</span>{" "}
              {order.quantity}
            </p>
            <p>
              <span className="text-muted-foreground">Valor:</span> R${" "}
              {order.totalValue.toFixed(2)}
            </p>
          </div>

          {order.customerNote && (
            <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm font-medium text-blue-400 mb-1">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Observacao do Cliente:
              </p>
              <p className="text-sm text-blue-300">{order.customerNote}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Suas Anotacoes Internas:
            </label>
            <Textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Ex: Cliente quer cor rosa, fonte Arial..."
              rows={3}
            />
            <Button
              onClick={handleSaveNote}
              disabled={isSaving}
              variant="outline"
              size="sm"
            >
              Salvar Anotacao
            </Button>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t">
            {order.artStatus === "PENDING" && (
              <Button
                onClick={() => handleStatusChange("APPROVED")}
                disabled={isSaving}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar como Aprovado
              </Button>
            )}

            {order.artStatus === "APPROVED" && (
              <>
                <Button
                  onClick={() => handleStatusChange("PRODUCTION")}
                  disabled={isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Factory className="h-4 w-4 mr-2" />
                  Enviar para Producao
                </Button>
                <Button
                  onClick={() => handleStatusChange("PENDING")}
                  disabled={isSaving}
                  variant="outline"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Pendente
                </Button>
              </>
            )}

            {order.artStatus === "PRODUCTION" && (
              <Button
                onClick={() => handleStatusChange("APPROVED")}
                disabled={isSaving}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Aprovado
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
