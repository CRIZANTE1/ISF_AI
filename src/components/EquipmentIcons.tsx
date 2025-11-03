// Ícones realistas customizados para equipamentos de segurança

export const ExtinguisherIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Corpo principal do extintor - vermelho */}
    <rect x="10" y="8" width="12" height="20" rx="1" fill="#FC3D39" />
    {/* Topo do extintor */}
    <rect x="9" y="6" width="14" height="3" rx="1.5" fill="#E02E2A" />
    {/* Alça superior */}
    <path d="M12 6 Q16 4 20 6" stroke="#8E8E93" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M12 6 Q16 5 20 6" stroke="#2C2C2E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {/* Válvula/alça */}
    <circle cx="16" cy="7" r="2.5" fill="#2C2C2E" />
    <circle cx="16" cy="7" r="1.5" fill="#8E8E93" />
    {/* Alça lateral */}
    <path d="M10 14 Q8 16 10 18" stroke="#8E8E93" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M22 14 Q24 16 22 18" stroke="#8E8E93" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Manômetro/indicador */}
    <circle cx="16" cy="18" r="3" fill="#FFFFFF" stroke="#FC3D39" strokeWidth="0.5" />
    <circle cx="16" cy="18" r="2" fill="#53D769" />
    <line x1="16" y1="18" x2="16" y2="16.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
    {/* Tubo de descarga */}
    <path d="M16 28 L16 26 L13 29" stroke="#157EFB" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Boca/nozzle */}
    <circle cx="13" cy="29" r="1.5" fill="#2C2C2E" />
    {/* Faixa de segurança ou etiqueta */}
    <rect x="11" y="12" width="10" height="2" rx="0.5" fill="#FFFFFF" opacity="0.8" />
  </svg>
);

export const HoseIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Mangueira enrolada - formato realista */}
    <path
      d="M8 12 Q10 8 14 8 Q18 8 20 10 Q22 12 23 14 Q24 16 23 18 Q22 20 20 22 Q18 24 14 24 Q10 24 8 22 Q6 20 6 18 Q6 16 7 14 Q8 12 8 12"
      fill="#157EFB"
      stroke="#0066CC"
      strokeWidth="0.5"
    />
    <path
      d="M10 14 Q11 10 14 10 Q17 10 18 12 Q19 14 19.5 15.5 Q20 17 19.5 18.5 Q19 20 18 21 Q17 22 14 22 Q11 22 10 21 Q9 20 8.5 18.5 Q8 17 8.5 15.5 Q9 14 10 14"
      fill="#0066CC"
    />
    {/* Rosca/conexão frontal */}
    <circle cx="11" cy="16" r="3" fill="#2C2C2E" />
    <circle cx="11" cy="16" r="2" fill="#8E8E93" />
    {/* Detalhes da rosca */}
    <path d="M9 15 L9 17 M11 14 L11 18 M13 15 L13 17" stroke="#2C2C2E" strokeWidth="0.5" />
    {/* Faixas longitudinais da mangueira */}
    <path d="M9 12 Q12 10 15 12 Q18 14 19 16 Q20 18 19 20 Q18 22 15 22" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.3" fill="none" />
    <path d="M11 12 Q14 11 17 13 Q20 15 20.5 17 Q21 19 20 21" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.3" fill="none" />
  </svg>
);

