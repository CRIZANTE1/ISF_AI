# Requisitos do Projeto ISFIA Android

## Requisitos do Sistema

### Software Base
- **Node.js**: >= 18.0.0 (recomendado: 18.x ou superior)
- **npm**: >= 9.0.0 (ou yarn >= 1.22.0)
- **Git**: >= 2.30.0

### Para Desenvolvimento Android
- **Java JDK**: >= 17
- **Android Studio**: >= 2023.1 (Arctic Fox ou superior)
- **Android SDK**: API Level 33 (Android 13) ou superior
- **Gradle**: >= 8.0 (gerenciado pelo projeto)

### Capacitor
- **@capacitor/core**: ^6.0.0
- **@capacitor/android**: ^6.0.0
- **@capacitor/cli**: ^6.0.0

## Dependências Principais

### Framework e Bibliotecas Core
- **React**: ^18.2.0
- **React DOM**: ^18.2.0
- **TypeScript**: ^5.2.2
- **Vite**: ^7.2.2
- **React Router DOM**: ^6.23.1

### UI e Estilização
- **Tailwind CSS**: ^3.4.3
- **Framer Motion**: ^12.23.24
- **Lucide React**: ^0.395.0
- **React Icons**: ^5.5.0

### Formulários e Validação
- **React Hook Form**: ^7.51.5

### Backend e Banco de Dados
- **@supabase/supabase-js**: ^2.43.4

### Geolocalização e Mapas
- **@capacitor/geolocation**: ^6.1.0
- **Leaflet**: ^1.9.4
- **React Leaflet**: ^4.2.1

### Gráficos e Visualizações 3D
- **Three.js**: ^0.169.0
- **@react-three/fiber**: ^8.15.0

### QR Code
- **html5-qrcode**: ^2.3.8

### Utilitários
- **date-fns**: ^3.6.0

## Dependências de Desenvolvimento

### Testes
- **Vitest**: ^4.0.9
- **@vitest/ui**: ^4.0.9
- **@vitest/coverage-v8**: ^4.0.9
- **@testing-library/react**: ^14.1.2
- **@testing-library/jest-dom**: ^6.1.5
- **@testing-library/user-event**: ^14.5.1
- **@playwright/test**: ^1.56.1
- **jsdom**: ^23.0.1

### Linting e Formatação
- **ESLint**: ^8.57.0
- **eslint-plugin-react-hooks**: ^4.6.0
- **eslint-plugin-react-refresh**: ^0.4.6

### Build Tools
- **@vitejs/plugin-react**: ^4.2.1
- **PostCSS**: ^8.4.38
- **Autoprefixer**: ^10.4.19

### TypeScript Types
- **@types/react**: ^18.2.66
- **@types/react-dom**: ^18.2.22
- **@types/leaflet**: ^1.9.21
- **@types/three**: ^0.169.0

## Requisitos Funcionais

### Funcionalidades Implementadas
- ✅ Autenticação de usuários (Supabase Auth)
- ✅ Gerenciamento de equipamentos (CRUD)
- ✅ Inspeções de equipamentos
- ✅ Geolocalização de equipamentos
- ✅ Upload e armazenamento de imagens
- ✅ Modo offline com sincronização
- ✅ Notificações push
- ✅ Dashboard com métricas
- ✅ Histórico de inspeções
- ✅ **Inspeção por QR Code** (NOVO)
  - Parsing de QR Code industrial (formato: `2#7036#EXT#008851#47#31`)
  - Extração automática do número do cilindro
  - Busca rápida de extintores
  - Suporte a formato simples e industrial

### Tipos de Equipamentos Suportados
- Extintores
- Mangueiras
- Câmaras de Espuma
- Canhões Monitores
- Chuveiros/Lava-olhos
- Sistemas de Alarme
- Medidores Multigás
- Conjuntos Autônomos (SCBA)
- Abrigos de Emergência

## Requisitos de Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### Permissões Android (android/app/src/main/AndroidManifest.xml)
- `INTERNET`: Acesso à internet
- `ACCESS_FINE_LOCATION`: Geolocalização precisa
- `ACCESS_COARSE_LOCATION`: Geolocalização aproximada
- `CAMERA`: Acesso à câmera (para QR Code)
- `READ_EXTERNAL_STORAGE`: Leitura de arquivos
- `WRITE_EXTERNAL_STORAGE`: Escrita de arquivos

## Instalação

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Supabase
```

### 3. Sincronizar com Capacitor
```bash
npm run cap:sync
```

### 4. Executar em Desenvolvimento
```bash
npm run dev
```

### 5. Build para Android
```bash
npm run android:build
```

## Scripts Disponíveis

- `npm run dev`: Inicia servidor de desenvolvimento
- `npm run build`: Build de produção
- `npm run lint`: Executa ESLint
- `npm run test`: Executa testes unitários
- `npm run test:e2e`: Executa testes end-to-end
- `npm run cap:sync`: Sincroniza código com Capacitor
- `npm run cap:open`: Abre projeto no Android Studio
- `npm run android:build`: Build completo para Android
- `npm run android:build:apk`: Gera APK de release
- `npm run android:build:release`: Gera bundle de release

## Compatibilidade

### Navegadores Web
- Chrome/Edge: >= 90
- Firefox: >= 88
- Safari: >= 14
- Opera: >= 76

### Android
- Versão mínima: Android 7.0 (API 24)
- Versão recomendada: Android 10+ (API 29+)
- Versão de teste: Android 13+ (API 33+)

## Notas de Atualização

### Última Atualização: Inspeção por QR Code
- Adicionada funcionalidade de inspeção rápida por QR Code
- Suporte a formato industrial de QR Code (`2#7036#EXT#008851#47#31`)
- Extração automática do número do cilindro
- Biblioteca `html5-qrcode` adicionada para leitura de QR Codes

### Próximas Melhorias Sugeridas
- Integração completa do scanner de QR Code com câmera
- Suporte a QR Code para outros tipos de equipamentos
- Histórico de QR Codes escaneados
- Exportação de relatórios em PDF

