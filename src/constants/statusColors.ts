/**
 * Tabela de Cores para Status da Timeline
 * Define as cores para cada status do componente RadialOrbitalTimeline
 */

export interface StatusColors {
  text: string;
  bg: string;
  border: string;
}

export const statusColorTable: Record<
  "completed" | "in-progress" | "pending",
  StatusColors
> = {
  completed: {
    text: "#FFFFFF", // Branco
    bg: "#000000", // Preto
    border: "#FFFFFF", // Branco
  },
  "in-progress": {
    text: "#000000", // Preto
    bg: "#FFFFFF", // Branco
    border: "#000000", // Preto
  },
  pending: {
    text: "#FFFFFF", // Branco
    bg: "rgba(0, 0, 0, 0.4)", // Preto com 40% de opacidade
    border: "rgba(255, 255, 255, 0.5)", // Branco com 50% de opacidade
  },
};

/**
 * Cores alternativas usando a paleta Apple Fitness (opcional)
 * Descomente e use estas cores se preferir usar a paleta do projeto
 */
export const statusColorTableFitness: Record<
  "completed" | "in-progress" | "pending",
  StatusColors
> = {
  completed: {
    text: "#FFFFFF",
    bg: "#53D769", // Verde - Exercise (sucesso)
    border: "#53D769",
  },
  "in-progress": {
    text: "#FFFFFF",
    bg: "#157EFB", // Azul - Stand (em progresso)
    border: "#157EFB",
  },
  pending: {
    text: "#FFFFFF",
    bg: "#FC3D39", // Vermelho - Move (pendente/atenção)
    border: "#FC3D39",
  },
};

