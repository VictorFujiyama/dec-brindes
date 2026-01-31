"use client";

import { useState } from "react";
import { Search, Calendar, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  dailyQueueCount?: number;
  onGenerateDailyQueue?: (count: number) => Promise<void>;
  onClearDailyQueue?: () => Promise<void>;
}

export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  dailyQueueCount = 0,
  onGenerateDailyQueue,
  onClearDailyQueue,
}: FilterBarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [orderCount, setOrderCount] = useState("15");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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
              ? `${dailyQueueCount} pedido(s) na fila do dia`
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
