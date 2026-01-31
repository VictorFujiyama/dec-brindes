"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Package,
  Copy,
  Check,
  Send,
  CheckSquare,
  Square,
  AlertTriangle,
  CalendarPlus,
  CalendarCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, DaysUntilBadge } from "./StatusBadge";
import { Order } from "@/types/order";

interface CustomerOrderCardsProps {
  orders: Order[];
  onUpdateOrder: (order: Order) => void;
  onOpenDetails: (order: Order) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

function FullCard({
  order,
  onOpenDetails,
  onUpdateOrder,
  selectable,
  selected,
  onToggleSelect,
}: {
  order: Order;
  onOpenDetails: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyOrderId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.shopeeOrderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleUrgent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isUrgent: !order.isUrgent }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateOrder(updated);
      }
    } catch (err) {
      console.error("Erro ao atualizar urgência:", err);
    }
  };

  const toggleDailyQueue = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inDailyQueue: !order.inDailyQueue }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateOrder(updated);
      }
    } catch (err) {
      console.error("Erro ao atualizar fila do dia:", err);
    }
  };

  const statusBorderClass = order.isUrgent
    ? "border-l-4 border-l-red-500 bg-red-500/10"
    : order.artStatus === "SHIPPED"
    ? "border-l-4 border-l-purple-500 bg-purple-500/10"
    : order.artStatus === "PRODUCTION"
    ? "border-l-4 border-l-blue-500 bg-blue-500/10"
    : order.artStatus === "APPROVED"
    ? "border-l-4 border-l-green-500 bg-green-500/10"
    : "border-l-4 border-l-yellow-500 bg-yellow-500/10";

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${statusBorderClass} h-full`}
      onClick={() => onOpenDetails(order)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          {selectable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.(order.id);
              }}
              className="mt-0.5 flex-shrink-0"
            >
              {selected ? (
                <CheckSquare className="h-5 w-5 text-blue-500" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          )}
          <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
            {order.productName}
          </CardTitle>
          {(order.artStatus === "PENDING" || order.artStatus === "APPROVED" || order.artStatus === "PRODUCTION") && (
            <>
              <button
                onClick={toggleDailyQueue}
                className={`p-1 rounded transition-colors ${
                  order.inDailyQueue
                    ? "text-orange-500 bg-orange-500/20 hover:bg-orange-500/30"
                    : "text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"
                }`}
                title={order.inDailyQueue ? "Remover do dia" : "Adicionar ao dia"}
              >
                {order.inDailyQueue ? (
                  <CalendarCheck className="h-4 w-4" />
                ) : (
                  <CalendarPlus className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={toggleUrgent}
                className={`p-1 rounded transition-colors ${
                  order.isUrgent
                    ? "text-red-500 bg-red-500/20 hover:bg-red-500/30"
                    : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                }`}
                title={order.isUrgent ? "Remover urgência" : "Marcar como urgente"}
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            </>
          )}
          <StatusBadge status={order.artStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
          <span className="font-mono font-bold text-sm">{order.shopeeOrderId}</span>
          <button
            onClick={copyOrderId}
            className="p-1 hover:bg-muted rounded transition-colors ml-auto"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>Qtd: {order.quantity}</span>
          {order.variation && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              {order.variation}
            </span>
          )}
        </div>
        {order.internalNote && (
          <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300">
            {order.internalNote}
          </div>
        )}
        <div className="flex items-center justify-between">
          <DaysUntilBadge shippingDate={order.shippingDate} />
          {order.customerNote && <MessageSquare className="h-4 w-4 text-blue-500" />}
        </div>
        {order.artStatus === "PRODUCTION" && order.sentToProductionAt && (
          <div className="flex items-center gap-1 text-xs text-blue-400">
            <Send className="h-3 w-3" />
            <span>
              Enviado: {format(new Date(order.sentToProductionAt), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CustomerOrderCards({
  orders,
  onUpdateOrder,
  onOpenDetails,
  selectable,
  selectedIds,
  onToggleSelect,
}: CustomerOrderCardsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isSingleOrder = orders.length === 1;

  return (
    <div className="relative" style={{ minHeight: 280 }}>
      {orders.map((order, index) => {
        const isHovered = hoveredIndex === index;
        const zIndex = isHovered ? 50 : index + 1;
        const offsetPercent = index * 25;

        return (
          <div
            key={order.id}
            className="transition-all duration-200 ease-out bg-background rounded-lg absolute top-0"
            style={{
              zIndex,
              left: `${offsetPercent}%`,
              width: '100%',
              transform: isHovered
                ? 'scale(1.02) translateY(-3px)'
                : 'scale(1) translateY(0)',
              boxShadow: isHovered ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
            }}
            onMouseEnter={() => !isSingleOrder && setHoveredIndex(index)}
            onMouseLeave={() => !isSingleOrder && setHoveredIndex(null)}
          >
            <FullCard
              order={order}
              onOpenDetails={onOpenDetails}
              onUpdateOrder={onUpdateOrder}
              selectable={selectable}
              selected={selectedIds?.has(order.id)}
              onToggleSelect={onToggleSelect}
            />
          </div>
        );
      })}
    </div>
  );
}
