"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Package,
  Copy,
  Check,
  Upload,
  Download,
  Image,
  FileIcon,
  Trash2,
  Send,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, DaysUntilBadge } from "./StatusBadge";
import { Order } from "@/types/order";

interface OrderGroupProps {
  orders: Order[];
  onUpdateOrder: (order: Order) => void;
  onOpenDetails: (order: Order) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

function MiniCard({
  order,
  index,
  total,
  isHovered,
  onHover,
  onOpenDetails,
}: {
  order: Order;
  index: number;
  total: number;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  onOpenDetails: (order: Order) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyOrderId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.shopeeOrderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBorderClass =
    order.artStatus === "SHIPPED"
      ? "border-l-4 border-l-purple-500 bg-purple-500/10"
      : order.artStatus === "PRODUCTION"
      ? "border-l-4 border-l-blue-500 bg-blue-500/10"
      : order.artStatus === "APPROVED"
      ? "border-l-4 border-l-green-500 bg-green-500/10"
      : "border-l-4 border-l-yellow-500 bg-yellow-500/10";

  // Offset para empilhamento
  const offset = index * 8;
  const zIndex = isHovered ? 50 : total - index;

  return (
    <Card
      className={`absolute cursor-pointer transition-all duration-200 ${statusBorderClass} ${
        isHovered ? "shadow-xl scale-[1.02]" : "shadow-md"
      }`}
      style={{
        top: offset,
        left: offset,
        right: offset,
        zIndex,
      }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onOpenDetails(order)}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xs font-medium line-clamp-1">
            {order.productName}
          </CardTitle>
          <StatusBadge status={order.artStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pb-3 px-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs">{order.shopeeOrderId}</span>
          <button onClick={copyOrderId} className="p-0.5 hover:bg-muted rounded">
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Package className="h-3 w-3" />
          <span>Qtd: {order.quantity}</span>
          <DaysUntilBadge shippingDate={order.shippingDate} />
          {order.customerNote && <MessageSquare className="h-3 w-3 text-blue-500" />}
        </div>
      </CardContent>
    </Card>
  );
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

  // Se urgente, usa vermelho independente do status
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

function UploadBox({
  order,
  type,
  onUpdateOrder,
  size,
}: {
  order: Order;
  type: "png" | "cdr";
  onUpdateOrder: (order: Order) => void;
  size: number;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileUrl = type === "png" ? order.artPngUrl : order.artCdrUrl;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fileUrl) return;

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extrai o nome do arquivo da URL e decodifica
      const encodedName = fileUrl.split("/").pop() || `arte.${type}`;
      const fileName = decodeURIComponent(encodedName);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar:", err);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch(`/api/orders/${order.id}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdateOrder(updated);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUploading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/upload?type=${type}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdateOrder(updated);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-shrink-0" style={{ width: size, height: size }}>
      {fileUrl ? (
        <div className="relative w-full h-full group">
          {type === "png" ? (
            <img
              src={fileUrl}
              alt="Arte"
              className="w-full h-full object-contain rounded-lg bg-muted border-2 border-green-500/50"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-white border-2 border-[#00a651] flex items-center justify-center">
              <img src="/corel-logo.png" alt="CorelDRAW" className="w-24 h-24 object-contain" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-400 hover:text-red-400 hover:bg-red-500/20"
              onClick={handleDeleteFile}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-full h-full border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors"
        >
          {type === "png" ? (
            <Image className="h-8 w-8 text-muted-foreground mb-2" />
          ) : (
            <FileIcon className="h-8 w-8 text-muted-foreground mb-2" />
          )}
          <span className="text-sm text-muted-foreground font-medium">
            {isUploading ? "..." : type.toUpperCase()}
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={type === "png" ? ".png,image/png" : ".cdr"}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function OrderGroup({ orders, onUpdateOrder, onOpenDetails, selectable, selectedIds, onToggleSelect }: OrderGroupProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Pedido atual (para upload) - o que está em hover ou o primeiro
  const activeOrder = hoveredIndex !== null ? orders[hoveredIndex] : orders[0];
  const isSingleOrder = orders.length === 1;

  // Tamanho dos boxes de upload (quadrados)
  const uploadBoxSize = 280;

  return (
    <div className="flex gap-4 items-start">
      {/* Cards */}
      <div className="relative" style={{ width: "40%", minHeight: uploadBoxSize }}>
        {orders.map((order, index) => {
          const isHovered = hoveredIndex === index;
          // Primeiro card atrás, último na frente. Hovered sempre no topo.
          const zIndex = isHovered ? 50 : index + 1;
          // Cada card começa mais à direita: 0%, 25%, 50%, 75%...
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

      {/* Upload Boxes - à direita */}
      <div className="flex gap-2 flex-shrink-0 ml-auto">
        <UploadBox order={activeOrder} type="png" onUpdateOrder={onUpdateOrder} size={uploadBoxSize} />
        <UploadBox order={activeOrder} type="cdr" onUpdateOrder={onUpdateOrder} size={uploadBoxSize} />
      </div>
    </div>
  );
}
