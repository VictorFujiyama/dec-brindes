"use client";

import { useState, useEffect } from "react";
import { MessageCircle, RefreshCw, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WhatsAppStatus {
  connected: boolean;
  hasQR: boolean;
  qrCode: string | null;
}

interface Group {
  id: string;
  name: string;
}

interface WhatsAppConnectionProps {
  onGroupSelect?: (groupId: string) => void;
  selectedGroupId?: string | null;
}

export function WhatsAppConnection({ onGroupSelect, selectedGroupId }: WhatsAppConnectionProps) {
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    hasQR: false,
    qrCode: null,
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/whatsapp/status");
      const data = await response.json();
      setStatus(data);

      if (data.connected) {
        fetchGroups();
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    }
  };

  const initWhatsApp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/whatsapp/init");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Erro ao inicializar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/whatsapp/groups");
      const data = await response.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (isOpen && !status.connected) {
      const interval = setInterval(checkStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, status.connected]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={status.connected ? "text-green-500 border-green-500" : ""}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp {status.connected ? "(Conectado)" : "(Desconectado)"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conexão WhatsApp</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {status.connected ? (
              <>
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-green-500 font-medium">Conectado</span>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-red-500" />
                <span className="text-red-500 font-medium">Desconectado</span>
              </>
            )}
          </div>

          {/* QR Code ou Botão de Conectar */}
          {!status.connected && (
            <div className="space-y-4">
              {status.qrCode ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Escaneie o QR Code com o WhatsApp do celular dedicado
                  </p>
                  <img
                    src={status.qrCode}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 border rounded-lg"
                  />
                  <Button variant="outline" size="sm" onClick={checkStatus}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={initWhatsApp}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Conectar WhatsApp
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Lista de Grupos */}
          {status.connected && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Grupo para enviar mensagens de pintura:
              </label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum grupo encontrado
                  </p>
                ) : (
                  groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => onGroupSelect?.(group.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedGroupId === group.id
                          ? "border-green-500 bg-green-500/10"
                          : "border-muted hover:border-foreground/30"
                      }`}
                    >
                      <span className="text-sm">{group.name}</span>
                    </button>
                  ))
                )}
              </div>
              <Button variant="outline" size="sm" onClick={fetchGroups}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar grupos
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
