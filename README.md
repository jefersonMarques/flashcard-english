# English Chunks — Flashcards

Aplicativo de estudo de inglês com 170 chunks, revisão por gestos e tradução escrita.

## Funcionalidades

- **Início:** progresso independente para Leitura e Tradução escrita; seleção de assunto e escolha do modo.
- **Assuntos:** tempos verbais, viagens, trabalho, restaurantes, dia a dia, compras, conversas, transporte e tecnologia.
- **Estudo:** interface sem distrações, com apenas o botão Voltar e os cartões.
- **Leitura:** toque no primeiro cartão para revelar tradução e exemplos no segundo.
- **Escrita:** toque no cartão em português para abrir o campo de resposta; ao enviar, veja o resultado.
- **Classificação:** deslize para a direita para marcar como dominado; para a esquerda, para continuar revisando.
- **Biblioteca:** filtrar chunks por modo, situação e tempo verbal; reclassificar e abrir cartões.
- **Persistência:** `localStorage`, incluindo a posição em cada trilha.
- **Backup:** exportação e importação de progresso em JSON para mover entre navegadores e domínios.

## Instalar como aplicativo (PWA)

- Publique via **HTTPS** (por exemplo, GitHub Pages) ou execute em `localhost`.
- No Chrome/Edge, use o botão **Instalar** na página ou a opção do navegador.
- No iPhone/iPad, abra no Safari, toque em **Compartilhar** e **Adicionar à Tela de Início**.
- Após a instalação do service worker e o primeiro carregamento online, os arquivos da aplicação ficam disponíveis offline.
- O progresso continua salvo no `localStorage` do dispositivo, sem sincronização automática entre navegadores.
- Para atualizar os arquivos offline após futuras publicações, incremente `CACHE_VERSION` em `service-worker.js`.

## Executar

Não há dependências de instalação ou build. Use um servidor estático local:

```bash
python3 -m http.server 8080
```

Acesse `http://localhost:8080`. É possível publicar todo o conteúdo na raiz do GitHub Pages.

## Teclado

- `←` — ainda não domino
- `→` — já domino
- `↓` — próximo cartão sem classificar
- `Espaço` — mostrar/ocultar segundo cartão
- `Z` — desfazer a última classificação durante a sessão
- `Esc` — voltar ao início

## Estrutura

- `index.html` — telas Início, Estudo e Biblioteca
- `src/styles.css` — Tailwind CSS compilado + estilos complementares
- `src/chunks.js` — os 90 chunks originais e integração dos novos assuntos
- `src/topics.js` — 80 chunks temáticos e catálogo de assuntos
- `src/icons.js` — ícones SVG da biblioteca Lucide incluídos localmente (licença ISC)
- `src/answer.js` — normalização e avaliação textual
- `src/storage.js` — compatibilidade, validação e persistência
- `src/app.js` — navegação, interações e renderização
- `src/pwa.js` — instalação e registro do service worker
- `manifest.webmanifest` — metadados de instalação
- `service-worker.js` — cache offline dos arquivos estáticos
- `icons/` — ícones do aplicativo
- `tests/` — testes automatizados

## Compatibilidade

As chaves do `localStorage` são as mesmas das versões V3–V5. Dados do `file://`, de `localhost` e de GitHub Pages **não são compartilhados automaticamente**, por serem origens distintas. Use a exportação/importação JSON para transferir os estudos.

A conferência de traduções é textual e aceita contrações comuns (por exemplo, `I'm` e `I am`). Traduções equivalentes que não correspondam ao chunk de referência podem ser apontadas como incorretas.
## Ícones

Os ícones usados na interface seguem a biblioteca [Lucide](https://lucide.dev/) e são mantidos localmente para funcionar offline. Licença ISC.
