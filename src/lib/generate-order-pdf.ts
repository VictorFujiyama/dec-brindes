import { Order } from "@/types/order";

function formatDate(date: Date): { day: string; month: string; year: string } {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return { day, month, year };
}

function generateOrderNote(order: Order, dateInfo: { day: string; month: string; year: string }): string {
  const description = order.internalNote ||
    `${order.productName}${order.variation ? ` - ${order.variation}` : ""}`;

  const descriptionLines = description.split("\n").slice(0, 12);

  return `
    <div class="note">
      <!-- HEADER -->
      <div class="header">
        <div class="header-left">
          <img src="/dec-brindes-logo.png" alt="D&C Brindes" class="logo" />
          <div class="header-text">
            <div class="title">COPOS PERSONALIZADOS</div>
            <div class="email">dc_brindes@yahoo.com.br</div>
          </div>
        </div>
        <div class="header-right">PEDIDO</div>
      </div>

      <!-- BODY -->
      <div class="body">
        <!-- Cliente -->
        <div class="row">
          <span class="label">Cliente</span>
          <span class="value-underline">${order.artName || ""}</span>
        </div>

        <!-- Comprador + ID -->
        <div class="row">
          <span class="label">comprador</span>
          <span class="value-underline">${order.shopeeOrderId}</span>
        </div>

        <!-- TABELA -->
        <div class="table-container">
          <div class="table-header">
            <div class="th-quant">QUANT.</div>
            <div class="th-desc">DESCRIÇÃO</div>
          </div>
          <div class="table-body">
            <!-- Linhas fixas de fundo -->
            <div class="table-lines">
              ${Array(15).fill(0).map((_, i) => `<div class="table-line" style="top: ${i * 7}mm;"></div>`).join("")}
            </div>
            <div class="table-line-vertical"></div>
            <!-- Conteúdo -->
            <div class="table-content">
              <div class="table-row">
                <div class="td-quant">${order.quantity}</div>
                <div class="td-desc">${description.replace(/\n/g, '<br/>')}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data -->
        <div class="footer-row">
          <span class="label">Data</span>
          <span class="date-num">${dateInfo.day}</span>
          <span class="date-sep">/</span>
          <span class="date-num">${dateInfo.month}</span>
          <span class="date-sep">/</span>
          <span class="date-num">${dateInfo.year}</span>
        </div>

        <!-- Obs -->
        <div class="obs-row">
          <span class="label">Obs.:</span>
          <span class="obs-value">${order.internalNote || ""}</span>
        </div>
        <div class="obs-line"></div>

        <!-- Assinaturas -->
        <div class="signatures">
          <div class="sig-left">
            <span class="cliente-name">@${order.customerUser}</span>
            <div class="sig-line"></div>
            <span>Cliente</span>
          </div>
          <div class="sig-right">
            <span class="vendedor-name">Victor</span>
            <div class="sig-line"></div>
            <span class="vendedor-label">Vendedor</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function generateOrdersPDF(orders: Order[]): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const dateInfo = formatDate(new Date());

  const pages: Order[][] = [];
  for (let i = 0; i < orders.length; i += 2) {
    pages.push(orders.slice(i, i + 2));
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Notas de Pedido</title>
      <style>
        @page {
          size: landscape;
          margin: 5mm;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
        }

        .page {
          width: 287mm;
          height: 200mm;
          display: flex;
          justify-content: center;
          gap: 6mm;
          page-break-after: always;
          padding: 2mm;
        }

        .page:last-child {
          page-break-after: auto;
        }

        .note {
          width: 140mm;
          height: 196mm;
          border: 2px solid black;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid black;
          padding: 3mm;
          height: 20mm;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 3mm;
        }

        .logo {
          height: 14mm;
          width: auto;
        }

        .header-text {
          display: flex;
          flex-direction: column;
        }

        .title {
          font-size: 15px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }

        .email {
          font-size: 11px;
          margin-top: 1mm;
        }

        .header-right {
          font-size: 28px;
          font-weight: bold;
          padding-right: 5mm;
        }

        /* BODY */
        .body {
          flex: 1;
          padding: 3mm;
          display: flex;
          flex-direction: column;
        }

        .row {
          display: flex;
          align-items: baseline;
          margin-bottom: 1mm;
          min-height: 5mm;
        }

        .row-right {
          justify-content: flex-end;
        }

        .label {
          font-size: 14px;
          margin-right: 2mm;
        }

        .label-small {
          font-size: 14px;
          margin-left: 3mm;
          margin-right: 1mm;
        }

        .value-underline {
          flex: 1;
          font-size: 21px;
          font-weight: bold;
          border-bottom: 1px solid black;
          padding-bottom: 1px;
        }


        /* TABLE */
        .table-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-top: 1mm;
          border: 1px solid black;
        }

        .table-header {
          display: flex;
          background: black;
          color: white;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
        }

        .th-quant {
          width: 18mm;
          padding: 2mm 1mm;
          border-right: 1px solid white;
        }

        .th-desc {
          flex: 1;
          padding: 2mm 1mm;
        }

        .table-body {
          flex: 1;
          position: relative;
          min-height: 105mm;
        }

        .table-lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .table-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 0;
          border-bottom: 1px solid black;
        }

        .table-line-vertical {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 18mm;
          width: 0;
          border-right: 1px solid black;
        }

        .table-content {
          position: relative;
          z-index: 1;
          display: flex;
        }

        .table-row {
          display: flex;
          width: 100%;
        }

        .td-quant {
          width: 18mm;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          padding: 1mm;
        }

        .td-desc {
          flex: 1;
          font-size: 22px;
          font-weight: bold;
          padding: 1mm 2mm;
          line-height: 7mm;
        }

        /* FOOTER */
        .footer-row {
          display: flex;
          align-items: center;
          margin-top: 2mm;
          padding-top: 2mm;
          border-top: 1px solid black;
        }

        .date-num {
          font-size: 18px;
          font-weight: bold;
          text-decoration: underline;
          margin: 0 1mm;
        }

        .date-sep {
          font-size: 12px;
        }

        /* OBS */
        .obs-row {
          display: flex;
          align-items: baseline;
          margin-top: 2mm;
        }

        .obs-value {
          font-size: 14px;
          font-weight: bold;
          text-decoration: underline;
          margin-left: 1mm;
        }

        .obs-line {
          border-bottom: 1px solid black;
          margin-top: 1mm;
          height: 4mm;
        }

        /* SIGNATURES */
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 4mm;
          padding: 0 5mm;
          align-items: flex-end;
        }

        .sig-left,
        .sig-right {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 12px;
        }

        .sig-line {
          width: 45mm;
          border-bottom: 1px solid black;
          margin-bottom: 1mm;
        }

        .cliente-name,
        .vendedor-name {
          font-size: 20px;
          font-weight: bold;
          font-family: 'Times New Roman', serif;
          min-height: 8mm;
          display: flex;
          align-items: flex-end;
        }

        .vendedor-label {
          font-size: 12px;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      ${pages.map((pageOrders) => `
        <div class="page">
          ${pageOrders.map(order => generateOrderNote(order, dateInfo)).join("")}
        </div>
      `).join("")}

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 200);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
