# Camadas de artefato

Use ao criar, editar, mover ou entregar um documento durável do projeto. Classifique pela evidência (arquivos citados, `git status`, spec ou plano ativo), não só pelo pedido.

| Camada                | Para quê                                  | Vai aqui                                         | Não vai aqui                              |
| --------------------- | ----------------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| `AGENTS.md`           | roteador enxuto                           | invariantes, índice de tarefas, ponteiros        | explicação longa, histórico               |
| `.agents/rules/`      | regras obrigatórias                       | do/don't curtos                                  | exemplos que cabem em template            |
| `.agents/workflows/`  | procedimentos                             | autorrevisão, delegação                          | requisito de produto                      |
| `.agents/references/` | consulta                                  | mapas, catálogos, taxonomia                      | regra que precisa ser sempre obedecida    |
| `README.md`           | porta de entrada humana                   | como rodar, estrutura, build e deploy            | plano de implementação                    |
| `.docs/specs/`        | o que e por quê                           | problema, escopo, critérios de aceite            | passo a passo de implementação            |
| `.docs/decisions/`    | decisões (ADR)                            | decisão, alternativas, consequências             | checklist de tarefa                       |
| `.claude/commands/`   | comandos de barra                         | prompts curtos que carregam o AGENTS.md          | documentação longa                        |
| `CLAUDE.md` e afins   | adaptadores por ferramenta                | import fino do AGENTS.md                         | regra duplicada                           |

## Spec ou plano

- Spec: o que, por quê, critério de aceite. Use para comportamento do produto e resultado para o usuário.
- Plano: como, em que ordem, quais arquivos, como verificar. Use depois da spec ou numa mudança já conhecida.
- Decisão: escolha feita, com alternativas descartadas e motivo.

Pastas novas (`.docs/specs/`, `.docs/decisions/`) são criadas quando o primeiro arquivo delas existir.
