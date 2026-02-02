"use client";

import { useState } from "react";
import { Paintbrush, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";

interface SendToPaintingButtonProps {
  orders: Order[];
  groupId: string | null;
  disabled?: boolean;
}

export function SendToPaintingButton({ orders, groupId, disabled }: SendToPaintingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSend = async () => {
    if (!groupId) {
      setErrorMessage("Selecione um grupo do WhatsApp primeiro");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    // Verifica se tem imagem
    const hasImage = orders.some((o) => o.artPngUrl);
    if (!hasImage) {
      setErrorMessage("Pedido não possui imagem da arte");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: orders.map((o) => o.id),
          groupId,
        }),
      });

      if (response.ok) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Erro ao enviar");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setErrorMessage("Erro de conexão");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Gera preview da mensagem
  const getMessagePreview = () => {
    const items = orders.map((order) => {
      const qty = order.cupQuantity ?? order.quantity;
      const desc = order.realDescription || order.productName;
      return `${qty} ${desc}`;
    });

    const uniqueIds = [...new Set(orders.map((o) => o.shopeeOrderId))];
    const lastFourDigits = uniqueIds.map((id) => id.slice(-4)).join(" / ");

    return `Pintar ${items.join(" e ")} - shopee ${lastFourDigits}`;
  };

  if (status === "success") {
    return (
      <Button size="sm" variant="outline" className="text-green-500 border-green-500" disabled>
        <Check className="h-4 w-4 mr-1" />
        Enviado!
      </Button>
    );
  }

  if (status === "error") {
    return (
      <Button size="sm" variant="outline" className="text-red-500 border-red-500" disabled>
        <AlertCircle className="h-4 w-4 mr-1" />
        {errorMessage}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSend}
      disabled={isLoading || disabled || !groupId}
      title={getMessagePreview()}
      className="text-purple-500 hover:text-purple-600 hover:border-purple-500"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <Paintbrush className="h-4 w-4 mr-1" />
          Pintura
        </>
      )}
    </Button>
  );
}
