# Pepe Nero — melhorias no projeto atual

Atualização posterior do pedido em quatro etapas e da apresentação da casa: veja [PEDIDO-E-FOTOS.md](PEDIDO-E-FOTOS.md). Os rótulos e a revisão do carrinho descritos abaixo registram a versão anterior; o relatório mais recente descreve o fluxo atual e suas pendências.

Implementado localmente em 17/10/2026. Site estático existente em HTML, CSS e JavaScript, sem troca de tecnologia, publicação ou envio de mensagens reais.

## O que mudou

- Carrinho com observações, revisão e ação “Solicitar pedido pelo WhatsApp”, reutilizando o número `5561995530777`. A mensagem contém quantidades, preços unitários, subtotais e observações. O cálculo continua em centavos, a partir dos preços atuais do catálogo. Não há taxas ou promessa de entrega/retirada. A mensagem solicita disponibilidade e confirmação da forma de atendimento e dos valores.
- Carrinho vazio bloqueado. Abrir o WhatsApp não limpa o carrinho, não envia automaticamente a mensagem e não representa confirmação. “Continuar escolhendo” permanece como ação secundária. Itens e quantidades continuam em `pepenero.cart.v1`; observações e dados de reserva não foram acrescentados ao armazenamento local.
- Pizza com dois sabores: seleção de duas metades distintas, combinação identificada no carrinho, persistência, quantidades e remoção. A combinação tem preço **a consultar**, sem cálculo inventado. O subtotal dos produtos com preço cadastrado exclui essas pizzas e é identificado como parcial. Sabores únicos mantêm seus preços e fluxo atuais.
- Uma única foto geral de pizza, identificada como ilustrativa, seguida dos nove sabores. Não foram criadas fotos de sabores específicos.
- Barra superior fixa com as seis categorias e acesso rápido a reserva, WhatsApp e localização. Categorias podem ser deslizadas no celular; a página não tem rolagem horizontal. Espaçamentos do cardápio foram reduzidos sem reduzir controles essenciais.
- Apresentação em português com informações existentes; “Explorar o cardápio” abre o cardápio. Ajustes de ortografia e redação não acrescentam ingredientes ou porções. Os 48 IDs, nomes, preços e respectivas categorias foram preservados.
- Abertura com “Benvenuti”, nome do restaurante e localização em HTML; a mensagem principal e as duas ações permanecem. O texto incorporado à fotografia foi removido apenas na área correspondente, mantendo a fotografia e os retoques locais já existentes. A composição foi consolidada em uma imagem responsiva, eliminando as camadas de imagem carregadas pelo hero.
- Reserva com ocasião opcional (aniversário, encontro, grupo ou outra), observações, revisão e WhatsApp, sem prometer serviços adicionais. Há explicação do uso dos dados para preparar a mensagem, sem cadastro central.
- Modo de consulta para mesas: `?modo=mesa#cardapio`. Reutiliza os mesmos 48 produtos, categorias e preços, oculta os controles de pedido e oferece retorno ao site completo. Não altera o carrinho do fluxo normal. Não é um sistema de pedidos à mesa.
- Metadescrição, títulos e campos de compartilhamento, imagem existente e dados estruturados `Restaurant` com endereço, telefone, cozinha e horários cadastrados. Não há avaliações inventadas nem canônico ou URL pública presumida. A imagem de compartilhamento está preparada com caminho relativo; a URL absoluta depende do domínio definitivo.
- Imagens existentes do catálogo em variantes menores, com `srcset`, dimensões explícitas e carregamento adiado. Miniaturas do carrinho usam a variante menor. Hero: 255.761 bytes na versão de 1446 px, 112.135 na de 900 px e 37.346 na de 480 px; anteriormente as quatro imagens carregadas somavam 1.825.843 bytes. Pôster estático extraído do vídeo fornecido. Animações e emblema existentes foram preservados, inclusive redução de movimento e alternativa estática.

## Recursos preparados, sem dados comerciais fictícios

- **Uma noite para dois:** `commercial-config.js` mantém `eveningForTwo: null`. O renderizador só exibe uma seleção quando `approved: true` e os três IDs reais forem válidos nas categorias de entrada, prato e sobremesa. O prato compartilhado e toda a seleção precisam ser aprovados pelo restaurante. Não há pacote, desconto ou seleção expostos enquanto isso.
- **Medição de interesse:** eventos locais `pepenero:interest` com somente `{ name, confirmed: false }`. Nomes: `whatsapp_click`, `order_whatsapp_open`, `reservation_whatsapp_open`, `directions_click`. Não incluem nome, telefone, observações, conteúdo da mensagem ou lista de produtos. Não há ferramenta de análise configurada, armazenamento de métricas ou transmissão para serviços. São cliques/intenção, nunca pedidos ou reservas confirmados.
- **QR Code:** o modo de consulta está pronto. Nenhum QR foi gerado com localhost ou domínio provisório.

