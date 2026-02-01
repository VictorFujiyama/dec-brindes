// Mapeamento de produtos Shopee para quantidade de copos e descrição real
// Este mapeamento é usado para preencher valores padrão quando um pedido é importado

interface ProductMapping {
  cupQuantity: number;
  realDescription: string;
}

// Mapa de nome do produto Shopee -> dados reais
const productMappings: Record<string, ProductMapping> = {
  "Kit 1000 Copos 500ml Personalizado Descartável com Borda Pintada": {
    cupQuantity: 1000,
    realDescription: "Copos 500ml com Borda sortidas em preto",
  },
  "Kit 200 Copos 770ml Personalizado Descartável Bicolor para Festas Adegas Casamentos": {
    cupQuantity: 200,
    realDescription: "Copão 770ml Bicolor Rosa e Laranja em preto",
  },
  "Kit 600 Copos 500ml Personalizado Descartável com Borda Pintada Compre 600 e Pague 500": {
    cupQuantity: 600,
    realDescription: "Copos 500ml com Borda sortidas em preto",
  },
  "Kit 100 Baldão Personalizado Descartável com tampa  1.8L": {
    cupQuantity: 100,
    realDescription: "Baldão 1.8L em preto",
  },
  "Kit 1000 Copos 500ml Personalizados Descartável Degradê Para Festas Adegas Casamentos": {
    cupQuantity: 1000,
    realDescription: "Copos 500ml Degradê sortidos em preto",
  },
  "Kit 100 Copos 770ml Personalizado Neon Festas Adegas Casamentos": {
    cupQuantity: 100,
    realDescription: "Copão 770ml Balada Neon em preto",
  },
  "Kit 1000 Copão 770ml Bicolor Para Festas Adegas Casamentos": {
    cupQuantity: 1000,
    realDescription: "Copão 770ml Bicolor Rosa e Laranja em preto",
  },
  "kit 500 copão descartável de770 ml degrade com borda pintada personizado": {
    cupQuantity: 500,
    realDescription: "Copão 770ml com Borda sortidas em preto",
  },
  "kit 1000 copão descartável 770 ml degrade com borda pintada personalizado": {
    cupQuantity: 1000,
    realDescription: "Copão 770ml Degradê e Borda sortidas em preto",
  },
  "Kit 100 Copos 500ml Personalizados Descartável Para Festas Adegas Casamentos": {
    cupQuantity: 100,
    realDescription: "Copos 500ml em preto",
  },
  "Kit 30 Copos 620ml Twister com Tampa e Canudo Cor Preta para Festas Adegas Casamentos": {
    cupQuantity: 30,
    realDescription: "Copos Twister 620ml Preto com tampa preta em BRANCO",
  },
  "Kit 500 Copos 770ml Personalizado Balada Neon Para Festas Adegas Casamentos": {
    cupQuantity: 500,
    realDescription: "Copão 770ml Balada Neon em preto",
  },
  "Kit 150 Copos 770ml Personalizado Descartável Bicolor para Festas Adegas Casamentos": {
    cupQuantity: 150,
    realDescription: "Copão 770ml Bicolor Rosa e Laranja em preto",
  },
  "Kit 300 Copos 1L Personalizados Descartável Degradê Para Festas Adegas Casamentos": {
    cupQuantity: 300,
    realDescription: "Copos 1L Degradê sortidos em preto",
  },
  "Kit 500 Copos 770ml Descartável Degradê para Festas Adegas Casamentos": {
    cupQuantity: 500,
    realDescription: "Copão 770ml Degradê sortidos em preto",
  },
  "Kit 500 Copos 770ml Personalizado  Descartáveis Para Festas Adegas Casamentos": {
    cupQuantity: 500,
    realDescription: "500 Copão 770ml em preto",
  },
  "Kit 100 Copos 770ml Personalizado Descartável Degradê": {
    cupQuantity: 100,
    realDescription: "Copão 770ml Degradê sortidos em preto",
  },
  "Kit 300 Copos 1L Personalizados Descartável Bicolor Para Festas Adegas Casamentos": {
    cupQuantity: 300,
    realDescription: "Copos 1L Bicolor Rosa e Laranja em preto",
  },
  "Kit 50 Copos 770ml Personalizado Descartável Degradê Para Festas Adegas Casamentos": {
    cupQuantity: 50,
    realDescription: "Copão 770ml Degradê sortidos em preto",
  },
  "Kit 100 Copos 300ml Descartável Personalizado Degradê": {
    cupQuantity: 100,
    realDescription: "Copos 300ml Degradê sortidos em preto",
  },
  "Kit 100 Copos 300ml Personalizado Degradê": {
    cupQuantity: 100,
    realDescription: "Copos 300ml Degradê sortidos em preto",
  },
  "Kit 100 Copos 770ml  Personalizado Descartável Transparente Para Festas Adegas Casamentos": {
    cupQuantity: 100,
    realDescription: "Copão 770ml em preto",
  },
  "Kit 1000 Copos 500ml Personalizado Descartável": {
    cupQuantity: 1000,
    realDescription: "Copos 500ml em preto",
  },
  "Kit 30 Copos 620ml Personalizado Twister com Impressão Label 360° para Festas Adegas Casamentos": {
    cupQuantity: 30,
    realDescription: "Copos Label com tampa Preta",
  },
  "Kit 300 Copos 500ml Personalizado Descartável Transparente": {
    cupQuantity: 300,
    realDescription: "Copos 500ml em preto",
  },
  "Kit 500 Copos 500ml Personalizado Descartável Degradê Para Festas Adegas Casamentos": {
    cupQuantity: 500,
    realDescription: "Copos 500ml Degradê sortidos em preto",
  },
  "Kit 150 Copos 500ml Personalizado Descartável Degradê Para Festas Adegas Casamentos": {
    cupQuantity: 150,
    realDescription: "Copos 500ml Degradê sortidos em preto",
  },
  "kit 1000 copão descartável 770 ml degrade personalizado": {
    cupQuantity: 1000,
    realDescription: "Copão 770ml Degradê sortidos em preto",
  },
  "Kit 1000 Copos 300ml Personalizado Descartável  Para Festas Adegas Casamentos": {
    cupQuantity: 1000,
    realDescription: "Copos 300ml em preto",
  },
  "Kit 100 Copos 300ml Personalizado Descartável Para Festas Adegas Casamentos": {
    cupQuantity: 100,
    realDescription: "Copos 300ml em preto",
  },
  "Kit 100 Copos 770ml Personalizados Descartável Bicolor Para Festas Baladas Adegas": {
    cupQuantity: 100,
    realDescription: "Copão 770ml Bicolor Rosa e Laranja em preto",
  },
  "Kit 1000 Copos 770ml Personalizado Descartável para Festas Adegas Casamentos": {
    cupQuantity: 1000,
    realDescription: "Copão 770ml em preto",
  },
  "Kit 100  Copos 300ml Bicolor Para Festas Adegas Casamentos": {
    cupQuantity: 100,
    realDescription: "Copos 300ml Bicolor Rosa e Laranja em preto",
  },
  "Kit 100 Copos 770ml Personalizado Descartável Degradê para Festas Adegas Casamentos": {
    cupQuantity: 100,
    realDescription: "Copão 770ml Degradê sortidos em preto",
  },
  "Kit 200 Copos 770ml Degradê Personalizados  Festas Casamentos Aniversários e Eventos": {
    cupQuantity: 200,
    realDescription: "Copão 770ml Degradê sortidos em preto",
  },
  "Kit 200 Copos 770ml Descartável Degradê Personalizado Para Festas Adegas Casamentos": {
    cupQuantity: 200,
    realDescription: "Copão 770ml Degradê sortidos em preto",
  },
  "Kit 1000 Copos 500ml Personalizados Descartáveis Para Festas Adegas Casamentos": {
    cupQuantity: 1000,
    realDescription: "Copos 500ml em preto",
  },
  "Kit 500 Copos 500ml Personalizados Descartáveis Incolor Para Festas Adegas Casamentos": {
    cupQuantity: 500,
    realDescription: "Copos 500ml em preto",
  },
  "Kit 50 Copos 300ml Personalizados Descartáveis Degradê Para Festas Adegas Casamentos": {
    cupQuantity: 50,
    realDescription: "Copos 300ml Degradê sortidos em preto",
  },
  "Kit 50 Copos 500ml Personalizados Descartáveis Degradê Para Festas Adegas Casamentos": {
    cupQuantity: 50,
    realDescription: "Copos 500ml Degradê sortidos em preto",
  },
  "Kit 100 Copos 500ml Personalizado Descartáveis Degradê Para Festas Adegas Casamentos": {
    cupQuantity: 100,
    realDescription: "Copos 500ml Degradê sortidos em preto",
  },
  "Kit 500 Copos 300ml Descartáveis Para Festas Adegas Casamentos": {
    cupQuantity: 500,
    realDescription: "Copos 300ml em preto",
  },
};