export const FoamChamberIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Corpo principal da câmara - verde */}
    <rect x="11" y="10" width="10" height="16" rx="1" fill="#53D769" />
    {/* Topo com boca */}
    <ellipse cx="16" cy="10" rx="5" ry="2" fill="#45C159" />
    {/* Tampa superior */}
    <rect x="13" y="6" width="6" height="4" rx="1" fill="#2C2C2E" />
    <circle cx="16" cy="8" r="1.5" fill="#8E8E93" />
    {/* Defletor interno */}
    <ellipse cx="16" cy="14" rx="4" ry="1.5" fill="#45C159" />
    {/* Tubo de entrada - esquerda */}
    <rect x="5" y="15" width="6" height="3" rx="1" fill="#157EFB" />
    <circle cx="5" cy="16.5" r="1.5" fill="#FFFFFF" />
    {/* Tubo de saída - direita */}
    <rect x="21" y="15" width="6" height="3" rx="1" fill="#157EFB" />
    <circle cx="27" cy="16.5" r="1.5" fill="#FFFFFF" />
    {/* Base/suporte */}
    <rect x="9" y="26" width="14" height="2" rx="1" fill="#2C2C2E" />
    {/* Barragem de espuma */}
    <path d="M11 20 Q16 22 21 20" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const CannonMonitorIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Base circular - cinza */}
    <circle cx="16" cy="24" r="4" fill="#2C2C2E" />
    <circle cx="16" cy="24" r="3" fill="#8E8E93" />
    <circle cx="16" cy="24" r="1.5" fill="#2C2C2E" />
    {/* Suporte vertical */}
    <rect x="14.5" y="10" width="3" height="14" rx="1" fill="#157EFB" />
    <rect x="15" y="10" width="2" height="14" fill="#0066CC" />
    {/* Articulação */}
    <circle cx="16" cy="10" r="2.5" fill="#2C2C2E" />
    <circle cx="16" cy="10" r="1.5" fill="#8E8E93" />
    {/* Corpo do canhão - vermelho */}
    <ellipse cx="21" cy="10" rx="7" ry="3" fill="#FC3D39" />
    <ellipse cx="21" cy="10" rx="6" ry="2.5" fill="#E02E2A" />
    {/* Boca do canhão - formato realista */}
    <ellipse cx="26" cy="10" rx="2" ry="3" fill="#2C2C2E" />
    <ellipse cx="26" cy="10" rx="1.5" ry="2.5" fill="#000000" />
    {/* Controles/manivela */}
    <circle cx="19" cy="9" r="1" fill="#8E8E93" />
    <circle cx="19" cy="11" r="1" fill="#8E8E93" />
    {/* Mangueira de entrada */}
    <path d="M14 10 L12 12 L10 14" stroke="#157EFB" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="10" cy="14" r="1.5" fill="#0066CC" />
  </svg>
);

export const EyewashIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Suporte vertical - cinza */}
    <rect x="14.5" y="6" width="3" height="20" rx="1" fill="#8E8E93" />
    <rect x="15" y="6" width="2" height="20" fill="#2C2C2E" />
    {/* Chuveiro de emergência - formato realista */}
    <circle cx="16" cy="8" r="4.5" fill="#157EFB" />
    <circle cx="16" cy="8" r="3.5" fill="#0066CC" />
    {/* Placa perfurada do chuveiro */}
    <circle cx="16" cy="8" r="3" fill="#FFFFFF" opacity="0.9" />
    {/* Furos do chuveiro */}
    <circle cx="14" cy="7" r="0.4" fill="#157EFB" />
    <circle cx="18" cy="7" r="0.4" fill="#157EFB" />
    <circle cx="16" cy="6" r="0.4" fill="#157EFB" />
    <circle cx="16" cy="10" r="0.4" fill="#157EFB" />
    <circle cx="14.5" cy="9" r="0.4" fill="#157EFB" />
    <circle cx="17.5" cy="9" r="0.4" fill="#157EFB" />
    {/* Lava-olhos */}
    <circle cx="13" cy="14" r="2.5" fill="#157EFB" />
    <circle cx="19" cy="14" r="2.5" fill="#157EFB" />
    <circle cx="13" cy="14" r="2" fill="#0066CC" />
    <circle cx="19" cy="14" r="2" fill="#0066CC" />
    {/* Bicos */}
    <rect x="12.5" y="12" width="1" height="2" rx="0.5" fill="#FFFFFF" />
    <rect x="18.5" y="12" width="1" height="2" rx="0.5" fill="#FFFFFF" />
    {/* Válvula de acionamento */}
    <rect x="13" y="20" width="6" height="3" rx="1" fill="#FC3D39" />
    <rect x="14" y="20.5" width="4" height="2" fill="#E02E2A" />
    {/* Base */}
    <rect x="12" y="26" width="8" height="4" rx="1" fill="#2C2C2E" />
  </svg>
);

