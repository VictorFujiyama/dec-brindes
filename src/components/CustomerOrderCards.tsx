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
  Scissors,
  Merge,
  Pencil,
  X,
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
  canSplit,
}: {
  order: Order;
  onOpenDetails: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  canSplit?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(order.artName || "");

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

  const handleSplit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Usa timestamp modular para caber em INT32 (máx ~2 bilhões)
      const newArtGroupId = Math.floor(Date.now() / 1000) % 1000000000;
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artGroupId: newArtGroupId }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateOrder(updated);
      }
    } catch (err) {
      console.error("Erro ao separar pedido:", err);
    }
  };

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Volta para o grupo padrão (0)
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artGroupId: 0 }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateOrder(updated);
      }
    } catch (err) {
      console.error("Erro ao juntar pedido:", err);
    }
  };

  const saveIndividualName = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artName: editName || null }),
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateOrder(updated);
      }
    } catch (err) {
      console.error("Erro ao salvar nome:", err);
    }
    setIsEditingName(false);
  };

  const isInSeparateGroup = order.artGroupId > 0;

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
            <span className="inline-flex items-center justify-center bg-orange-500 text-white text-base font-bold px-2 py-0.5 rounded mr-2">{order.quantity}x</span>
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
              {/* Botão Separar/Juntar */}
              {isInSeparateGroup ? (
                <button
                  onClick={handleJoin}
                  className="p-1 rounded transition-colors text-cyan-500 bg-cyan-500/20 hover:bg-cyan-500/30"
                  title="Juntar ao grupo principal"
                >
                  <Merge className="h-4 w-4" />
                </button>
              ) : canSplit ? (
                <button
                  onClick={handleSplit}
                  className="p-1 rounded transition-colors text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10"
                  title="Separar pedido"
                >
                  <Scissors className="h-4 w-4" />
                </button>
              ) : null}
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
        {/* Nome individual para pedidos separados */}
        {isInSeparateGroup && (
          <div className="flex items-center gap-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded">
            {isEditingName ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome da arte (opcional)"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveIndividualName();
                    if (e.key === "Escape") {
                      setEditName(order.artName || "");
                      setIsEditingName(false);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveIndividualName();
                  }}
                  className="p-1 hover:bg-green-500/20 rounded text-green-500"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditName(order.artName || "");
                    setIsEditingName(false);
                  }}
                  className="p-1 hover:bg-red-500/20 rounded text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <span className="text-xs text-cyan-400 flex-1">
                  {order.artName || "Sem nome individual"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(true);
                  }}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        )}
        {order.variation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              {order.variation}
            </span>
          </div>
        )}
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
  // Pode separar se tem mais de um pedido no grupo
  const canSplit = orders.length > 1;

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
              canSplit={canSplit}
            />
          </div>
        );
      })}
    </div>
  );
}
