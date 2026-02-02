// Polyfill fetch antes de importar whatsapp-web.js
import nodeFetch from "node-fetch";
if (!globalThis.fetch) {
  // @ts-expect-error - polyfill
  globalThis.fetch = nodeFetch;
}

import { Client, LocalAuth } from "whatsapp-web.js";
import QRCode from "qrcode";

// Usa globalThis para persistir o cliente entre hot reloads do Next.js
const globalForWhatsApp = globalThis as unknown as {
  whatsappClient: Client | null;
  whatsappQRCode: string | null;
  whatsappIsReady: boolean;
  whatsappIsInitializing: boolean;
};

// Singleton do cliente WhatsApp
let client: Client | null = globalForWhatsApp.whatsappClient || null;
let qrCodeData: string | null = globalForWhatsApp.whatsappQRCode || null;
let isReady = globalForWhatsApp.whatsappIsReady || false;
let isInitializing = globalForWhatsApp.whatsappIsInitializing || false;

// Sincroniza com globalThis
function syncGlobal() {
  globalForWhatsApp.whatsappClient = client;
  globalForWhatsApp.whatsappQRCode = qrCodeData;
  globalForWhatsApp.whatsappIsReady = isReady;
  globalForWhatsApp.whatsappIsInitializing = isInitializing;
}

export function getWhatsAppClient(): Client {
  if (!client) {
    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: ".wwebjs_auth",
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      },
    });

    client.on("qr", async (qr) => {
      console.log("QR Code recebido");
      qrCodeData = await QRCode.toDataURL(qr);
      syncGlobal();
    });

    client.on("ready", () => {
      console.log("WhatsApp conectado!");
      isReady = true;
      qrCodeData = null;
      syncGlobal();
    });

    client.on("authenticated", () => {
      console.log("WhatsApp autenticado!");
      syncGlobal();
    });

    client.on("auth_failure", (msg) => {
      console.error("Falha na autenticação:", msg);
      isReady = false;
      syncGlobal();
    });

    client.on("disconnected", (reason) => {
      console.log("WhatsApp desconectado:", reason);
      isReady = false;
      client = null;
      syncGlobal();
    });
  }

  return client;
}

export async function initializeWhatsApp(): Promise<void> {
  if (isInitializing || isReady) return;

  isInitializing = true;
  syncGlobal();
  console.log("Iniciando WhatsApp...");
  const whatsapp = getWhatsAppClient();

  try {
    await whatsapp.initialize();
    console.log("WhatsApp inicializado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar WhatsApp:", error);
    isInitializing = false;
    client = null;
    syncGlobal();
    throw error;
  }
}

export function getQRCode(): string | null {
  return globalForWhatsApp.whatsappQRCode || qrCodeData;
}

export function getStatus(): { connected: boolean; hasQR: boolean } {
  const connected = globalForWhatsApp.whatsappIsReady || isReady;
  const hasQR = !!(globalForWhatsApp.whatsappQRCode || qrCodeData);
  return { connected, hasQR };
}

export interface SendMessageParams {
  to: string;
  message: string;
  imageUrl?: string;
}

export async function sendMessage(params: SendMessageParams): Promise<boolean> {
  const { to, message, imageUrl } = params;

  const activeClient = globalForWhatsApp.whatsappClient || client;
  const ready = globalForWhatsApp.whatsappIsReady || isReady;

  if (!ready || !activeClient) {
    throw new Error("WhatsApp não está conectado");
  }

  try {
    if (imageUrl) {
      // Baixa a imagem
      const fetchFn = globalThis.fetch || nodeFetch;
      const response = await fetchFn(imageUrl);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      // Envia via pupPage usando WWebJS.sendMessage
      const pupPage = activeClient.pupPage;
      if (!pupPage) throw new Error("Puppeteer page not available");

      const result = await pupPage.evaluate(
        async (chatId: string, base64Data: string, mimetype: string, caption: string) => {
          try {
            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            if (!chat) return { error: "Chat not found" };

            const msg = await window.WWebJS.sendMessage(chat, "", {
              media: {
                mimetype: mimetype,
                data: base64Data,
                filename: "arte.png"
              },
              caption: caption
            });

            return { success: true, msgId: msg?.id?._serialized };
          } catch (e: unknown) {
            const error = e as Error;
            return { error: error.message || String(e) };
          }
        },
        to,
        base64,
        "image/png",
        message || ""
      );

      if (result.error) throw new Error(result.error);
    } else {
      await activeClient.sendMessage(to, message);
    }

    return true;
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
}

export async function getGroups(): Promise<Array<{ id: string; name: string }>> {
  const activeClient = globalForWhatsApp.whatsappClient || client;
  const ready = globalForWhatsApp.whatsappIsReady || isReady;

  if (!ready || !activeClient) {
    throw new Error("WhatsApp não está conectado");
  }

  const chats = await activeClient.getChats();
  const groups = chats
    .filter((chat) => chat.isGroup)
    .map((chat) => ({
      id: chat.id._serialized,
      name: chat.name,
    }));

  return groups;
}

// Formata a mensagem para pintura
export function formatPaintingMessage(orders: Array<{
  cupQuantity: number | null;
  realDescription: string | null;
  quantity: number;
  productName: string;
  shopeeOrderId: string;
}>): string {
  const items = orders.map((order) => {
    const qty = order.cupQuantity ?? order.quantity;
    const desc = order.realDescription || order.productName;
    return `${qty} ${desc}`;
  });

  const uniqueIds = [...new Set(orders.map((o) => o.shopeeOrderId))];
  const lastFourDigits = uniqueIds.map((id) => id.slice(-4)).join(" / ");

  return `Pintar ${items.join(" e ")} - shopee ${lastFourDigits}`;
}
