# Autorrevisão

Rode antes de marcar a tarefa como pronta.

## Código e página

- [ ] Editei `src/` ou `fonts/`, nunca `public/index.html` à mão.
- [ ] `python3 build.py` rodou e `python3 build.py --check` sai com 0. O gerado está no commit.
- [ ] Nenhuma requisição externa nova (fonte de CDN, script, imagem remota). Tudo embutido.
- [ ] Nenhum dado do visitante sai do navegador.
- [ ] Sem `console.log` esquecido, sem código comentado.

## Conferência no navegador

- [ ] Abri a página (arquivo local ou localhost) e usei a mudança de ponta a ponta, não só abri a tela.
- [ ] Conferi a 390 px (celular) e em desktop, nos dois temas se houver.
- [ ] Console sem erro.
- [ ] A resposta final traz o caminho do arquivo e a URL que verifiquei.

## Texto e documentos

- [ ] Reli o que escrevi com `.agents/rules/writing-voice.md`: sem travessão, sem frase de efeito.
- [ ] Spec, plano e decisão estão na camada certa (`.agents/references/artifact-layers.md`).
- [ ] Ao apagar ou renomear arquivo, busquei o caminho antigo no README, AGENTS.md e `.agents/**`.
- [ ] Commit em Conventional Commits.