/**
 * Busca o mapeamento de um produto pelo nome
 * @param productName Nome do produto (Shopee)
 * @returns Dados do mapeamento ou null se não encontrado
 */
export function getProductMapping(productName: string): ProductMapping | null {
  // Busca exata primeiro
  if (productMappings[productName]) {
    return productMappings[productName];
  }

  // Busca case-insensitive
  const lowerProductName = productName.toLowerCase();
  for (const [key, value] of Object.entries(productMappings)) {
    if (key.toLowerCase() === lowerProductName) {
      return value;
    }
  }

  return null;
}

/**
 * Calcula a quantidade total de copos baseado no mapeamento e quantidade de kits
 * @param productName Nome do produto (Shopee)
 * @param kitQuantity Quantidade de kits comprados
 * @returns Quantidade total de copos ou null se não encontrado
 */
export function calculateTotalCups(productName: string, kitQuantity: number): number | null {
  const mapping = getProductMapping(productName);
  if (!mapping) return null;
  return mapping.cupQuantity * kitQuantity;
}

/**
 * Retorna a descrição real do produto
 * @param productName Nome do produto (Shopee)
 * @returns Descrição real ou null se não encontrado
 */
export function getRealDescription(productName: string): string | null {
  const mapping = getProductMapping(productName);
  return mapping?.realDescription || null;
}
