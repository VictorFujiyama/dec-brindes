"use client";

import { Badge } from "@/components/ui/badge";
import { ArtStatus } from "@/types/order";

interface StatusBadgeProps {
  status: ArtStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "SHIPPED") {
    return (
      <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
        Enviado
      </Badge>
    );
  }

  if (status === "PRODUCTION") {
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
        Produção
      </Badge>
    );
  }

  if (status === "APPROVED") {
    return (
      <Badge className="bg-green-500 hover:bg-green-600 text-white">
        Aprovado
      </Badge>
    );
  }

  return (
    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
      Pendente
    </Badge>
  );
}

interface DaysUntilBadgeProps {
  shippingDate: Date;
}

export function DaysUntilBadge({ shippingDate }: DaysUntilBadgeProps) {
  const now = new Date();
  const shipping = new Date(shippingDate);
  const diffTime = shipping.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <Badge variant="destructive">
        Atrasado ({Math.abs(diffDays)}d)
      </Badge>
    );
  }

  if (diffDays <= 2) {
    return (
      <Badge variant="destructive">
        {diffDays}d para envio
      </Badge>
    );
  }

  if (diffDays <= 5) {
    return (
      <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
        {diffDays}d para envio
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      {diffDays}d para envio
    </Badge>
  );
}
