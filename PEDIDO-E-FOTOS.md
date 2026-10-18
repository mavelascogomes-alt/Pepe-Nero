# Atualização do pedido e apresentação da casa

Atualização local de 17/10/2026. Sem publicação, envio de mensagens reais, novas tecnologias ou serviços externos.

## Disponível agora

- Fluxo **Carrinho → Dados do pedido → Revisão → WhatsApp**, com nome obrigatório, observações sincronizadas com o carrinho e retorno para editar itens ou dados sem perder o preenchimento durante a navegação na página.
- A configuração real do projeto ainda não confirma modalidades nem formas de pagamento. Por isso, o visitante informa o nome e prepara uma solicitação com **atendimento e pagamento a combinar pelo WhatsApp**. Não são anunciadas entrega, retirada, área atendida ou meios de pagamento não confirmados.
- Revisão visual com lista de produtos/quantidades/valores, dados e observações, subtotal e pendências. A mensagem completa só é preparada para o link empresarial existente; não aparece mais como um texto longo na revisão.
- Botões “Continuar”, “Revisar pedido” e “Continuar no WhatsApp”, com a explicação: “A solicitação será confirmada pelo restaurante no WhatsApp.” Abrir o link não limpa os itens, não envia automaticamente nem marca o pedido como recebido, confirmado ou pago.
- Persistência original dos itens e quantidades mantida, inclusive pizzas com dois sabores. Nome, endereço, preferências de pagamento, troco e observações não foram acrescentados a localStorage/sessionStorage, métricas ou logs. Os detalhes ficam no formulário/na memória da página; recarregar preserva somente os itens e quantidades já persistidos antes desta atualização.
- Seção existente antes de Entradas com título **Conheça o Pepe Nero**, texto curto baseado apenas no segmento e localização já cadastrados, vídeo existente silencioso e ação de reserva reutilizando o formulário atual.
- Horários cadastrados novamente na localização: todos os dias, das 11h às 23h30. Endereço e Google Maps preservados.
- Carrinho flutuante oculto enquanto os diálogos de carrinho, pizzas ou reserva estão abertos, permitindo usar campos e botões sem obstrução. Etapas com indicação acessível, foco visível e validação dos campos.
- Os 48 blocos de produto, incluindo IDs, nomes, preços, descrições e imagens, ficaram integralmente iguais aos anteriores a esta atualização. O código do fluxo de reservas não foi alterado; apenas o texto sobre o uso dos dados foi simplificado e o mesmo formulário ganhou a ação na apresentação.

## Preparado, mas condicionado à confirmação comercial

As configurações estão centralizadas em `commercial-config.js`, no objeto `order`. Os valores reais continuam vazios/não confirmados; as opções abaixo não estão anunciadas no site atual.

- `modes`: somente entradas `{ id: 'delivery' | 'pickup', confirmed: true }` habilitam entrega/retirada. A opção genérica de combinar pelo WhatsApp permanece disponível quando há modalidades confirmadas.
- `paymentMethods`: somente entradas com `id`, `label` e `confirmed: true` aparecem. O identificador `cash` habilita a pergunta sobre troco. Outros identificadores são preferências rotuladas pelo restaurante; não há dados de cartão, cobrança, chave de Pix ou indicação de pagamento efetuado.
- `delivery`: `confirmed: true` e a lista `areas` confirmam os bairros/cidades cadastrados. Cada registro contém `city`, `neighborhood` e `feeCents` (inteiro em centavos, ou `null` quando a taxa não está definida). Taxa ausente, inválida ou `null` nunca vira zero. Zero só é utilizado quando estiver explicitamente cadastrado para a área confirmada.
- Com áreas confirmadas, cidade e bairro são comparados sem distinção de maiúsculas/acentos/espaços repetidos. Um endereço fora da lista não prossegue como entrega; o visitante pode corrigir o endereço ou combinar o atendimento pelo WhatsApp. Não há promessa de entrega fora da área cadastrada.
- Se o restaurante confirmar entrega, mas ainda não confirmar áreas/taxas, o endereço pode ser informado para consulta e a área/taxa continuam explicitamente a confirmar. Não se presume área de atendimento.
- Entrega habilitada solicita rua, número (ou “sem número”), bairro e cidade; complemento e referência são opcionais. Retirada habilitada não solicita endereço do cliente e mostra o endereço real do restaurante com o link atual de rotas. Não existe solicitação de geolocalização ou mapa para escolher endereço.
- Dinheiro habilitado pergunta se precisa de troco. Quando necessário, exige valor positivo em centavos, suficiente para cobrir ao menos os valores conhecidos. Com total definido, calcula o troco exato; com pendências, informa que o valor final/troco serão confirmados.
- Pizza com duas metades continua com preço a consultar. O subtotal conhecido exclui essa combinação, é marcado como parcial e não é apresentado como total final. Com entrega sem taxa definida, aparece “Subtotal dos produtos — entrega a confirmar” (ou subtotal parcial, quando aplicável). Total só aparece numericamente quando todos os componentes de valor estão definidos.

## Fotos: estrutura preparada e oculta

