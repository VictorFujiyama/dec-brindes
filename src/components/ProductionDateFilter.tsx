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
  const availableDates = useMemo(() => {
    const datesMap = new Map<string, { date: Date; count: number }>();

    for (const order of orders) {
      if (order.sentToProductionAt) {
        const dateObj = new Date(order.sentToProductionAt);
        // Agrupa por dia (ignora hora/minuto)
        const dateKey = format(dateObj, "yyyy-MM-dd");

        if (datesMap.has(dateKey)) {
          datesMap.get(dateKey)!.count++;
        } else {
          datesMap.set(dateKey, { date: dateObj, count: 1 });
        }
      }
    }

    // Ordena do mais recente para o mais antigo
    return Array.from(datesMap.entries())
      .sort((a, b) => b[1].date.getTime() - a[1].date.getTime())
      .map(([key, value]) => ({
        key,
        label: format(value.date, "dd/MM/yyyy (EEEE)", { locale: ptBR }),
        count: value.count,
      }));
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
        Todos ({orders.length})
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
