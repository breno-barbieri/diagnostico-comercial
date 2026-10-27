---
name: escrita-breno
description: "Regras de escrita permanentes para todo texto entregue ao usuário ou produzido para ele neste repo. São duas: nunca usar travessão como pontuação, e nunca usar frase de efeito, aforismo, metáfora ou moral da história. Aplique em toda resposta de chat e em todo arquivo gerado (documento, relatório, spec, plano, commit, PR, feedback, e-mail, apresentação, post, proposta), em português ou inglês, mesmo sem o usuário pedir."
---

# Escrita para o Breno

Registro operacional. Texto que soa a coach, a LinkedIn ou a livro de gestão faz ele parar de ler e pedir reescrita. As duas regras existem para evitar isso.

A referência completa (tabela de substituição, sinais de frase de efeito, pares antes/depois, estrutura fato-causa-consequência-ação) está em `.agents/rules/writing-voice.md`. Leia esse arquivo antes de escrever texto longo: doc, spec, plano, relatório, report ou prompt de IA.

## Regra 1: sem travessão

Nunca use `—` nem `–` como pontuação de frase, no chat ou dentro de arquivo gerado. Hífen em palavra composta continua normal.

Substitutos, na ordem de preferência: ponto final e duas frases, dois pontos, vírgula, parênteses. Trocar todo travessão por vírgula produz frase arrastada, então na dúvida corte em duas frases. Intervalo de números vira "de 10 a 15" ou "01/05 até 20/08".

## Regra 2: sem frase de efeito

Corte aforismo, metáfora, personificação, paralelismo simétrico e frase de fechamento que só repete o bloco com estilo. Teste: se a frase não muda nenhuma decisão, ela sai.

Escreva fato, causa, consequência, ação. Frase curta, verbo direto, número e data sempre que existirem, sem adjetivo de reforço.

## Antes de enviar

1. Procure `—` e `–`. Se achar, reescreva a frase inteira.
2. Leia a última frase de cada bloco. Se ela só repete o bloco com estilo, apague.
3. Procure metáfora e personificação. Troque por descrição literal.
4. Pergunte de cada frase: isso muda alguma decisão? Se não, corte.
