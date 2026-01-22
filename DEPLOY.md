# Deploy do Giro Certo Next

## 🚀 Deploy na Vercel (Recomendado)

### 1. Conectar Repositório
1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório `giro-certo-next`
3. Configure o projeto

### 2. Variáveis de Ambiente
Configure as seguintes variáveis de ambiente na Vercel:

```
NEXT_PUBLIC_API_URL=https://giro-certo-api.onrender.com
NEXT_PUBLIC_WS_URL=wss://giro-certo-api.onrender.com
```

### 3. Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (ou `yarn build`)
- **Output Directory**: `.next` (padrão do Next.js)
- **Install Command**: `npm install` (ou `yarn install`)

### 4. Deploy
Após configurar, o deploy será automático a cada push no `main`.

## 🔧 Verificação Pós-Deploy

Após o deploy, verifique:

1. **Health Check da API**:
   ```bash
   curl https://giro-certo-api.onrender.com/health
   ```

2. **Teste de Login**:
   - Acesse: `https://seu-dominio.vercel.app/login`
   - Email: `jeffersonlima@ideiaum.com.br`
   - Senha: `@123Mudar`

3. **Verificar Console do Navegador**:
   - Abra DevTools (F12)
   - Verifique se não há erros de conexão com a API

## ⚠️ Importante

- Certifique-se de que a API no Render está rodando e acessível
- A variável `NEXT_PUBLIC_API_URL` deve apontar para `https://giro-certo-api.onrender.com`
- O CORS na API deve permitir o domínio da Vercel

## 🔄 Atualizar CORS na API

No painel do Render, atualize a variável de ambiente `CORS_ORIGIN`:

```
CORS_ORIGIN=https://seu-dominio.vercel.app
```

Ou para permitir múltiplos domínios:
```
CORS_ORIGIN=https://seu-dominio.vercel.app,http://localhost:3000
```
