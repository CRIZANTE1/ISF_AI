# ISF IA - App Android para Gestão de Inspeções de Equipamentos de Segurança

Aplicativo Android para gestão e inspeção de equipamentos de segurança contra incêndio (SCI) e equipamentos de segurança, desenvolvido com React, TypeScript, Vite e Supabase.

## 📋 Sobre o Projeto

O ISF IA é um aplicativo Android desenvolvido para facilitar o gerenciamento de inspeções de equipamentos de segurança contra incêndio e equipamentos de proteção. O sistema permite cadastrar equipamentos, realizar inspeções periódicas, acompanhar status e histórico de manutenções diretamente do seu dispositivo Android.

### Funcionalidades Principais

- 🔐 **Autenticação de Usuários**: Sistema de login e registro com Supabase Auth
- 📊 **Dashboard**: Visão geral com métricas de equipamentos (Total, OK, Vencidos, Pendentes)
- 🔥 **Gestão de Equipamentos SCI**:
  - Extintores
  - Mangueiras e Abrigos
  - Câmaras de Espuma
  - Canhões Monitores
- 🛡️ **Gestão de Equipamentos de Segurança**:
  - Medidores Multigás
  - Conjuntos Autônomos (SCBA)
- ✅ **Sistema de Inspeções**: Cadastro e acompanhamento de inspeções periódicas
- 📝 **Histórico**: Acompanhamento do histórico de inspeções e manutenções
- 👤 **Perfis de Usuário**: Suporte a perfis de usuário e administrador
- 🎨 **Interface Moderna**: Design otimizado para Android com suporte a tema claro/escuro
- 📱 **Nativo Android**: Aplicativo nativo com experiência otimizada para dispositivos móveis

## 🛠️ Tecnologias Utilizadas

### Frontend Mobile
- **React 18.2.0** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.2.2** - Superset JavaScript com tipagem estática
- **React Router DOM 6.23.1** - Roteamento para aplicações React
- **Vite 5.0** - Build tool e dev server
- **Tailwind CSS 3.4.3** - Framework CSS utility-first otimizado para mobile
- **Framer Motion 12.23.24** - Biblioteca de animações
- **React Hook Form 7.51.5** - Gerenciamento de formulários
- **Lucide React 0.395.0** - Ícones SVG
- **date-fns 3.6.0** - Biblioteca para manipulação de datas

### Backend
- **Supabase** - Backend como serviço (BaaS)
  - Supabase Auth - Autenticação
  - Supabase Database - Banco de dados PostgreSQL
  - Row Level Security (RLS) - Segurança de dados

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado em sua máquina:

### Desenvolvimento Web
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- Conta no **Supabase** (para configuração do banco de dados)

### Desenvolvimento Android
- **Android Studio** (versão mais recente)
- **Android SDK** (API Level 33 ou superior)
- **Java JDK** (versão 17 ou superior)
- **Gradle** (geralmente incluído no Android Studio)
- Dispositivo Android físico ou emulador para testes

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd ISFIA_ANDROID
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

