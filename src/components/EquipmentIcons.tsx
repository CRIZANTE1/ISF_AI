// Ícones coloridos customizados para equipamentos de segurança

export const ExtinguisherIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Corpo do extintor - vermelho vibrante */}
    <rect x="8" y="10" width="16" height="18" rx="2" fill="#FC3D39" />
    <rect x="8" y="10" width="16" height="4" rx="2" fill="#FF6B6B" />
    {/* Alça - cinza metálico */}
    <rect x="14" y="4" width="4" height="6" rx="1" fill="#8E8E93" />
    <rect x="15" y="4" width="2" height="6" fill="#FFFFFF" opacity="0.5" />
    {/* Boca/Spray - azul */}
    <rect x="11" y="28" width="10" height="2" rx="1" fill="#157EFB" />
    <circle cx="16" cy="29" r="1.5" fill="#FFFFFF" />
    {/* Indicador de pressão - branco com detalhes */}
    <circle cx="16" cy="18" r="3.5" fill="#FFFFFF" stroke="#FC3D39" strokeWidth="0.5" />
    <circle cx="16" cy="18" r="2" fill="#53D769" />
    {/* Detalhe metálico */}
    <rect x="9" y="14" width="14" height="1" fill="#FF6B6B" opacity="0.6" />
  </svg>
);

export const HoseIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Mangueira enrolada - azul vibrante com padrão */}
    <path
      d="M16 6 C20 6, 23 9, 24 13 C25 17, 23 21, 20 23 C17 25, 13 25, 10 23 C7 21, 6 17, 7 13 C8 9, 12 6, 16 6 Z"
      fill="#157EFB"
    />
    <path
      d="M16 8 C19 8, 22 10, 23 13 C23.5 16, 22 19, 20 20.5 C18 22, 15 22, 13 20.5 C11 19, 9.5 16, 10 13 C10.5 10, 13 8, 16 8 Z"
      fill="#53D769"
    />
    {/* Conexão - verde */}
    <circle cx="16" cy="16" r="5" fill="#53D769" />
    <circle cx="16" cy="16" r="3" fill="#FFFFFF" />
    {/* Rosca */}
    <path d="M14 15 L18 15 M14 17 L18 17" stroke="#53D769" strokeWidth="1" />
  </svg>
);

export const FoamChamberIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Câmara - verde vibrante */}
    <rect x="10" y="8" width="12" height="18" rx="1.5" fill="#53D769" />
    <rect x="10" y="8" width="12" height="3" rx="1.5" fill="#45C159" />
    {/* Tampa - azul */}
    <rect x="12" y="4" width="8" height="4" rx="1" fill="#157EFB" />
    <circle cx="16" cy="6" r="1.5" fill="#FFFFFF" />
    {/* Tubos conectados - branco com detalhes */}
    <rect x="16" y="6" width="2" height="2" rx="0.5" fill="#FFFFFF" />
    <rect x="8" y="14" width="4" height="4" rx="1" fill="#FFFFFF" />
    <rect x="20" y="14" width="4" height="4" rx="1" fill="#FFFFFF" />
    {/* Conexões */}
    <circle cx="10" cy="16" r="1.5" fill="#53D769" />
    <circle cx="22" cy="16" r="1.5" fill="#53D769" />
    {/* Linha de espuma */}
    <path d="M12 12 Q16 14 20 12" stroke="#FFFFFF" strokeWidth="2" fill="none" />
  </svg>
);

export const CannonMonitorIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Base - cinza escuro */}
    <rect x="11" y="22" width="10" height="5" rx="1.5" fill="#2C2C2E" />
    <rect x="12" y="23" width="8" height="3" rx="1" fill="#8E8E93" />
    {/* Suporte - azul */}
    <rect x="14" y="12" width="4" height="10" rx="1" fill="#157EFB" />
    <rect x="15" y="12" width="2" height="10" fill="#0066CC" />
    {/* Canhão - vermelho vibrante */}
    <rect x="18" y="8" width="10" height="5" rx="2.5" fill="#FC3D39" />
    <rect x="18" y="8" width="10" height="2" rx="2.5" fill="#FF6B6B" />
    {/* Boca do canhão */}
    <circle cx="23" cy="10.5" r="2" fill="#FFFFFF" />
    <circle cx="23" cy="10.5" r="1" fill="#157EFB" />
    {/* Controles */}
    <circle cx="20" cy="11.5" r="0.8" fill="#8E8E93" />
    <circle cx="26" cy="11.5" r="0.8" fill="#8E8E93" />
  </svg>
);

