"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, CloudUpload, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UploadXLSProps {
  onUploadSuccess: () => void;
}

interface ProgressState {
  status: "idle" | "uploading" | "parsing" | "processing" | "done" | "error";
  message: string;
  uploadPercent?: number;
  processPercent?: number;
  processed?: number;
  total?: number;
}

export function UploadXLS({ onUploadSuccess }: UploadXLSProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({ status: "idle", message: "" });

  const handleUpload = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setProgress({ status: "uploading", message: "Enviando arquivo...", uploadPercent: 0 });

      try {
        const formData = new FormData();
        formData.append("file", file);

        // Upload com progresso real
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress({
              status: "uploading",
              message: "Enviando arquivo...",
              uploadPercent: percent
            });
          }
        };

        xhr.upload.onload = () => {
          setProgress({ status: "parsing", message: "Lendo arquivo..." });
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 3 || xhr.readyState === 4) {
            // Processa SSE
            const lines = xhr.responseText.split("\n\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.status === "parsing") {
                    setProgress({ status: "parsing", message: data.message });
                  } else if (data.status === "processing") {
                    setProgress({
                      status: "processing",
                      message: data.message,
                      processPercent: data.percent || 0,
                      processed: data.processed,
                      total: data.total
                    });
                  } else if (data.status === "done") {
                    setProgress({
                      status: "done",
                      message: data.message,
                      total: data.total
                    });
                    onUploadSuccess();
                  } else if (data.status === "error") {
                    setProgress({ status: "error", message: data.message });
                  }
                } catch {
                  // ignore parse errors
                }
              }
            }
          }
        };

        xhr.onerror = () => {
          setProgress({ status: "error", message: "Erro de conexão" });
        };

        xhr.open("POST", "/api/upload");
        xhr.send(formData);

      } catch {
        setProgress({ status: "error", message: "Erro ao fazer upload" });
      }
    },
    [onUploadSuccess]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        handleUpload(file);
      } else {
        setProgress({ status: "error", message: "Por favor, selecione um arquivo .xlsx ou .xls" });
      }
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      e.target.value = "";
    },
    [handleUpload]
  );

  const resetState = () => {
    setProgress({ status: "idle", message: "" });
    setFileName(null);
  };

  const isProcessing = ["uploading", "parsing", "processing"].includes(progress.status);

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isProcessing) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={isProcessing ? undefined : handleDrop}
        >
          {progress.status === "uploading" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CloudUpload className="h-8 w-8 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-blue-400">Enviando arquivo...</p>
                  {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
                </div>
                <span className="text-sm font-mono text-blue-400">{progress.uploadPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.uploadPercent || 0}%` }}
                />
              </div>
            </div>
          )}

          {progress.status === "parsing" && (
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 animate-pulse text-purple-500" />
              <div>
                <p className="font-medium text-purple-400">Lendo arquivo...</p>
                {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
              </div>
            </div>
          )}

          {progress.status === "processing" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-400">Salvando no banco...</p>
                  <p className="text-xs text-muted-foreground">
                    {progress.processed} de {progress.total} pedidos
                  </p>
                </div>
                <span className="text-sm font-mono text-yellow-400">{progress.processPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.processPercent || 0}%` }}
                />
              </div>
            </div>
          )}

          {progress.status === "done" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-500">✓</span>
                </div>
                <div>
                  <p className="font-medium text-green-400">{progress.message}</p>
                  <p className="text-xs text-muted-foreground">{progress.total} pedidos processados</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={resetState}>
                Novo Upload
              </Button>
            </div>
          )}

          {progress.status === "error" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-500">✕</span>
                </div>
                <p className="font-medium text-red-400">{progress.message}</p>
              </div>
              <Button variant="outline" size="sm" onClick={resetState}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {progress.status === "idle" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium">Importar Pedidos</p>
                  <p className="text-xs text-muted-foreground">
                    Arraste o arquivo .xlsx da Shopee ou clique para selecionar
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
