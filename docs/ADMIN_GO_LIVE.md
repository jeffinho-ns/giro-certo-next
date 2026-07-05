# Papel do Admin no go-live

O admin é o operador do ecossistema no início. Sem ele, riders e lojistas não entram com segurança.

## Rotina diária (piloto)

1. **Cadastro de lojistas** — `/dashboard/partners`  
   Cria Partner + usuário (senha inicial). Pedir troca de senha no primeiro acesso (quando implementado).

2. **Aprovar delivery** — `/dashboard/delivery-registrations`  
   Moto e bike: documentos, selfie, veículo.

3. **Moderação social** — `/dashboard/moderation` / reports  
   Denúncias de posts, perfis.

4. **Torre de controle** — `/dashboard/control-tower`  
   Riders online, pedidos ativos, localização.

5. **Financeiro** — `/dashboard/settlements` / financial  
   Lotes de repasse, inadimplência (`isBlocked` no Partner).

6. **Disputas** — `/dashboard/disputes`  
   Problemas de entrega/pagamento.

## Smoke admin (dia do go-live)

- [ ] Login admin
- [ ] Criar lojista de teste
- [ ] Aprovar um cadastro delivery
- [ ] Ver rider online na torre
- [ ] Acompanhar pedido da vitrine até entrega
- [ ] Confirmar settlement / ledger sem erro

## O que o admin NÃO faz

- Não gerencia cardápio da loja (lojista no portal `/minha-loja`)
- Não é o cliente final (cliente usa `/loja/[slug]`)