Para obter essas credenciais:
1. Acesse seu projeto no [Supabase](https://supabase.com)
2. Vá em Settings > API
3. Copie a `URL` e a `anon public` key

4. **Configure o banco de dados**

Execute as migrações do Supabase na ordem:

```bash
# As migrações estão na pasta supabase/migrations/
# Execute-as no Supabase SQL Editor na seguinte ordem:
# 1. 20250101000000_initial_schema.sql
# 2. 20251102000001_fix_profiles_schema.sql
# 3. 20251102000003_fix_profiles_and_set_admin.sql
# 4. 20251103000000_add_inspections_table.sql
# 5. 20251103000000_add_role_and_plan.sql
# 6. 20251104000001_fix_equipment_data.sql
# 7. 20251104000002_fix_inspections_observacoes_column.sql
# 8. 20251104000003_fix_equipment_type_column.sql
```

## 🎯 Scripts Disponíveis

No diretório do projeto, você pode executar:

### Desenvolvimento Web
### `npm run dev`
Inicia o servidor de desenvolvimento na porta padrão do Vite (geralmente `http://localhost:5173`). Útil para testar a aplicação no navegador antes de compilar para Android.

### `npm run build`
Compila a aplicação para produção na pasta `dist`. Esta build será usada pelo container Android nativo.

### `npm run preview`
Visualiza a build de produção localmente no navegador.

### `npm run lint`
Executa o ESLint para verificar problemas no código.

### Desenvolvimento Android
### Compilar APK/AAB
Após executar `npm run build`, você pode compilar o app Android usando:
- **Android Studio**: Abra o projeto Android (se configurado) e clique em "Build > Build Bundle(s) / APK(s)"
- **Gradle CLI**: Execute `./gradlew assembleRelease` ou `./gradlew bundleRelease` no diretório Android

## 📁 Estrutura do Projeto

```
ISFIA_ANDROID/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── forms/          # Formulários de equipamentos
│   │   ├── AdminRoute.tsx  # Rota protegida para admin
│   │   ├── ProtectedRoute.tsx  # Rota protegida
│   │   ├── Layout.tsx      # Layout principal
│   │   └── ...
│   ├── contexts/           # Contextos React
│   │   └── AuthContext.tsx # Contexto de autenticação
│   ├── lib/                # Bibliotecas e configurações
│   │   └── supabase.ts     # Cliente Supabase
│   ├── pages/              # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── Inspections.tsx
│   │   ├── EquipmentListPage.tsx
│   │   ├── AddEquipmentPage.tsx
│   │   └── ...
│   ├── types/              # Definições TypeScript
│   │   └── supabase.ts     # Tipos do Supabase
│   ├── utils/              # Funções utilitárias
│   │   └── extinguisherOperations.ts
│   ├── App.tsx             # Componente principal
│   └── main.tsx            # Ponto de entrada
├── supabase/
│   └── migrations/         # Migrações do banco de dados
├── public/                 # Arquivos estáticos
├── index.html              # HTML principal
├── package.json            # Dependências e scripts
├── tsconfig.json           # Configuração TypeScript
├── vite.config.ts          # Configuração Vite
└── tailwind.config.js      # Configuração Tailwind
```

## 🔑 Funcionalidades Detalhadas

### Dashboard
- Exibição de métricas de equipamentos
- Alertas de equipamentos vencidos ou pendentes
- Acesso rápido às principais funcionalidades

### Gestão de Equipamentos
- Listagem de equipamentos por categoria
- Cadastro de novos equipamentos
- Edição de equipamentos existentes
- Visualização detalhada de cada equipamento

### Sistema de Inspeções
- Cadastro de inspeções periódicas
- Registro de observações
- Acompanhamento de status (OK, Vencido, Pendente)
- Histórico completo de inspeções

### Perfil de Usuário
- Visualização e edição de dados pessoais
- Acompanhamento de plano (Trial/Premium)
- Gestão de permissões (Admin/Usuário)

## 🔒 Segurança

O projeto utiliza **Row Level Security (RLS)** do Supabase para garantir que:
- Usuários só podem acessar seus próprios dados
- Administradores têm permissões especiais
- Todas as operações passam por validação no backend

## 📱 Build e Deploy Android

### Preparação para Build

1. **Gere o build da aplicação web**
```bash
npm run build
```

2. **O build será gerado na pasta `dist/`**

### Opções de Deploy Android

#### 1. Google Play Store (Recomendado)

1. **Gerar AAB (Android App Bundle)**
   - Configure o projeto Android com assinatura de release
   - Execute o build do AAB usando Android Studio ou Gradle
   - AAB é o formato recomendado pela Google Play Store

2. **Criar conta de desenvolvedor**
   - Acesse o [Google Play Console](https://play.google.com/console)
   - Crie uma conta de desenvolvedor (taxa única de $25 USD)

3. **Upload do app**
   - Faça upload do AAB na Play Console
   - Configure as informações do app (descrição, screenshots, etc.)
   - Submeta para revisão da Google

#### 2. Instalação Manual (APK)

1. **Gerar APK de release**
   - Configure o projeto Android com assinatura
   - Execute `./gradlew assembleRelease` ou use Android Studio
   - O APK será gerado em `app/build/outputs/apk/release/`

2. **Instalar no dispositivo**
   - Transfira o APK para o dispositivo Android
   - Ative "Fontes desconhecidas" nas configurações
   - Toque no arquivo APK para instalar

#### 3. TestFlight / Beta Testing

Para testes beta antes do lançamento:
1. Gere o AAB/APK de release
2. Crie uma lista de testadores na Google Play Console
3. Envie o build para teste interno ou fechado

### Assinatura do App

⚠️ **Importante**: Todo app Android precisa ser assinado para publicação. Configure uma chave de assinatura antes de gerar builds de release.

```bash
# Exemplo de geração de keystore
keytool -genkey -v -keystore isfia-release-key.keystore -alias isfia -keyalg RSA -keysize 2048 -validity 10000
```

### Variáveis de Ambiente no App

Certifique-se de que as variáveis de ambiente do Supabase estão configuradas corretamente no build Android, pois elas serão incluídas no bundle final.

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para questões ou suporte, entre em contato através dos canais oficiais do projeto.

## 🧪 Testando o App

### Testes no Emulador Android

1. Abra o Android Studio
2. Crie um AVD (Android Virtual Device) ou use um existente
3. Inicie o emulador
4. Execute o app no emulador usando Android Studio ou instale o APK gerado

### Testes em Dispositivo Físico

1. Ative as **Opções de Desenvolvedor** no seu dispositivo Android:
   - Vá em Configurações > Sobre o telefone
   - Toque 7 vezes em "Número da versão"
2. Ative **Depuração USB** nas opções de desenvolvedor
3. Conecte o dispositivo via USB
4. Execute `adb devices` para verificar a conexão
5. Instale o app usando Android Studio ou via APK

### Testes no Navegador (Desenvolvimento)

Para testes rápidos durante o desenvolvimento:
```bash
npm run dev
```
Acesse `http://localhost:5173` no navegador para testar a interface antes de compilar para Android.

## 📱 Requisitos do Dispositivo

- **Android**: Versão 7.0 (API 24) ou superior
- **RAM**: Mínimo 2GB recomendado
- **Espaço**: Mínimo 50MB de armazenamento
- **Conexão**: Internet necessária para sincronização com Supabase

## 🐛 Solução de Problemas

### Problemas Comuns

**App não conecta ao Supabase**
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Confirme que o dispositivo tem conexão com internet
- Verifique as configurações de CORS no Supabase

**Erro ao compilar**
- Certifique-se de que todas as dependências estão instaladas: `npm install`
- Verifique se o Android SDK está configurado corretamente
- Limpe o cache do Gradle: `./gradlew clean`

**App não abre**
- Verifique os logs usando `adb logcat` ou Android Studio
- Confirme que o build foi assinado corretamente
- Verifique as permissões do app no AndroidManifest.xml

---

Desenvolvido com ❤️ usando React, TypeScript, Vite e Supabase para Android
