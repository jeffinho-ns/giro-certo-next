# Operação do piloto

Playbook mínimo para o piloto em produção. Detalhe do admin: [`ADMIN_GO_LIVE.md`](./ADMIN_GO_LIVE.md).  
Smoke em casa: `giro-certo-api/docs/SMOKE_TEST_CASA.md`.

---

## Escopo do piloto

- **1–2 lojas** convidadas, não abertura pública.
- **Poucos riders** aprovados (só os da lista).
- Cliente final só pela **vitrine web** (`/loja/[slug]`).
- Não escalar marketing / convites em massa até o smoke de settlement e o plantão estarem estáveis.

---

## Quem faz o quê

| Papel | Responsável | Faz |
|-------|-------------|-----|
| Admin / ops | Plantão Giro | Aprovar delivery, torre, bloquear loja, settlements, disputas |
| Lojista | Dono da loja piloto | Horário, produtos, aceitar/recusar pedidos, conta de repasse |
| Entregador | Riders da lista | Online, aceitar oferta, PIN, concluir, conta de repasse |
| Cliente | Quem compra na vitrine | Pedido + PIX + acompanhar `/pedido/[token]` |
| Tech (on-call) | Dev | API/health, webhook Asaas, logs, rollback |

---

## Checklist antes de convidar uma loja real

- [ ] API `/health` com `"db": "up"` em produção
- [ ] Webhook Asaas apontando e testado (sandbox ou 1 pagamento real controlado)
- [ ] Admin consegue login + torre + partners + delivery-registrations + settlements
- [ ] Conta lojista criada; `slug` da vitrine testado no celular
- [ ] Loja: horário, ≥1 produto com preço, **não** `isBlocked`
- [ ] Conta de repasse do lojista preenchida
- [ ] ≥1 rider aprovado, online, com conta de repasse
- [ ] 1 pedido supervisionado: vitrine → PIX → aceite → entrega → mapa
- [ ] Pendência aparece em `/dashboard/settlements` após aceite (bridge StoreOrder→ledger)
- [ ] Canal de plantão combinado (WhatsApp/e-mail em `ADMIN_GO_LIVE.md`)
- [ ] Lojista sabe: aceitar/recusar, que recusa de pago gera estorno Asaas, e a quem ligar

---

## Escalação

### Disputa (cliente vs loja / rider)

1. Registar em `/dashboard/disputes` (se disponível) + anotar IDs: `StoreOrder`, `DeliveryOrder`, tracking token.
2. Torre: estado da entrega e rider.
3. Falar com lojista e rider no canal de plantão.
4. Decisão: reentrega, crédito comercial, ou estorno (ver abaixo).
5. Se produto de disputas incompleto: tratar só por WhatsApp/e-mail e log manual.

### Estorno / reembolso

| Situação | Ação |
|----------|------|
| Lojista **recusa** pedido já pago | Estorno Asaas automático (já implementado) — confirmar no painel Asaas |
| Cliente pede cancelamento **antes** do despacho | Lojista recusa / cancela no portal; confirmar estorno |
| Após rider a caminho / entregue | **Não** estornar às cegas — alinhar admin + lojista; se necessário, estorno manual no Asaas e anotar IDs |
| Pagamento duplicado / webhook estranho | Tech: logs + reconciliar cobranças em `/dashboard/settlements` |

### Entrega falhou

| Sintoma | Quem | Ação |
|---------|------|------|
| Sem rider / oferta não chega | Admin | Torre; rider online? cadastro aprovado? |
| Rider cancela / some | Admin + lojista | Redispatch se possível; senão cancelar pedido e estorno conforme tabela acima |
| Código loja / PIN cliente errado | Rider + lojista | Conferir código no portal; não forçar conclusão |
| Mapa sem GPS | Tech | Entrega ativa + rider a enviar localização |
| Loja bloqueada no meio do dia | Admin | Só com motivo (inadimplência); avisar lojista |

---

## Rotina diária (ops)

Ver tabela em [`ADMIN_GO_LIVE.md`](./ADMIN_GO_LIVE.md) — Rotina diária (piloto).

Mínimo: torre + cadastros pendentes + settlements (pendências / `transfer_failed`).

---

## Fora de escopo neste piloto

- Abertura ampla de lojas ou riders
- Disputas avançadas no app
- Liquidação 100% automática sem olhar o painel (compose/cron pode existir; ops ainda confere)
- Package ID / lojas de app / Firebase de produção (só no final do projeto)
