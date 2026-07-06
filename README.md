# Swipe Vault — Banco de Ofertas Vencedoras

App web para salvar, organizar e analisar anúncios de Facebook Ads vencedores
(seus ou de concorrentes), estudar padrões e priorizar o que testar.

Versão **v1** — foco em **organização e visualização**. Inteligência e automação
já têm a interface pronta, mas rodam **mockadas** (heurística local) por enquanto.

## Como rodar localmente

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build
npm start
```

## Deploy na Vercel

1. Suba este projeto para um repositório (GitHub/GitLab).
2. Em vercel.com → **New Project** → importe o repositório.
3. Framework: **Next.js** (detectado automaticamente). Não precisa de nenhuma
   variável de ambiente no v1.
4. Deploy. Pronto.

Os dados ficam salvos no **navegador (IndexedDB)** — não há banco no v1. Isso
significa: rápido, grátis, sem login; porém os dados ficam só naquele navegador.

## O que já funciona (v1)

**Organização (prioridade 1)**
- 3 views: **Grade** (cards), **Lista** (tabela) e **Kanban** por status com
  arrastar-e-soltar (Para Testar → Testando → Validada → Escalando → Descartada).
- **Página de detalhe** de cada oferta com todos os campos, histórico de edições,
  anexos (prints/variações) e score detalhado.
- **Tags livres** (nicho, país, idioma) com **filtro combinado** (E lógico).
- **Busca full-text** em nome, copy, notas, gancho, público e tags.
- Filtros por tipo de criativo, tipo de LP e status; ordenação por recentes/score/nome.
- **Cadastro rápido**: modal enxuto com campos avançados recolhidos.
- Editar, duplicar, excluir, fixar como prioridade.
- Importar/Exportar **CSV** (respeitando os filtros na exportação).
- **Lembretes** de ofertas "Para Testar" paradas há +7 dias.
- Tema claro/escuro.

**Inteligência (prioridade 2 — mockada)**
- Botão **"Extrair"** metadados do link (deduz plataforma/nome — mock).
- **Assistente de copy**: detecta gancho, público, pontos fortes e sugere
  variações de hook (heurística local).
- **Detecção de duplicatas** ao cadastrar (avisa ofertas parecidas).
- Detecção de **padrões**: ganchos recorrentes e LP mais usada por nicho.

**Métricas (prioridade 3)**
- Dashboard: KPIs, ofertas por semana, funil de status, distribuição por tipo de
  criativo/LP/nicho.
- **Score de prioridade** (0-100) calculado por critérios transparentes
  (tempo ativo, link+LP, nicho, riqueza da copy, sinal de escala).

**Automação (mockada)**
- Painel com toggle ativar/desativar, horários **07:00 / 12:00**, botão
  **"Verificar agora"** e histórico de contagem de anúncios ativos por oferta.
- No v1 a contagem é **simulada** — a estrutura está pronta para a fase 2.

## Arquitetura (pensada para a fase 2)

A camada de dados é **isolada** em `src/lib/repository.ts` sobre IndexedDB
(`src/lib/db.ts`). A UI nunca fala direto com o armazenamento. Migrar para
**Supabase** (nuvem + login) na fase 2 = reescrever só o `repository`.

O "serviço de IA" está isolado em `src/lib/aiService.ts`. Cada função foi
desenhada para virar uma chamada a `/api/ai/*` (backend Next.js) que fala com a
**API da Claude** — sem mudar a assinatura usada pela UI.

```
src/
  app/                 páginas (dashboard, oferta/[id], métricas)
  components/          UI (views, form, painéis, gráficos)
  lib/
    types.ts           modelo de dados
    db.ts              IndexedDB (Dexie)  ← troca por Supabase na fase 2
    repository.ts      fronteira de dados ← única peça a reescrever
    aiService.ts       IA mockada         ← vira chamada à API Claude
    scoring.ts         cálculo do score
    csv.ts             import/export
    store.ts           estado (Zustand) + filtros
    seed.ts            dados de exemplo
```

## Roadmap fase 2

- **Supabase**: dados na nuvem, acesso de qualquer PC, login e multiusuário.
- **IA real** via API da Claude (backend): análise de copy, ganchos, extração de
  metadados. ⚠️ A chave da API fica **só no backend** (variável de ambiente),
  nunca no frontend.
- **Coletor da Ad Library do Facebook** + **cron 07:00/12:00** para contar
  anúncios ativos das ofertas escaladas e gerar feedback automático.
- Colaboração: comentários, atribuição de quem testa, checklist compartilhado.
- Exportação em PDF.
