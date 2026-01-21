# 🏍️ Giro Certo Admin Dashboard

Painel administrativo para gerenciamento do ecossistema Giro Certo.

## 🚀 Tecnologias

- **Next.js 14+** (App Router) com **TypeScript**
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes UI
- **TanStack Query** - Gerenciamento de estado e cache
- **Recharts** - Gráficos e visualizações
- **Leaflet/React-Leaflet** - Mapas interativos

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn

## 🔧 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
# Edite o arquivo .env.local com suas configurações
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📁 Estrutura do Projeto

```
giro-certo-next/
├── app/
│   ├── (dashboard)/    # Rotas do dashboard (protegidas)
│   ├── api/            # API Routes
│   ├── globals.css     # Estilos globais
│   └── layout.tsx      # Layout principal
├── components/
│   └── ui/             # Componentes Shadcn/UI
├── lib/
│   └── utils.ts        # Utilitários
└── public/             # Arquivos estáticos
```

## 🔑 Funcionalidades Principais

- ✅ **Dashboard (Torre de Controle)** - Mapa em tempo real com motociclistas e pedidos
- ✅ **Gestão de Delivery** - Monitoramento de pedidos (pending, accepted, inProgress, completed)
- ✅ **Financeiro** - Relatórios de comissões e sistema de repasse
- ✅ **Módulo de Assinantes** - Listagem Premium e estatísticas
- ✅ **Gamificação** - Configuração de bonificações e campanhas
- ✅ **Moderação Social** - Gestão de posts da comunidade

## 🎨 Tema

- Suporte a tema Dark/Light
- Design moderno e responsivo
- Componentes acessíveis (Shadcn/UI)

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## 🔒 Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

## 📚 Componentes UI

Adicione componentes do Shadcn/UI conforme necessário:

```bash
npx shadcn@latest add [component-name]
```

## 🗺️ Mapas

O projeto utiliza Leaflet para mapas interativos. Configure sua chave do Mapbox (opcional) para melhor visualização:

```env
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token"
```

## 📊 Gráficos

Utiliza Recharts para visualizações de dados:
- Performance da frota
- Volume de entregas
- Estatísticas financeiras
- Métricas de assinantes
