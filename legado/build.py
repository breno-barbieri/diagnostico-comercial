#!/usr/bin/env python3
"""
Gera public/index.html a partir de src/.

A página é um arquivo único, autocontido de propósito: as duas fontes e o
favicon entram embutidos em base64. Isso a faz funcionar sem nenhuma
requisição externa, o que é requisito para publicá-la como Artifact do
Claude (o CSP de lá bloqueia CDN de fontes) e o que garante que ela renderize
igual em qualquer hospedagem estática.

Uso:  python3 build.py            gera public/index.html
      python3 build.py --check    falha se o arquivo gerado estiver defasado
"""
import base64
import pathlib
import sys

RAIZ = pathlib.Path(__file__).parent
FONTES = {"__FR_B64__": "fonts/fraunces.woff2", "__IN_B64__": "fonts/inter.woff2"}
SAIDA = RAIZ / "public/index.html"


def montar() -> str:
    corpo = (RAIZ / "src/index.template.html").read_text(encoding="utf-8")
    for marca, caminho in FONTES.items():
        b64 = base64.b64encode((RAIZ / caminho).read_bytes()).decode()
        if marca not in corpo:
            sys.exit(f"erro: {marca} não encontrado em src/index.template.html")
        corpo = corpo.replace(marca, b64)

    svg = (RAIZ / "public/favicon.svg").read_bytes()
    uri = "data:image/svg+xml;base64," + base64.b64encode(svg).decode()
    cabeca = (RAIZ / "src/head.html").read_text(encoding="utf-8")
    cabeca = cabeca.replace("__FAVICON_URI__", uri)

    return f"{cabeca}<body>\n{corpo}\n</body>\n</html>\n"


if __name__ == "__main__":
    novo = montar()
    if "--check" in sys.argv:
        atual = SAIDA.read_text(encoding="utf-8") if SAIDA.exists() else ""
        if atual != novo:
            sys.exit("public/index.html está defasado: rode python3 build.py e comite o resultado")
        print("public/index.html em dia")
    else:
        SAIDA.write_text(novo, encoding="utf-8")
        print(f"public/index.html gerado · {len(novo.encode()) / 1024:.1f} KB")