export const EyewashIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Chuveiro - azul vibrante */}
    <circle cx="16" cy="10" r="7" fill="#157EFB" />
    <circle cx="16" cy="10" r="5" fill="#0066CC" />
    {/* Boca do chuveiro */}
    <circle cx="16" cy="10" r="3" fill="#FFFFFF" />
    <circle cx="14" cy="9" r="0.8" fill="#157EFB" />
    <circle cx="18" cy="9" r="0.8" fill="#157EFB" />
    <circle cx="16" cy="11" r="0.8" fill="#157EFB" />
    {/* Gotas de água - verde/azul */}
    <circle cx="13" cy="18" r="2.5" fill="#53D769" />
    <circle cx="19" cy="20" r="2" fill="#157EFB" />
    <circle cx="16" cy="22" r="1.5" fill="#53D769" />
    <circle cx="14" cy="24" r="1" fill="#157EFB" />
    {/* Suporte - cinza */}
    <rect x="13" y="26" width="6" height="4" rx="1" fill="#8E8E93" />
    <rect x="14" y="27" width="4" height="2" fill="#2C2C2E" />
  </svg>
);

export const AlarmIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Sirene - vermelho vibrante com detalhes */}
    <path
      d="M16 4 L20 10 L26 12 L22 16 L24 22 L16 18 L8 22 L10 16 L6 12 L12 10 Z"
      fill="#FC3D39"
    />
    <path
      d="M16 6 L19 10.5 L23.5 12 L20 15 L21.5 20 L16 17 L10.5 20 L12 15 L8.5 12 L13 10.5 Z"
      fill="#FF6B6B"
    />
    {/* Centro - branco com ícone */}
    <circle cx="16" cy="16" r="5" fill="#FFFFFF" />
    <circle cx="16" cy="16" r="3" fill="#FC3D39" />
    {/* Linhas de som */}
    <path d="M4 16 L2 16 M30 16 L28 16" stroke="#FC3D39" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 4 L16 2 M16 30 L16 28" stroke="#FC3D39" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const MultigasIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Dispositivo - verde vibrante */}
    <rect x="8" y="8" width="16" height="16" rx="2.5" fill="#53D769" />
    <rect x="8" y="8" width="16" height="4" rx="2.5" fill="#45C159" />
    {/* Tela LCD - preto */}
    <rect x="10" y="14" width="12" height="8" rx="1" fill="#000000" />
    <rect x="11" y="15" width="10" height="6" fill="#00FF00" opacity="0.3" />
    {/* Indicadores LED coloridos */}
    <circle cx="12" cy="24" r="1.5" fill="#157EFB" />
    <circle cx="16" cy="24" r="1.5" fill="#FC3D39" />
    <circle cx="20" cy="24" r="1.5" fill="#F59E0B" />
    {/* Botões */}
    <rect x="13" y="10" width="2" height="1.5" rx="0.5" fill="#FFFFFF" />
    <rect x="17" y="10" width="2" height="1.5" rx="0.5" fill="#FFFFFF" />
  </svg>
);

export const SCBAIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Cilindro - azul vibrante */}
    <rect x="12" y="4" width="8" height="20" rx="1.5" fill="#157EFB" />
    <rect x="12" y="4" width="8" height="4" rx="1.5" fill="#0066CC" />
    {/* Válvula - cinza metálico */}
    <rect x="14" y="2" width="4" height="2" rx="0.5" fill="#8E8E93" />
    <circle cx="16" cy="3" r="1" fill="#FFFFFF" />
    {/* Regulador - verde */}
    <circle cx="16" cy="26" r="4" fill="#53D769" />
    <circle cx="16" cy="26" r="2.5" fill="#45C159" />
    <rect x="14" y="24" width="4" height="1" rx="0.5" fill="#FFFFFF" />
    {/* Máscara - branco */}
    <ellipse cx="16" cy="30" rx="5" ry="2.5" fill="#FFFFFF" />
    <path d="M14 29 Q16 28.5 18 29" stroke="#8E8E93" strokeWidth="0.5" fill="none" />
    {/* Alça */}
    <rect x="14.5" y="6" width="3" height="2" rx="0.5" fill="#0066CC" />
  </svg>
);

export const ShelterIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Telhado - verde vibrante */}
    <path
      d="M4 14 L16 4 L28 14 L28 26 L4 26 Z"
      fill="#53D769"
    />
    <path
      d="M4 14 L16 4 L28 14 L26 16 L6 16 Z"
      fill="#45C159"
    />
    {/* Paredes */}
    <rect x="4" y="14" width="24" height="12" fill="#FFFFFF" />
    {/* Porta - azul */}
    <rect x="13" y="16" width="6" height="10" rx="0.5" fill="#157EFB" />
    <circle cx="17.5" cy="21" r="0.8" fill="#FFFFFF" />
    {/* Janelas */}
    <rect x="7" y="16" width="4" height="5" rx="0.5" fill="#157EFB" stroke="#53D769" strokeWidth="0.5" />
    <path d="M9 16 L9 21 M7 18.5 L11 18.5" stroke="#53D769" strokeWidth="0.5" />
    <rect x="21" y="16" width="4" height="5" rx="0.5" fill="#157EFB" stroke="#53D769" strokeWidth="0.5" />
    <path d="M23 16 L23 21 M21 18.5 L25 18.5" stroke="#53D769" strokeWidth="0.5" />
    {/* Cruz de segurança */}
    <circle cx="16" cy="9" r="1" fill="#FC3D39" />
  </svg>
);

