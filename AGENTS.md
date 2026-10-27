# AGENTS.md

Hub para agentes de IA (Claude Code, Cursor, Codex, Gemini etc.) neste repo. Leia primeiro. É um índice: diz o que carregar a seguir, sem repetir o conteúdo dos arquivos.

A stack e o fluxo estão no `README.md`. Em resumo: Next.js com banco Supabase em produção e SQLite local. A isca estática anterior está em `legado/`.

## Protocolo

1. Comece aqui.
2. Classifique a tarefa pela evidência (caminhos citados, `git status`, diff, erro relatado), não só pelo pedido.
3. Carregue só as regras da tabela abaixo que a tarefa toca.
4. Antes de dizer que está pronto, rode as verificações e a autorrevisão (`.agents/workflows/self-review.md`).

Pergunte uma coisa só, e só quando a dúvida mudar o tipo de entrega, um efeito colateral ou o que o usuário vê. Fora isso, escolha o padrão mais seguro e siga.

## Invariantes

- Todo texto entregue a uma pessoa segue `.agents/rules/writing-voice.md`: sem travessão como pontuação e sem frase de efeito, aforismo ou metáfora. Vale para chat, commit, PR, doc, texto da página e prompt de IA.
- Responda e escreva em português. Subagentes recebem o pedido em português.
- Conteúdo do diagnóstico fica em `diagnostico.config.ts`. `npm run typecheck` tem de passar.
- Valores em reais e volumes nunca vão para o banco. Identificação só com consentimento (ver README, "Dados e privacidade").
- Não diga que o usuário precisa conferir visualmente quando há navegador/Playwright disponível: abra a página e confira.
- Não contorne verificação com `--no-verify`, código comentado ou teste pulado. Corrija a causa.
- Conventional Commits. Push e deploy (`vercel deploy --prod`) só quando o Breno pedir.

## Roteador de tarefas

| Tarefa                           | Leituras                                                                     | Verificação                                                          |
| -------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Qualquer texto para uma pessoa   | `.agents/rules/writing-voice.md`                                             | Nenhuma, se não mudou arquivo.                                       |
| Pergunta ou auditoria (leitura)  | Só o que for relevante; cite os arquivos olhados.                            | Nenhuma, se não mudou arquivo.                                       |
| Mudança no repo                  | `.agents/workflows/self-review.md`                                           | `npm run typecheck`, página aberta no navegador, 390 px e desktop.   |
| Spec / plano / documento         | `.agents/references/artifact-layers.md`; `.docs/templates/spec.md` só para spec | Arquivo no lugar certo, sem TODO solto.                           |
| Delegar a subagentes             | `.agents/workflows/multi-agent.md`                                           | Revisar o diff antes de aceitar.                                     |

## Camadas

| Camada                | Uso                                                              |
| --------------------- | ---------------------------------------------------------------- |
| `AGENTS.md`           | Roteador enxuto.                                                 |
| `.agents/rules/`      | Regras obrigatórias por assunto.                                 |
| `.agents/workflows/`  | Procedimentos repetíveis (autorrevisão, delegação).              |
| `.agents/references/` | Material de consulta.                                            |
| `.docs/`              | Specs e decisões duráveis. Modelo em `.docs/templates/spec.md`.  |
| `CLAUDE.md`           | Adaptador do Claude Code. Aponta para este arquivo.              |

Se um adaptador discordar deste arquivo, este vence e o adaptador é corrigido.
