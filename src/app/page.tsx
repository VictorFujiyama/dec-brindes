"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Package, CheckCircle, Clock, RefreshCw, Factory, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadXLS } from "@/components/UploadXLS";
import { FilterBar } from "@/components/FilterBar";
import { OrderTable } from "@/components/OrderTable";
import { Order } from "@/types/order";

export default function Dashboard() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");

  const fetchOrders = useCallback(async (searchTerm?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();
      setAllOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateOrderLocal = useCallback((updatedOrder: Order) => {
    setAllOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  }, []);

  const updateMultipleOrdersLocal = useCallback((updatedOrders: Order[]) => {
    setAllOrders(prev => prev.map(o => {
      const updated = updatedOrders.find(u => u.id === o.id);
      return updated || o;
    }));
  }, []);

  const generateDailyQueue = useCallback(async (count: number) => {
    try {
      const response = await fetch("/api/orders/daily-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      if (response.ok) {
        await fetchOrders(search || undefined);
      }
    } catch (error) {
      console.error("Error generating daily queue:", error);
    }
  }, [fetchOrders, search]);

  const clearDailyQueue = useCallback(async () => {
    try {
      const response = await fetch("/api/orders/daily-queue", {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchOrders(search || undefined);
      }
    } catch (error) {
      console.error("Error clearing daily queue:", error);
    }
  }, [fetchOrders, search]);

  // Carrega inicial
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Busca com debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchOrders(search || undefined);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, fetchOrders]);

  // Filtra localmente por status (instantâneo)
  const filteredOrders = useMemo(() => {
    if (status === "ALL") return allOrders;
    if (status === "DAILY_QUEUE") return allOrders.filter(o => o.inDailyQueue);
    return allOrders.filter(o => o.artStatus === status);
  }, [allOrders, status]);

  // Stats sempre do total
  const stats = useMemo(() => ({
    total: allOrders.length,
    pending: allOrders.filter((o) => o.artStatus === "PENDING").length,
    approved: allOrders.filter((o) => o.artStatus === "APPROVED").length,
    production: allOrders.filter((o) => o.artStatus === "PRODUCTION").length,
    shipped: allOrders.filter((o) => o.artStatus === "SHIPPED").length,
    dailyQueue: allOrders.filter((o) => o.inDailyQueue).length,
  }), [allOrders]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">DC Brindes</h1>
              <p className="text-sm text-muted-foreground">
                Gerenciador de Pedidos Shopee
              </p>
            </div>
            <Button onClick={() => fetchOrders(search || undefined)} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <UploadXLS onUploadSuccess={() => fetchOrders()} />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="p-2 bg-slate-500/20 rounded-full">
                <Package className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="p-2 bg-yellow-500/20 rounded-full">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="p-2 bg-green-500/20 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="p-2 bg-blue-500/20 rounded-full">
                <Factory className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.production}</p>
                <p className="text-xs text-muted-foreground">Producao</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="p-2 bg-purple-500/20 rounded-full">
                <Truck className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.shipped}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
              dailyQueueCount={stats.dailyQueue}
              onGenerateDailyQueue={generateDailyQueue}
              onClearDailyQueue={clearDailyQueue}
            />

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <OrderTable
                orders={filteredOrders}
                onUpdateOrder={updateOrderLocal}
                onUpdateMultiple={updateMultipleOrdersLocal}
                selectable={status === "APPROVED"}
                showProductionFilter={status === "PRODUCTION"}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