## Pendências do restaurante

1. Regra de preço das pizzas com dois sabores. Até a confirmação, cada combinação fica a consultar e fora do subtotal conhecido.
2. Modalidades de atendimento e eventuais taxas; formas de pagamento e condições para grupos. Nada disso foi presumido ou anunciado.
3. Aprovar a seleção “Uma noite para dois”, incluindo entrada, prato para compartilhar e sobremesa, antes de configurar os IDs em `commercial-config.js`. Não há desconto ou preço de pacote previsto.
4. Domínio público definitivo para canônico, URL absoluta das imagens de compartilhamento e geração do QR do modo de consulta. O site não foi publicado.
5. Fotos identificadas do ambiente e fachada, fotos específicas das pizzas e avaliações com fonte verificável, se desejar essas áreas. Nenhuma galeria ou avaliação fictícia foi incluída.
6. Confirmar se **Parmegiana de filé** (pratos principais, R$ 69,00, macarrão ao molho de tomate caseiro) e **Parmegiana filé mignon** (pratos exclusivos, R$ 69,00, massa artesanal ao molho de tomate) são apresentações distintas. Ambas foram mantidas, com seus IDs, preços, descrições e categorias.
7. Identificar uma ferramenta de análise já configurada, caso exista, para conectar os eventos. Não foi instalado nenhum serviço externo novo.

## Validação executada

Chrome local, em 1440×1000, 768×1024, 390×844 e 320×740, com navegação externa bloqueada/interceptada. Dados fictícios usados apenas nos testes locais e removidos ao concluir.

- Comparação dos 48 IDs, nomes e preços com o catálogo anterior; seis categorias, endereço e horários preservados; IDs HTML únicos, arquivos e âncoras válidos; JSON-LD válido.
- Adição repetida, aumento/diminuição, remoção, diminuição até zero, variantes de porção, subtotais exatos e persistência após recarregar.
- Carrinho vazio, revisão, edição de observações, mensagem codificada, destino empresarial, ausência de limpeza ao abrir o link e conteúdo inserido como texto, sem execução de HTML.
- Seleção vazia ou duas metades iguais rejeitadas; combinação válida persistida, quantidade e remoção; carrinho apenas com preço a consultar e carrinho misto com subtotal parcial correto.
- Armazenamento corrompido, IDs desconhecidos, combinações inválidas e quantidades inválidas rejeitados. Operação em memória quando o armazenamento é bloqueado. Carrinho com quantidade máxima em todos os produtos cabe em 320 px.
- Navegação real pelos seis atalhos em cada largura; títulos sem corte pelo cabeçalho, sem rolagem horizontal da página, atalhos e carrinho fixos em regiões distintas.
- Foco por teclado nos diálogos do carrinho, pizzas e reservas; Escape e restauração de foco. Foco visível em controles e campos identificados.
- Reservas em todos os dias, inclusive fim de semana; 11h até antes de 23h30; fuso de Brasília mesmo com outro fuso no navegador; exclusão de horários passados; nome, telefone, data, pessoas e horário; revisão, ocasião, edição e impedimento de encaminhar horário vencido.
- Links de WhatsApp, Instagram e Google Maps conferidos com cancelamento da navegação externa. Nenhuma mensagem real enviada. Eventos locais contêm apenas nome do evento e `confirmed: false`.
- Todas as imagens carregadas, vídeo sem erro, pôster, emblema estático com CDN bloqueado e preferência de movimento reduzido. Animações do carrinho verificadas: entrada, saída, adição, cliques rápidos, limpeza dos elementos temporários e alteração da preferência durante a execução.
- Modo de consulta preserva produtos/preços e carrinho do fluxo normal; retorno ao site completo. Seleção comercial incompleta não aparece.
- Verificação sintática dos scripts no navegador, sem instalar runtime ou dependências; ausência de erros JavaScript nos testes funcionais.

Os testes não verificam disponibilidade real de mesas/estoque, recebimento pelo restaurante, confirmação de pedidos/reservas ou renderização de cartões em redes sociais antes de existir domínio definitivo. Esses resultados não são simulados como concluídos.

Scripts e capturas de QA ficam em `tmp/preview/` (ignorado no projeto). Resultado principal: `tmp/preview/improvement-results.json`; verificações extras: `tmp/preview/extra-results.json`.

## Imagens e prompt

O ImageGen integrado foi usado somente para remover o lettering incorporado à área esquerda do hero. A composição final usa a fotografia original com os retoques locais já existentes e o novo retoque de texto. Prompt completo e histórico: `assets/hero-retouch-notes.txt`. Arquivo gerado: `assets/hero-sem-texto-fonte.png`. Imagens finais carregadas pela página: `assets/hero-clean-480.jpg`, `assets/hero-clean-900.jpg`, `assets/hero-clean-1446.jpg`. Originais foram mantidos. Nenhuma foto de ambiente ou produto novo foi inventada.
