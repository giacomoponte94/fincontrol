# FinControl - TODO

## Database & Backend
- [x] Schema: tabela de dívidas (debts)
- [x] Schema: tabela de gastos fixos (fixed_expenses)
- [x] Schema: tabela de gastos variáveis (variable_expenses)
- [x] Schema: tabela de renda (income_entries)
- [x] Schema: tabela de alertas (alerts)
- [x] tRPC: routers de dívidas (CRUD)
- [x] tRPC: routers de gastos fixos (CRUD)
- [x] tRPC: routers de gastos variáveis (CRUD)
- [x] tRPC: routers de renda (CRUD)
- [x] tRPC: router de dashboard (consolidado)
- [x] tRPC: router de projeções/simulador
- [x] tRPC: router de alertas
- [x] tRPC: router de relatórios/PDF

## Frontend - Layout & Design
- [x] Design system: cores, tipografia, tokens (tema escuro elegante)
- [x] DashboardLayout com sidebar de navegação redimensionável
- [x] Navegação: Dashboard, Dívidas, Gastos Fixos, Gastos Variáveis, Renda, Histórico, Simulador, Relatórios

## Frontend - Páginas
- [x] Dashboard: KPIs, gráficos, visão geral, ações rápidas
- [x] Dívidas: listagem, cadastro, edição, exclusão, registro de pagamentos
- [x] Gastos Fixos: listagem, cadastro, edição, exclusão, toggle ativo/inativo
- [x] Gastos Variáveis: registro rápido, categorização, filtros
- [x] Renda: CRUD completo com suporte a renda recorrente
- [x] Histórico: timeline unificada com filtros por período
- [x] Simulador de cenários de quitação (avalanche/bola de neve)
- [x] Projeção de evolução das dívidas com gráficos
- [x] Alertas de vencimento no dashboard
- [x] Exportação de relatório PDF

## Testes
- [x] Testes unitários dos routers principais (7 testes passando)

## Melhorias Futuras
- [ ] Notificações push para vencimentos
- [ ] Importação de extratos bancários
- [ ] Metas financeiras com acompanhamento
- [ ] App mobile (PWA)

## Bugs
- [x] Cards KPI do Dashboard: números saindo da caixa no mobile (fonte muito grande)
- [x] Campo de método de pagamento (Pix, débito, dinheiro, crédito, transferência, boleto) em gastos variáveis, gastos fixos e pagamentos de dívidas
- [x] Renomear app de FinControl para FinControlling
- [x] Menu mobile: ícone hamburguer (3 listras) e fechar ao clicar em item de navegação
- [x] Campo de banco/instituição financeira (Bradesco, Santander, Itaú, Caixa, BB, Nubank, Inter, C6, Mercado Pago, XP, Outro) em gastos variáveis, gastos fixos e pagamentos de dívidas
- [x] Light mode com paleta GImports (azul marinho #1B3A6B, azul aço #2E6FA3, azul ciano #4BAFD6, fundo #F0F2F5)
- [x] Dark mode derivado da paleta GImports
- [x] Botão de alternância light/dark mode no DashboardLayout
- [x] Atualizar fontes para Nunito (sans-serif arredondada, estilo GImports) em todo o app
- [x] Campos de valor monetário: vírgula como separador decimal e ponto como separador de milhar (padrão BRL)