export const AlarmIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Corpo principal da sirene - formato realista */}
    <circle cx="16" cy="16" r="7" fill="#FC3D39" />
    <circle cx="16" cy="16" r="6" fill="#E02E2A" />
    {/* Grade frontal da sirene */}
    <circle cx="16" cy="16" r="5" fill="#FFFFFF" opacity="0.15" />
    <line x1="13" y1="16" x2="19" y2="16" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
    <line x1="16" y1="13" x2="16" y2="19" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
    <line x1="13.5" y1="13.5" x2="18.5" y2="18.5" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
    <line x1="18.5" y1="13.5" x2="13.5" y2="18.5" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
    {/* Luz estroboscópica no topo */}
    <circle cx="16" cy="9" r="2" fill="#FFFFFF" />
    <circle cx="16" cy="9" r="1.5" fill="#F59E0B" />
    {/* Base de montagem */}
    <rect x="14" y="23" width="4" height="2" rx="1" fill="#2C2C2E" />
    {/* Linhas de som/ondas */}
    <path d="M4 16 Q8 14 12 16" stroke="#FC3D39" strokeWidth="1" fill="none" opacity="0.6" />
    <path d="M20 16 Q24 14 28 16" stroke="#FC3D39" strokeWidth="1" fill="none" opacity="0.6" />
    <path d="M16 4 Q14 8 16 12" stroke="#FC3D39" strokeWidth="1" fill="none" opacity="0.6" />
    <path d="M16 20 Q14 24 16 28" stroke="#FC3D39" strokeWidth="1" fill="none" opacity="0.6" />
  </svg>
);

export const MultigasIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Corpo do detector - formato realista */}
    <rect x="9" y="6" width="14" height="20" rx="2" fill="#53D769" />
    <rect x="9" y="6" width="14" height="3" rx="2" fill="#45C159" />
    {/* Tela LCD - formato realista */}
    <rect x="11" y="11" width="10" height="8" rx="0.5" fill="#000000" />
    <rect x="12" y="12" width="8" height="6" fill="#00FF00" opacity="0.4" />
    {/* Números/display */}
    <text x="16" y="18" fontSize="3" fill="#00FF00" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LEL</text>
    {/* LEDs indicadores */}
    <circle cx="12" cy="22" r="1.2" fill="#157EFB" />
    <circle cx="16" cy="22" r="1.2" fill="#FC3D39" />
    <circle cx="20" cy="22" r="1.2" fill="#F59E0B" />
    {/* Botões laterais */}
    <rect x="7" y="12" width="2" height="3" rx="0.5" fill="#8E8E93" />
    <rect x="7" y="16" width="2" height="3" rx="0.5" fill="#8E8E93" />
    <rect x="23" y="12" width="2" height="3" rx="0.5" fill="#8E8E93" />
    <rect x="23" y="16" width="2" height="3" rx="0.5" fill="#8E8E93" />
    {/* Sensor frontal */}
    <circle cx="16" cy="9" r="1.5" fill="#2C2C2E" />
    <circle cx="16" cy="9" r="1" fill="#000000" />
    {/* Clip de cintura */}
    <path d="M13 26 L13 28 L19 28 L19 26" stroke="#2C2C2E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const SCBAIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Cilindro de ar - formato realista */}
    <ellipse cx="16" cy="8" rx="5" ry="3" fill="#157EFB" />
    <rect x="11" y="8" width="10" height="16" rx="1" fill="#157EFB" />
    <rect x="11" y="8" width="10" height="3" rx="1" fill="#0066CC" />
    {/* Válvula superior */}
    <rect x="14" y="4" width="4" height="4" rx="0.5" fill="#2C2C2E" />
    <circle cx="16" cy="5" r="1" fill="#8E8E93" />
    {/* Alça superior */}
    <path d="M12 10 Q16 9 20 10" stroke="#2C2C2E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {/* Regulador de pressão - formato realista */}
    <rect x="13" y="22" width="6" height="4" rx="1" fill="#53D769" />
    <rect x="13.5" y="22.5" width="5" height="3" rx="0.5" fill="#45C159" />
    {/* Manômetro no regulador */}
    <circle cx="16" cy="24" r="1.5" fill="#FFFFFF" />
    <circle cx="16" cy="24" r="1" fill="#157EFB" />
    {/* Mangueira do regulador */}
    <path d="M16 26 L16 28 L14 30" stroke="#157EFB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {/* Máscara facial - formato realista */}
    <path d="M11 30 Q16 28 21 30 Q21 31.5 19 32 Q16 32 13 32 Q11 31.5 11 30" fill="#FFFFFF" />
    <path d="M13 30.5 Q16 29.5 19 30.5" stroke="#8E8E93" strokeWidth="0.5" fill="none" />
    {/* Visor da máscara */}
    <ellipse cx="16" cy="30.5" rx="3" ry="1.5" fill="#157EFB" opacity="0.3" />
    {/* Elastico/cinta */}
    <path d="M11 30 Q9 29 9 28" stroke="#8E8E93" strokeWidth="1" fill="none" strokeLinecap="round" />
    <path d="M21 30 Q23 29 23 28" stroke="#8E8E93" strokeWidth="1" fill="none" strokeLinecap="round" />
  </svg>
);

