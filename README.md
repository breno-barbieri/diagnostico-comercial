# Diagnóstico Comercial

Autodiagnóstico comercial usado nas aulas do Breno Barbieri (G4 Traction) e evolução da antiga isca de cinco perguntas. A versão anterior, estática, está guardada em `legado/`.

**No ar:** https://diagnostico-comercial-livid.vercel.app

## O que tem

- `/?turma=NOME`: formulário em 7 etapas (identificação opcional, contexto, percepção e expectativa, funil, economia da venda, rotina e gestão, síntese)
- `/resultado/[id]`: resultado individual com nível, ações da próxima semana, funil, economia da venda e medição
- `/painel?turma=NOME`: painel da turma para projetar em sala, atualiza a cada 10 segundos
- `/folha`: versão A4 para impressão
- `/controle`: controle semanal de 8 semanas (A4 paisagem)

Todo o conteúdo (perguntas, leituras, ações, faixas, níveis) fica em `diagnostico.config.ts`.

## Regras de cálculo

- A etapa prioritária para investigar é aquela em que o resultado informado ficou proporcionalmente mais abaixo da expectativa do próprio aluno (pergunta "de cada 10, quantos você espera"). Não é referência de mercado nem comprova a restrição do negócio, e só é apontada quando os dois números da etapa são reais. Follow-up, qualificação e proposta de valor são hipóteses.
- Etapa que não existe no negócio é marcada "não se aplica" e sai da comparação. Quando faltam etapas comparáveis, o resultado avisa que a análise é parcial.
- Números que não afunilam (por exemplo, mais atendimentos que contatos) geram um alerta para conferir a base, sem bloquear o envio.
- Negócio misto: o aluno escolhe uma operação e responde sobre ela.
- O gasto comercial por venda (G ÷ D) não é CAC e não mostra o custo de uma venda adicional.
- As faixas de referência de mercado estão desligadas (`usarFaixas: false`) até serem definidas.

## Dados e privacidade

- Valores em reais e volumes são calculados no navegador e não vão para o banco. O banco recebe nível, pontos, conversões em percentual, expectativas, marcações real ou estimado, respostas de contexto e rotina, gargalos, compromisso e, só com consentimento, a identificação.
- `identificacaoAtiva: false` em `diagnostico.config.ts` deixa o diagnóstico 100% anônimo.

## Banco

- **Produção:** Supabase. Rode `supabase/schema.sql` uma vez no SQL Editor e configure na Vercel as variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (ver `.env.example`).
- **Local:** sem essas variáveis, o app usa SQLite em `data/diagnostico.db`.

## Rodar e publicar

```bash
npm install
npm run dev            # http://localhost:3000
npm run typecheck
npm run seed           # 30 respostas fictícias na turma "demo" (banco local)
npm run seed:prod      # o mesmo no Supabase, lendo .env.local
vercel deploy --prod   # publica
```
