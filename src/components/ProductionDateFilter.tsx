"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Order } from "@/types/order";

interface ProductionDateFilterProps {
  orders: Order[];
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
}

export function ProductionDateFilter({
  orders,
  selectedDate,
  onDateChange,
}: ProductionDateFilterProps) {
  // Conta grupos de arte (para cobrança)
  // Se artGroupId é null, cada pedido é uma arte separada
  // Se artGroupId tem valor, pedidos com mesmo artGroupId contam como 1
  const getArtGroupKey = (order: Order) => {
    return order.artGroupId != null
      ? `${order.customerUser}_group_${order.artGroupId}`
      : `${order.customerUser}_order_${order.id}`;
  };

  const availableDates = useMemo(() => {
    const datesMap = new Map<string, { date: Date; artGroups: Set<string> }>();

    for (const order of orders) {
      if (order.sentToProductionAt) {
        const dateObj = new Date(order.sentToProductionAt);
        // Agrupa por dia (ignora hora/minuto)
        const dateKey = format(dateObj, "yyyy-MM-dd");
        const artGroupKey = getArtGroupKey(order);

        if (datesMap.has(dateKey)) {
          datesMap.get(dateKey)!.artGroups.add(artGroupKey);
        } else {
          datesMap.set(dateKey, { date: dateObj, artGroups: new Set([artGroupKey]) });
        }
      }
    }

    // Ordena do mais antigo para o mais recente
    return Array.from(datesMap.entries())
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([key, value]) => ({
        key,
        label: format(value.date, "dd/MM/yyyy (EEEE)", { locale: ptBR }),
        count: value.artGroups.size,
      }));
  }, [orders]);

  // Conta total de grupos de arte únicos
  const totalArtGroups = useMemo(() => {
    const uniqueGroups = new Set(orders.map(o => getArtGroupKey(o)));
    return uniqueGroups.size;
  }, [orders]);

  if (availableDates.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onDateChange(null)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          selectedDate === null
            ? "bg-blue-600 text-white"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        Todos ({totalArtGroups})
      </button>
      {availableDates.map((date) => (
        <button
          key={date.key}
          onClick={() => onDateChange(date.key)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedDate === date.key
              ? "bg-blue-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {date.label} ({date.count})
        </button>
      ))}
    </div>
  );
}
