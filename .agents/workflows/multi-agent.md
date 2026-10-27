# Delegação a subagentes

## O que o pai entrega

1. Objetivo em uma frase.
2. Contexto: caminhos, spec ou plano ativo, restrições, arquivos a evitar.
3. Critério de aceite concreto (build sem erro, página conferida no navegador).
4. Formato da resposta: resumo, arquivos tocados, verificações com resultado, bloqueios.

## O que o subagente devolve

Resumo em prosa, arquivos criados/alterados/apagados, cada verificação com o resultado, e o que ficou ambíguo ou bloqueado.

## Regras

- O pedido ao subagente vai em português.
- Subagente não faz push, não reescreve commit que não é dele e, por padrão, não comita. O pai revisa o diff e comita.
- Dois subagentes na mesma pasta não editam o mesmo arquivo. `public/index.html` é gerado: só o pai roda `build.py`.
- Para HTML, relatório ou protótipo entregue, o subagente confere no navegador e devolve a URL e o caminho do arquivo.
- Se a dúvida mudar o tipo de entrega ou um efeito colateral, pergunta ao pai. Fora isso, segue o padrão mais seguro.
