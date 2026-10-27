# Diagnóstico Comercial · qual onda a sua operação sustenta

Isca de captação de cinco perguntas. O visitante responde, recebe na tela um
relatório com a onda que a operação sustenta, a trava principal, as ações dos
próximos 30 dias e três materiais de apoio, e pode salvar tudo em PDF. O CTA
abre o WhatsApp com o resultado já escrito na mensagem.

**No ar:** https://diagnostico-comercial-livid.vercel.app

> A outra URL que a Vercel imprime no deploy (`...-breno-babieris-projects.vercel.app`)
> é protegida por SSO e pede login. Só o alias curto acima é público.

## Como funciona

Uma página, sem backend. Todo o diagnóstico roda no navegador do visitante e
**nada é enviado para servidor nenhum** — não há banco, não há captura de lead.
O único sinal que chega ao Breno é a mensagem que a pessoa escolhe mandar no
WhatsApp. Quem conclui e fecha a aba não deixa rastro.

Isso é intencional e está escrito na tela antes do resultado. Ver
[Captura de leads](#captura-de-leads-decisão-pendente) antes de mudar.

O arquivo final é autocontido: as duas fontes e o favicon entram embutidos em
base64, e não há uma única requisição externa. Isso é requisito para publicar a
mesma página como Artifact do Claude (o CSP de lá bloqueia CDN de fontes) e é o
que garante render idêntico em qualquer hospedagem estática.

## Estrutura

```
src/index.template.html   ← a fonte. É aqui que se edita.
src/head.html             ← <head> do site: metadados de preview, canonical, theme-color
fonts/*.woff2             ← Fraunces e Inter, já subsetadas (55 KB no total)
build.py                  ← injeta fontes + favicon e gera public/index.html
public/index.html         ← GERADO. Não edite à mão.
public/materiais/         ← os arquivos que o relatório oferece para download
public/favicon.svg
```

`src/index.template.html` é o arquivo publicável como Artifact do Claude por si
só (tem `<title>` próprio e não depende do `head.html`). O `build.py` só o
embrulha num HTML completo para virar site.

## Build e deploy

```bash
python3 build.py           # gera public/index.html
python3 build.py --check   # falha se o gerado estiver defasado (bom para CI)
vercel deploy --prod       # publica
```

Sem dependências: só Python 3 da própria máquina.

**Editou `src/` ou `fonts/`? Rode o build e comite `public/index.html` junto.**
O deploy é estático puro, sem etapa de build na Vercel — o que está commitado é
o que vai para o ar.

## O que editar

Tudo que é conteúdo está em estruturas de dados no topo do `<script>`, não
espalhado no HTML:

| Estrutura | O que controla |
|---|---|
| `CONFIG` | número do WhatsApp e `ENDPOINT` de captura (hoje vazio) |
| `MATERIAIS` | os materiais de apoio. Lista vazia esconde a seção inteira |
| `Q` | as cinco perguntas, cada uma com quatro opções valendo nível 0 a 3 |
| `ONDAS` | nomes das ondas |
| `TRAVAS` | o diagnóstico de cada camada, em variante `grave` (nível 0-1) e `medio` (nível 2) |
| `TOPO` | texto de quem tira nível 3 nas cinco camadas, onde não existe trava |

### A regra que não deve ser "corrigida"

**A onda da operação é o menor nível do conjunto, nunca a média.** Uma camada
ausente derruba tudo que depende dela, então `Math.min` é proposital. Empate no
menor nível é resolvido pela **ordem do array `Q`**, que é a ordem de
pré-requisito: base, cultura, gatilho, SLA, dado. Trocar a ordem das perguntas
muda qual trava é apontada.

### Materiais de apoio

Cada item de `MATERIAIS` tem `para`, que é o id da camada que ele resolve
(`base`, `rito`, `gatilho`, `sla`, `dado`, ou `null`). Quando bate com a trava
da pessoa, o material ganha o selo "resolve a sua trava".

Arquivo novo vai em `public/materiais/` com nome sem espaço nem acento, e o
`href` aponta para `/materiais/<arquivo>`. Para link externo (Drive, Sheets),
troque `baixar: true` pelo link e ele abre em nova aba.

## Pendências

- **Captura de leads (decisão pendente).** `CONFIG.ENDPOINT` vazio = nada sai do
  navegador. Preenchendo com uma URL, a página passa a postar o resultado. Se
  fizer isso, **o texto da tela "Antes de abrir o resultado" tem de mudar junto**:
  ele hoje afirma que nada é enviado para ninguém, e viraria mentira. O
  formulário também não pede e-mail nem telefone hoje, então o diagnóstico
  chegaria anônimo.
- **`Framework_ADOTA_Octane.pdf` não está publicado.** A capa e a última página
  trazem "Trilha CRM G4 Educação". Publicar material co-branded como download
  aberto é decisão comercial, não técnica.
- **`Calculadora de O.T.E` está com `para: null`** e por isso nunca recebe selo.
  Falta decidir se ela endereça `rito` ou `dado`.

## Detalhes que economizam tempo

- **Tema.** A página respeita o tema de quem visita, claro e escuro, via tokens
  CSS. Nunca defina cor só dentro de `@media (prefers-color-scheme: dark)`.
- **Impressão.** Existe CSS de impressão que força papel claro, esconde botões e
  troca o "Baixar" pelo endereço do arquivo. O PDF sai só com o relatório porque
  as outras telas são `display:none`.
- **Fontes.** Não troque por `<link>` de CDN: quebra como Artifact e adiciona
  requisição externa. Para trocar de fonte, subsete e substitua o `.woff2`.
