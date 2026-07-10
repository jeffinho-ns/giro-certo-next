# Papel do Admin no go-live

O admin é o operador do ecossistema no início. Sem ele, riders e lojistas não entram com segurança.

Referência de smoke em casa: `giro-certo-api/docs/SMOKE_TEST_CASA.md`.  
Operação do piloto: [`OPERACAO_PILOTO.md`](./OPERACAO_PILOTO.md).

---

## Dia 0 (antes de abrir o piloto)

1. Login admin em `/login` → dashboard carrega.
2. Confirmar lojista(s) piloto em `/dashboard/partners` (conta + `slug` + não bloqueado).
3. Aprovar entregadores piloto em `/dashboard/delivery-registrations`.
4. Pedir a lojista/rider que preencham **conta de repasse** (perfil bancário) no app/portal.
5. Abrir `/dashboard/settlements` e confirmar que a tela carrega (resumo + lotes).
6. Combinar canal de plantão (WhatsApp/e-mail — ver secção Contato).
7. **Não** convidar lojas além do escopo do piloto (1–2 lojas).

---

## Rotina diária (piloto)

Fazer **1× por dia** (manhã ou fim do expediente):

| # | O quê | Onde |
|---|--------|------|
| 1 | Cadastros delivery pendentes | `/dashboard/delivery-registrations` |
| 2 | Torre: riders online + pedidos ativos | `/dashboard/control-tower` |
| 3 | Disputas / reclamações | `/dashboard/disputes` (se houver) |
| 4 | Moderação social (se piloto social ativo) | `/dashboard/moderation` |
| 5 | Financeiro: pendências no livro + lotes com falha | `/dashboard/settlements` |
| 6 | Bloquear loja inadimplente se necessário | `/dashboard/partners` → **Bloquear** |

**Repasse (quando houver saldo pendente):** ver [Settlement — caminho feliz](#settlement--caminho-feliz-vitrine).

---

## Rotina por papel (resumo)

1. **Cadastro de lojistas** — `/dashboard/partners`  
   Cria Partner + usuário (senha inicial). Pedir troca de senha no primeiro acesso (quando implementado).

2. **Aprovar delivery** — `/dashboard/delivery-registrations`  
   Ver [Aprovar cadastro delivery](#aprovar-cadastro-delivery).

3. **Moderação social** — `/dashboard/moderation` / reports  
   Denúncias de posts, perfis.

4. **Torre de controle** — `/dashboard/control-tower`  
   Riders online, pedidos ativos, localização.

5. **Financeiro** — `/dashboard/settlements`  
   Lotes de repasse; inadimplência via `isBlocked` (ver abaixo).

6. **Disputas** — `/dashboard/disputes`  
   Problemas de entrega/pagamento. Escalação: [`OPERACAO_PILOTO.md`](./OPERACAO_PILOTO.md).

---

## Aprovar cadastro delivery

1. Abrir `/dashboard/delivery-registrations`.
2. Filtrar por **Pendente** / **Sob revisão**.
3. Abrir o cadastro (olho) e conferir: documentos, selfie, veículo (moto ou bike).
4. **Aprovar** ou **Rejeitar** (com motivo, se rejeitar).
5. Só depois disso o entregador deve ficar online e receber ofertas.

---

## Bloquear parceiro inadimplente (`isBlocked`)

1. Abrir `/dashboard/partners`.
2. Localizar a loja (filtro “bloqueados” se precisar).
3. Clicar **Bloquear** (confirmação).
4. Efeito: loja deixa de aparecer como aberta na vitrine; checkout e despacho ficam bloqueados.
5. Para reabrir: **Desbloquear** no mesmo ecrã.

API: `PUT /api/partners/:id/block` com `{ "isBlocked": true|false }` (só admin).

---

## Settlement — caminho feliz (vitrine)

A ponte **StoreOrder → DeliveryPayment + ledger** já existe no aceite do lojista. Não é preciso “liquidar” o pedido à mão no banco.

### Pré-requisitos

- Pedido da vitrine **pago** (PIX/webhook Asaas).
- Lojista **aceitou** o pedido → nasce `DeliveryOrder` e a bridge grava linha **pendente** no livro.
- Rider aceitou (preenche `riderUserId` no ledger) e a entrega concluiu (ideal para o piloto).
- Beneficiário com **conta de repasse** preenchida (`payout_bank_account_json`).
- Para transferência real: `ASAAS_ENABLE_PAYOUTS=true` na API.

### Passos no admin

1. Confirmar que o pedido da loja chegou a **concluído** (torre / portal lojista / `/pedido/[token]`).
2. Abrir `/dashboard/settlements`.
3. Ver resumo: pendências por **loja** e por **rider** (valores líquidos).
4. Clicar **Compor lotes** (agrupa o livro pendente em lotes `pending_transfer`).
5. Na tabela **Lotes de repasse**, em cada lote elegível, clicar **Repassar**.
6. Anotar o ID Asaas da transferência (mensagem de sucesso / coluna do lote).
7. Se algo falhar: **Reconciliar cobranças** / **Reconciliar transferências**; lotes `transfer_failed` → corrigir conta bancária e tentar de novo.

### Notas

- Compose também pode rodar via cron (`compose-scheduled`); no piloto, o botão manual basta.
- Pedidos só da vitrine: o ledger entra no **aceite**, não no clique de “concluir” — se o resumo estiver vazio após aceite+pago, checar logs da bridge / pagamento Asaas.

---

## Smoke admin (dia do go-live)

Itens cobertos pelo smoke em casa (`SMOKE_TEST_CASA.md` §1 e loop §§2–6):

- [x] Login admin
- [x] Criar lojista de teste
- [x] Aprovar um cadastro delivery
- [x] Ver rider online na torre
- [x] Acompanhar pedido da vitrine até entrega *(loop smoke: vitrine → PIX → aceite → rider → mapa)*

Ainda validar no ambiente piloto / produção:

- [ ] Confirmar settlement / ledger sem erro  
  → caminho: pedido pago + aceite → pendência em `/dashboard/settlements` → **Compor lotes** → **Repassar** (sandbox OK)

---

## Contato de suporte (preencher)

| Canal | Valor |
|-------|--------|
| WhatsApp plantão | _a preencher_ |
| E-mail suporte | _a preencher_ |
| Horário de plantão | _a preencher_ |

Usar estes contactos na comunicação com lojistas/riders do piloto. Não colocar tokens nem chaves Asaas aqui.

---

## O que o admin NÃO faz

- Não gerencia cardápio da loja (lojista no portal `/minha-loja`)
- Não é o cliente final (cliente usa `/loja/[slug]`)
