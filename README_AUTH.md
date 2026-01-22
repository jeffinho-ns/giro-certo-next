# Sistema de Autenticação e Autorização - Giro Certo Next

## 📋 Visão Geral

O sistema de autenticação foi implementado com suporte a três níveis de permissão:
- **USER**: Usuário comum
- **MODERATOR**: Moderador com acesso limitado ao painel administrativo
- **ADMIN**: Administrador com acesso total

## 🔐 Funcionalidades Implementadas

### 1. Autenticação
- Página de login (`/login`)
- Contexto de autenticação (`AuthContext`)
- Gerenciamento de token JWT no localStorage
- Logout automático em caso de token inválido

### 2. Proteção de Rotas
- Middleware Next.js para redirecionamento automático
- Componente `ProtectedRoute` para proteção de componentes
- Verificação de permissões baseada em roles

### 3. API Client
- Inclusão automática de token nas requisições
- Tratamento de erros 401 (não autorizado)
- Limpeza automática de token em caso de erro

## 🚀 Como Usar

### Configuração

1. Configure a variável de ambiente `NEXT_PUBLIC_API_URL`:
```env
NEXT_PUBLIC_API_URL=https://giro-certo-api.onrender.com
```

2. O sistema já está configurado para usar a API do Render por padrão.

### Login

Acesse `/login` e faça login com credenciais de um usuário que tenha role `ADMIN` ou `MODERATOR`.

### Proteger uma Rota

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';
import { UserRole } from '@/lib/types';

export default function MinhaPage() {
  return (
    <ProtectedRoute requireAdmin>
      {/* Conteúdo apenas para admins */}
    </ProtectedRoute>
  );
}
```

### Usar Autenticação em Componentes

```tsx
'use client';

import { useAuth } from '@/lib/contexts/auth-context';

export function MeuComponente() {
  const { user, isAuthenticated, isAdmin, isModerator, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Faça login para continuar</div>;
  }

  return (
    <div>
      <p>Olá, {user?.name}!</p>
      {isAdmin && <p>Você é um administrador</p>}
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

## 📝 Estrutura de Arquivos

```
giro-certo-next/
├── app/
│   ├── login/
│   │   └── page.tsx          # Página de login
│   └── dashboard/
│       └── users/
│           └── page.tsx      # Gerenciamento de usuários (apenas admin)
├── components/
│   ├── auth/
│   │   └── protected-route.tsx  # Componente de proteção
│   └── layout/
│       └── dashboard-layout.tsx  # Layout com proteção
├── lib/
│   ├── api.ts               # Cliente API com autenticação
│   ├── contexts/
│   │   └── auth-context.tsx # Contexto de autenticação
│   └── types/
│       └── index.ts         # Tipos incluindo UserRole
└── middleware.ts            # Middleware Next.js para proteção
```

## 🔒 Permissões

### Rotas Protegidas
- `/dashboard/*` - Requer autenticação e role MODERATOR ou ADMIN
- `/dashboard/users` - Requer role ADMIN

### Componentes de Proteção
- `ProtectedRoute` com props:
  - `requireAdmin`: Apenas admins
  - `requireModerator`: Moderadores e admins
  - `requiredRole`: Role específico

## ⚠️ Importante

1. **Token JWT**: O token é armazenado no localStorage e incluído automaticamente em todas as requisições
2. **Atualização de Role**: Apenas administradores podem atualizar roles de outros usuários
3. **Auto-logout**: Se o token expirar ou for inválido, o usuário é automaticamente deslogado
4. **API URL**: Por padrão, o sistema usa `https://giro-certo-api.onrender.com`

## 🐛 Troubleshooting

### Erro 401 ao fazer login
- Verifique se a API está rodando
- Verifique se `NEXT_PUBLIC_API_URL` está configurado corretamente
- Verifique se o usuário existe e tem role ADMIN ou MODERATOR

### Redirecionamento infinito
- Limpe o localStorage: `localStorage.clear()`
- Verifique se o middleware está configurado corretamente

### Token não está sendo enviado
- Verifique se o token está sendo salvo após o login
- Verifique o console do navegador para erros