Foram examinados o inventário de arquivos, a correspondência dos arquivos numéricos com as fotos de produtos e as capturas remanescentes. Não foram identificadas fotografias confirmadas do salão, mesa preparada, detalhe do ambiente ou fachada. As imagens decorativas/geradas do hero não foram tratadas como registro real da casa.

As áreas dependentes de fotos **não foram preenchidas nem declaradas concluídas**. Não há espaços reservados vazios, imagens quebradas ou aviso “foto em breve”. `restaurant-media.js` mantém quatro entradas `null`:

1. `salon`: foto principal real do salão, para a apresentação **Conheça o Pepe Nero** antes do cardápio.
2. `table`: mesa preparada, como foto complementar dessa apresentação.
3. `detail`: detalhe característico do ambiente, como segunda foto complementar opcional.
4. `facade`: fachada que permita reconhecer o local, na seção de localização.

Cada entrada exige confirmação explícita de foto real, registro da identificação/procedência, arquivo local, texto alternativo e dimensões. O nome do arquivo, sozinho, não é confirmação. As variantes otimizadas podem ser informadas para `srcset`. Não devem ser usados bancos de imagem, outro restaurante ou IA como registros reais do estabelecimento.

O componente só exibe a foto depois de carregar/decodificar corretamente, perto da seção visível. Usa proporção natural, sem recorte de elementos importantes, variantes responsivas e `loading="lazy"` no elemento exibido. Se faltar confirmação ou o arquivo não carregar, a área continua oculta. As fotos complementares só aparecem quando houver uma foto principal confirmada do salão.

Com fotos reais configuradas, a apresentação prevê texto de um lado e foto principal/complementares do outro no computador, sequência simples no celular e vídeo atual em dimensão secundária. A fachada fica ao lado do endereço no computador e acima no celular. Esses arranjos estão preparados; a otimização e a conferência visual das fotos reais dependem do envio/identificação desses arquivos.

## Testes executados

Chrome local, em perfil de QA isolado, com navegação externa cancelada/bloqueada. Nenhuma mensagem foi enviada e o site não foi publicado. As configurações e dados fictícios dos testes ficaram no contexto de testes do navegador; não foram gravados no arquivo comercial real.

- Configuração real sem modalidades/pagamentos: campos condicionais ocultos, nome obrigatório, atendimento/pagamento a combinar, observações, revisão visual, valores exatos e mensagem empresarial completa.
- Configurações fictícias confirmadas exclusivamente para testes: entrega, retirada, dinheiro e Pix; campos obrigatórios/condicionais; “sem número”; complemento e referência; troco com e sem necessidade; rejeição de valor insuficiente e cálculo em centavos.
- Taxa confirmada de área de teste, taxa pendente, zero explicitamente confirmado, área desconhecida e endereço fora da área de teste. Ausência de taxa não apresentada como entrega gratuita. A configuração real segue sem regra de entrega.
- Pizza com dois sabores e carrinho misto: subtotal conhecido/parcial correto, pendências de preço e entrega, total/troco a confirmar, quantidades, remoção e persistência mantidos.
- Voltar, editar dados/itens e alternar entrega/retirada sem perder o preenchimento durante o fluxo. Recarregar mantém somente itens/quantidades; dados pessoais não são persistidos. Dados apresentados como texto, sem execução de HTML.
- Mensagem do WhatsApp com nome, itens, quantidades, preços, modalidade/endereço quando necessário, pagamento/troco, observações e pendências. Link não limpa o carrinho e registra somente evento de intenção já existente, sem dados pessoais.
- Computador (1440 px), tablet (768 px), celulares (390 e 320 px): formulário e revisão com rolagem interna, foco contido no diálogo, ausência de rolagem horizontal e carrinho flutuante sem cobrir os novos campos/botões.
- Nova ação de reserva na apresentação abre o formulário existente. Validação/revisão/edição de reserva e modo de consulta para mesas permanecem funcionando.
- Vídeo atual carregado e sem som; todas as áreas sem fotos reais totalmente ocultas. Não foi declarada validação de fotografias do salão/fachada inexistentes.
- Animações do carrinho: entrada/saída, adição de produto, cliques rápidos, limpeza dos elementos temporários, versão móvel e preferência de movimento reduzido.
- Verificação sintática dos scripts no navegador e ausência de erros JavaScript no fluxo testado. Dados e carrinho fictícios removidos ao concluir.

Evidências e roteiro de QA: `tmp/preview/verify-order-details.py`, `tmp/preview/order-details-results.json` e capturas em `tmp/preview/` (pasta ignorada pelo projeto).

## O que ainda precisa ser fornecido/confirmado

- Modalidades de atendimento realmente oferecidas.
- Meios de pagamento aceitos e atendimento a preferência de troco.
- Bairros/cidades atendidos e taxas por área, incluindo quando uma taxa for explicitamente zero.
- Regra de preço de pizza com dois sabores, já pendente anteriormente.
- Foto real identificada do salão; mesa preparada; detalhe opcional do ambiente; fachada, nos locais descritos acima.
