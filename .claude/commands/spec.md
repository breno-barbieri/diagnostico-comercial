---
description: Cria uma spec em .docs/specs/<data>-<slug>.md a partir do modelo.
argument-hint: <slug-e-descricao-em-uma-linha>
---

Você vai criar uma spec nova. Siga este procedimento.

1. Leia o AGENTS.md e `.agents/rules/writing-voice.md`.
2. Leia `.agents/references/artifact-layers.md` e confirme que o pedido é uma spec, não um plano ou decisão.
3. Leia `.docs/templates/spec.md`.
4. Inspecione os arquivos citados antes de perguntar. Toda afirmação da spec (comportamento atual, números, limites) vem do código, de dado ou do usuário. Sem evidência, pergunte.
5. Pergunte só o que muda escopo, efeito colateral ou critério de aceite: história de uso (quem, o quê, por quê), o que entra e o que fica de fora, como saber que terminou, serviços externos e seus limites.
6. Grave em `.docs/specs/<AAAA-MM-DD>-<slug>.md` com a data de hoje e o slug de `$ARGUMENTS` em kebab-case.
7. Preencha todas as seções do modelo. Sem TODO, a não ser em "Open questions".
8. Critérios de aceite numerados e testáveis (Dado/Quando/Então).

Não escreva código neste passo. Ao terminar, informe o caminho, o status (Draft) e as principais dúvidas abertas.
