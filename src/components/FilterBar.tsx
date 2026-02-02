"use client";

import { useState } from "react";
import { Search, Calendar, Plus, Trash2, Send, Loader2, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order } from "@/types/order";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  dailyQueueCount?: number;
  dailyQueueOrders?: Order[];
  whatsappGroupId?: string | null;
  onGenerateDailyQueue?: (count: number) => Promise<void>;
  onClearDailyQueue?: () => Promise<void>;
}

// Formata a mensagem para WhatsApp (agrupado igual às notas do PDF)
function formatDailyQueueMessage(orders: Order[]): string {
  // Agrupa por customerUser + artGroupId
  const groups: Record<string, Order[]> = {};
  for (const order of orders) {
    const key = `${order.customerUser}_${order.artGroupId ?? 0}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(order);
  }

  // Converte para array com metadados para ordenação
  const orderGroups = Object.values(groups).map((groupOrders) => {
    const earliestShipping = Math.min(...groupOrders.map(o => new Date(o.shippingDate).getTime()));
    const isUrgent = groupOrders.some(o => o.isUrgent);
    const artName = groupOrders[0].artName || `@${groupOrders[0].customerUser}`;
    const shopeeIds = [...new Set(groupOrders.map(o => o.shopeeOrderId))];

    return {
      orders: groupOrders,
      artName,
      shopeeIds,
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

  // Ordena igual ao PDF
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

  // Formata as linhas: "ID1 / ID2 - Nome" ou "ID - Nome"
  const lines = orderGroups.map(group => {
    const idsStr = group.shopeeIds.join(" / ");
    return `${idsStr} - ${group.artName}`;
  });

  return `*Pedidos hoje*\n\n${lines.join("\n")}\n\n*Fazer de cima para baixo*`;
}

export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  dailyQueueCount = 0,
  dailyQueueOrders = [],
  whatsappGroupId,
  onGenerateDailyQueue,
  onClearDailyQueue,
}: FilterBarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [orderCount, setOrderCount] = useState("15");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<"idle" | "success" | "error">("idle");
  const [whatsAppError, setWhatsAppError] = useState("");

  // Conta grupos de arte (por customerUser + artGroupId)
  const artGroupCount = (() => {
    const groups = new Set<string>();
    for (const order of dailyQueueOrders) {
      const key = `${order.customerUser}_${order.artGroupId ?? 0}`;
      groups.add(key);
    }
    return groups.size;
  })();

  const handleSendWhatsApp = async () => {
    if (!whatsappGroupId || dailyQueueOrders.length === 0) return;

    setIsSendingWhatsApp(true);
    setWhatsAppStatus("idle");
    setWhatsAppError("");

    try {
      const message = formatDailyQueueMessage(dailyQueueOrders);

      const response = await fetch("/api/whatsapp/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: whatsappGroupId,
          message,
        }),
      });

      if (response.ok) {
        setWhatsAppStatus("success");
        setTimeout(() => setWhatsAppStatus("idle"), 3000);
      } else {
        const data = await response.json();
        setWhatsAppError(data.error || "Erro ao enviar");
        setWhatsAppStatus("error");
        setTimeout(() => setWhatsAppStatus("idle"), 3000);
      }
    } catch {
      setWhatsAppError("Erro de conexão");
      setWhatsAppStatus("error");
      setTimeout(() => setWhatsAppStatus("idle"), 3000);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const tabs = [
    { value: "ALL", label: "Todos" },
    { value: "PENDING", label: "Pendentes" },
    { value: "APPROVED", label: "Aprovados" },
    { value: "PRODUCTION", label: "Produção" },
    { value: "SHIPPED", label: "Enviados" },
  ];

  const handleGenerate = async () => {
    const count = parseInt(orderCount);
    if (count > 0 && onGenerateDailyQueue) {
      setIsGenerating(true);
      await onGenerateDailyQueue(count);
      setIsGenerating(false);
      setIsDialogOpen(false);
      onStatusChange("DAILY_QUEUE");
    }
  };

  const handleClear = async () => {
    if (onClearDailyQueue) {
      setIsClearing(true);
      await onClearDailyQueue();
      setIsClearing(false);
      setIsClearDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-between">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onStatusChange(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onStatusChange("DAILY_QUEUE")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            status === "DAILY_QUEUE"
              ? "bg-orange-500 text-white"
              : "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Pedidos do Dia
          {dailyQueueCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              status === "DAILY_QUEUE" ? "bg-white/20" : "bg-orange-500 text-white"
            }`}>
              {dailyQueueCount}
            </span>
          )}
        </button>
      </div>

      {status === "DAILY_QUEUE" && (
        <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <span className="text-sm text-orange-500 font-medium">
            {dailyQueueCount > 0
              ? `${artGroupCount} arte(s) · ${dailyQueueCount} pedido(s)`
              : "Nenhum pedido na fila do dia"}
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="text-orange-500 border-orange-500/50 hover:bg-orange-500/20"
            >
              <Plus className="h-4 w-4 mr-1" />
              Gerar Pedidos
            </Button>
            {dailyQueueCount > 0 && whatsappGroupId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendWhatsApp}
                disabled={isSendingWhatsApp || whatsAppStatus !== "idle"}
                className={
                  whatsAppStatus === "success"
                    ? "text-green-500 border-green-500/50"
                    : whatsAppStatus === "error"
                    ? "text-red-500 border-red-500/50"
                    : "text-green-600 border-green-500/50 hover:bg-green-500/10"
                }
                title={formatDailyQueueMessage(dailyQueueOrders)}
              >
                {isSendingWhatsApp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Enviando...
                  </>
                ) : whatsAppStatus === "success" ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Enviado!
                  </>
                ) : whatsAppStatus === "error" ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {whatsAppError}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    WhatsApp
                  </>
                )}
              </Button>
            )}
            {dailyQueueCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearDialogOpen(true)}
                className="text-red-500 border-red-500/50 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      )}

      {status !== "DAILY_QUEUE" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome da arte, ID, cliente ou produto..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerar Pedidos do Dia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quantos pedidos deseja separar para hoje? Os pedidos <strong>urgentes</strong> serão priorizados, seguidos pelos <strong>mais antigos</strong>.
            </p>
            <div>
              <label className="text-sm font-medium">Quantidade de pedidos:</label>
              <Input
                type="number"
                min="1"
                value={orderCount}
                onChange={(e) => setOrderCount(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !orderCount || parseInt(orderCount) < 1}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isGenerating ? "Gerando..." : "Gerar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Limpar Pedidos do Dia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja remover todos os <strong>{dailyQueueCount} pedido(s)</strong> da fila do dia?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleClear}
                disabled={isClearing}
                variant="destructive"
              >
                {isClearing ? "Limpando..." : "Limpar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
