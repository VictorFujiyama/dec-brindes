"use client";

import { useMemo, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Order, GroupedOrders } from "@/types/order";
import { UploadBox } from "./OrderGroup";
import { CustomerOrderCards } from "./CustomerOrderCards";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { BatchActions } from "./BatchActions";
import { ProductionDateFilter } from "./ProductionDateFilter";
import { SendToPaintingButton } from "./SendToPaintingButton";
import { format } from "date-fns";

interface OrderTableProps {
  orders: Order[];
  onUpdateOrder: (order: Order) => void;
  onUpdateMultiple: (orders: Order[]) => void;
  selectable?: boolean;
  showProductionFilter?: boolean;
  whatsappGroupId?: string | null;
}

function GroupHeader({
  group,
  onUpdateMultiple,
}: {
  group: GroupedOrders;
  onUpdateMultiple: (orders: Order[]) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [artName, setArtName] = useState(group.orders[0]?.artName || "");
  const [isSaving, setIsSaving] = useState(false);

  const displayName = group.orders[0]?.artName || `@${group.customerUser}`;

  const handleSave = async () => {
    setIsSaving(true);
    const updatedOrders: Order[] = [];

    for (const order of group.orders) {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artName: artName || null }),
      });
      if (response.ok) {
        const updated = await response.json();
        updatedOrders.push(updated);
      }
    }

    if (updatedOrders.length > 0) {
      onUpdateMultiple(updatedOrders);
    }
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setArtName(group.orders[0]?.artName || "");
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between border-b pb-2">
      <div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={artName}
              onChange={(e) => setArtName(e.target.value)}
              placeholder={`@${group.customerUser}`}
              className="bg-muted px-2 py-1 rounded text-sm font-semibold w-48 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 hover:bg-green-500/20 rounded text-green-500 disabled:opacity-50"
              title="Salvar"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1 hover:bg-red-500/20 rounded text-red-500 disabled:opacity-50"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{displayName}</h3>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              title="Editar nome da arte"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {group.orders.length} pedido(s), {group.totalItems} item(ns)
        </p>
      </div>
      {group.allApproved && (
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
          Todas artes aprovadas
        </span>
      )}
    </div>
  );
}

export function OrderTable({ orders, onUpdateOrder, onUpdateMultiple, selectable, showProductionFilter, whatsappGroupId }: OrderTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedProductionDate, setSelectedProductionDate] = useState<string | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  // Filtra por data de produção se selecionada
  const filteredByDate = useMemo(() => {
    if (!showProductionFilter || !selectedProductionDate) return orders;
    return orders.filter((order) => {
      if (!order.sentToProductionAt) return false;
      const orderDate = format(new Date(order.sentToProductionAt), "yyyy-MM-dd");
      return orderDate === selectedProductionDate;
    });
  }, [orders, selectedProductionDate, showProductionFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredByDate.map((o) => o.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSendToProduction = async (orderIds: string[]) => {
    const response = await fetch("/api/orders/batch", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: orderIds, artStatus: "PRODUCTION" }),
    });

    if (response.ok) {
      const updated = await response.json();
      onUpdateMultiple(updated);
      setSelectedIds(new Set());
    }
  };

  const groupedOrders = useMemo(() => {
    const groups: Record<string, GroupedOrders> = {};

    for (const order of filteredByDate) {
      if (!groups[order.customerUser]) {
        groups[order.customerUser] = {
          customerUser: order.customerUser,
          customerName: order.customerName,
          orders: [],
          totalItems: 0,
          earliestShipping: new Date(order.shippingDate),
          allApproved: true,
        };
      }

      const group = groups[order.customerUser];
      group.orders.push(order);
      group.totalItems += order.quantity;

      const orderShippingDate = new Date(order.shippingDate);
      if (orderShippingDate < group.earliestShipping) {
        group.earliestShipping = orderShippingDate;
      }

      if (order.artStatus !== "APPROVED") {
        group.allApproved = false;
      }
    }

    return Object.values(groups).sort(
      (a, b) => a.earliestShipping.getTime() - b.earliestShipping.getTime()
    );
  }, [filteredByDate]);

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum pedido encontrado.</p>
        <p className="text-sm mt-1">
          Importe um arquivo da Shopee para comecar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {showProductionFilter && (
        <ProductionDateFilter
          orders={orders}
          selectedDate={selectedProductionDate}
          onDateChange={setSelectedProductionDate}
        />
      )}

      {selectable && (
        <BatchActions
          orders={filteredByDate}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onSendToProduction={handleSendToProduction}
          whatsappGroupId={whatsappGroupId}
        />
      )}

      {groupedOrders.map((group) => {
        const uploadBoxSize = 280;

        // Agrupa por artGroupId dentro do cliente
        const artGroups: Record<number, Order[]> = {};
        for (const order of group.orders) {
          const groupId = order.artGroupId ?? 0;
          if (!artGroups[groupId]) {
            artGroups[groupId] = [];
          }
          artGroups[groupId].push(order);
        }
        const artGroupList = Object.entries(artGroups).sort(([a], [b]) => Number(a) - Number(b));

        return (
          <div key={group.customerUser} className="space-y-4">
            <GroupHeader group={group} onUpdateMultiple={onUpdateMultiple} />

            {/* Cada artGroup em uma linha separada */}
            <div className="space-y-4">
              {artGroupList.map(([artGroupId, artGroupOrders]) => (
                <div key={artGroupId} className="flex gap-4 items-start">
                  {/* Cards do grupo de arte */}
                  <div style={{ width: "40%" }}>
                    <CustomerOrderCards
                      orders={artGroupOrders}
                      onUpdateOrder={onUpdateOrder}
                      onOpenDetails={setDetailsOrder}
                      selectable={selectable}
                      selectedIds={selectedIds}
                      onToggleSelect={toggleSelect}
                    />
                  </div>

                  {/* Upload Boxes e botão de pintura */}
                  <div className="flex flex-col gap-2 flex-shrink-0 ml-auto">
                    <div className="flex gap-2">
                      <UploadBox order={artGroupOrders[0]} type="png" onUpdateOrder={onUpdateOrder} size={uploadBoxSize} />
                      <UploadBox order={artGroupOrders[0]} type="cdr" onUpdateOrder={onUpdateOrder} size={uploadBoxSize} />
                    </div>
                    {/* Botão enviar para pintura - só aparece se tem imagem PNG */}
                    {artGroupOrders[0].artPngUrl && (
                      <SendToPaintingButton
                        orders={artGroupOrders}
                        groupId={whatsappGroupId || null}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {detailsOrder && (
        <OrderDetailsModal
          order={detailsOrder}
          onClose={() => setDetailsOrder(null)}
          onUpdateOrder={(updated) => {
            onUpdateOrder(updated);
            setDetailsOrder(updated);
          }}
        />
      )}
    </div>
  );
}