export const ShelterIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Telhado triangular - formato realista */}
    <path
      d="M4 16 L16 4 L28 16 L28 28 L4 28 Z"
      fill="#53D769"
    />
    {/* Telhas */}
    <path
      d="M6 15 L10 12 L14 15 M14 15 L18 12 L22 15 M22 15 L26 12 L28 15"
      stroke="#45C159"
      strokeWidth="0.5"
      fill="none"
    />
    {/* Paredes laterais - branco */}
    <rect x="4" y="16" width="24" height="12" fill="#FFFFFF" />
    {/* Porta central - azul */}
    <rect x="13" y="18" width="6" height="10" rx="0.5" fill="#157EFB" />
    <rect x="13.5" y="18.5" width="5" height="9" rx="0.3" fill="#0066CC" />
    {/* Maçaneta */}
    <circle cx="17.5" cy="23" r="0.6" fill="#FFFFFF" />
    {/* Janela esquerda */}
    <rect x="7" y="18" width="4" height="5" rx="0.5" fill="#157EFB" />
    <rect x="7.5" y="18.5" width="3" height="4" rx="0.3" fill="#FFFFFF" opacity="0.8" />
    <line x1="9" y1="18.5" x2="9" y2="22.5" stroke="#157EFB" strokeWidth="0.5" />
    <line x1="7.5" y1="20.5" x2="10.5" y2="20.5" stroke="#157EFB" strokeWidth="0.5" />
    {/* Janela direita */}
    <rect x="21" y="18" width="4" height="5" rx="0.5" fill="#157EFB" />
    <rect x="21.5" y="18.5" width="3" height="4" rx="0.3" fill="#FFFFFF" opacity="0.8" />
    <line x1="23" y1="18.5" x2="23" y2="22.5" stroke="#157EFB" strokeWidth="0.5" />
    <line x1="21.5" y1="20.5" x2="24.5" y2="20.5" stroke="#157EFB" strokeWidth="0.5" />
    {/* Sinalização de segurança */}
    <circle cx="16" cy="10" r="1.5" fill="#FC3D39" />
    <path d="M16 9 L16 11 M15 10 L17 10" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
    {/* Base/piso */}
    <rect x="4" y="28" width="24" height="2" fill="#8E8E93" />
  </svg>
);

