"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Copy,
  Check,
  Upload,
  Download,
  Image,
  FileIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, DaysUntilBadge } from "./StatusBadge";
import { Order } from "@/types/order";

interface OrderRowProps {
  order: Order;
  onUpdateOrder: (order: Order) => void;
  compact?: boolean;
  onOpenDetails: (order: Order) => void;
}

export function OrderRow({ order, onUpdateOrder, compact, onOpenDetails }: OrderRowProps) {
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const pngInputRef = useRef<HTMLInputElement>(null);
  const cdrInputRef = useRef<HTMLInputElement>(null);

  const copyOrderId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.shopeeOrderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (file: File, type: "png" | "cdr") => {
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

  const handleDeleteFile = async (type: "png" | "cdr") => {
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

  const statusBorderClass =
    order.artStatus === "PRODUCTION"
      ? "border-l-4 border-l-blue-500"
      : order.artStatus === "APPROVED"
      ? "border-l-4 border-l-green-500"
      : "border-l-4 border-l-yellow-500";

  return (
    <div className={`flex gap-4 p-3 bg-card rounded-lg ${statusBorderClass} hover:bg-muted/50 transition-colors`}>
      {/* Info do Pedido */}
      <div
        className={`flex-1 min-w-0 cursor-pointer ${compact ? '' : 'space-y-2'}`}
        onClick={() => onOpenDetails(order)}
      >
        {compact ? (
          // Layout compacto - uma linha
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="font-mono font-bold text-sm">{order.shopeeOrderId}</span>
              <button
                onClick={copyOrderId}
                className="p-0.5 hover:bg-muted rounded"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </div>
            <span className="text-sm truncate max-w-[200px]" title={order.productName}>
              {order.productName}
            </span>
            <span className="text-sm text-muted-foreground">x{order.quantity}</span>
            <StatusBadge status={order.artStatus} />
            <DaysUntilBadge shippingDate={order.shippingDate} />
            {order.customerNote && (
              <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
            {order.internalNote && (
              <span className="text-xs text-purple-400 truncate max-w-[150px]" title={order.internalNote}>
                {order.internalNote}
              </span>
            )}
          </div>
        ) : (
          // Layout completo
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm">{order.shopeeOrderId}</span>
                <button
                  onClick={copyOrderId}
                  className="p-1 hover:bg-muted rounded"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <StatusBadge status={order.artStatus} />
            </div>
            <p className="text-sm font-medium truncate" title={order.productName}>
              {order.productName}
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Qtd: {order.quantity}</span>
              {order.variation && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[120px]">
                  {order.variation}
                </span>
              )}
              <DaysUntilBadge shippingDate={order.shippingDate} />
              {order.customerNote && (
                <MessageSquare className="h-4 w-4 text-blue-500" />
              )}
            </div>
            {order.internalNote && (
              <p className="text-xs text-purple-400 truncate" title={order.internalNote}>
                {order.internalNote}
              </p>
            )}
            {order.artStatus === "PRODUCTION" && order.sentToProductionAt && (
              <p className="text-xs text-blue-400">
                Enviado: {format(new Date(order.sentToProductionAt), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </>
        )}
      </div>

      {/* Área de Upload */}
      <div className={`flex-shrink-0 ${compact ? 'w-32' : 'w-48'} flex flex-col gap-2`}>
        {/* PNG */}
        {order.artPngUrl ? (
          <div className="relative group">
            <img
              src={order.artPngUrl}
              alt="Arte"
              className={`w-full ${compact ? 'h-16' : 'h-24'} object-contain rounded bg-muted`}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
              <a href={order.artPngUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white hover:text-white">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-400 hover:text-red-400"
                onClick={() => handleDeleteFile("png")}
                disabled={isUploading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => pngInputRef.current?.click()}
            className={`border-2 border-dashed border-muted-foreground/30 rounded ${compact ? 'p-2' : 'p-3'} text-center cursor-pointer hover:border-muted-foreground/50 transition-colors`}
          >
            <Image className={`${compact ? 'h-4 w-4' : 'h-6 w-6'} mx-auto text-muted-foreground`} />
            <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground mt-1`}>
              {isUploading ? "..." : "PNG"}
            </p>
          </div>
        )}
        <input
          ref={pngInputRef}
          type="file"
          accept=".png,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, "png");
            e.target.value = "";
          }}
        />

        {/* CDR */}
        {order.artCdrUrl ? (
          <div className="flex gap-1">
            <a href={order.artCdrUrl} download className="flex-1">
              <Button variant="outline" size="sm" className={`w-full ${compact ? 'h-7 text-[10px]' : 'h-8 text-xs'}`}>
                <FileIcon className="h-3 w-3 mr-1" />
                CDR
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteFile("cdr")}
              disabled={isUploading}
              className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} p-0 text-red-500`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={`w-full ${compact ? 'h-7 text-[10px]' : 'h-8 text-xs'}`}
            onClick={() => cdrInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-3 w-3 mr-1" />
            {isUploading ? "..." : "CDR"}
          </Button>
        )}
        <input
          ref={cdrInputRef}
          type="file"
          accept=".cdr"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, "cdr");
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
