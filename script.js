/* =====================================================
   PEDRINHO FARMÁCIAS - SCRIPT.JS COMPLETO CORRIGIDO
   Funções em português
   Carrinho, página de pagamento, QR Code, login,
   estoque, admin e filtros
===================================================== */

/* ===============================
   FUNÇÕES ÚTEIS
================================ */

function obterStorage(chave, valorPadrao = null) {
  try {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : valorPadrao;
  } catch (erro) {
    console.error("Erro ao ler localStorage:", erro);
    return valorPadrao;
  }
}

function salvarStorage(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.error("Erro ao salvar localStorage:", erro);
  }
}

function formatarDinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function criarIdSeguro(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "-");
}

/* ===============================
   CARROSSEL
================================ */

let slideAtual = 0;
let intervaloCarrossel = null;

function mostrarSlide(indice) {
  const slides = document.querySelectorAll(".slide");
  const bolinhas = document.querySelectorAll(".dot, .bolinhas span");

  if (!slides.length) return;

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === indice);
  });

  bolinhas.forEach((bolinha, i) => {
    bolinha.classList.toggle("active", i === indice);
  });

  slideAtual = indice;
}

function proximoSlide() {
  const slides = document.querySelectorAll(".slide");

  if (!slides.length) return;

  mostrarSlide((slideAtual + 1) % slides.length);
}

function iniciarCarrossel() {
  const slides = document.querySelectorAll(".slide");

  if (slides.length <= 1) return;

  pararCarrossel();

  intervaloCarrossel = setInterval(proximoSlide, 5500);
}

function pararCarrossel() {
  if (intervaloCarrossel) {
    clearInterval(intervaloCarrossel);
    intervaloCarrossel = null;
  }
}

function configurarCarrossel() {
  const bolinhas = document.querySelectorAll(".dot, .bolinhas span");

  bolinhas.forEach((bolinha, indice) => {
    bolinha.addEventListener("click", () => {
      pararCarrossel();
      mostrarSlide(indice);
      iniciarCarrossel();
    });
  });

  mostrarSlide(0);
  iniciarCarrossel();
}

/* ===============================
   ESTOQUE
================================ */

const estoquePadrao = [
  { nome: "Kit Medicamentos Essenciais", categoria: "Medicamentos", quantidade: 18 },
  { nome: "Medicamento Genérico", categoria: "Medicamentos", quantidade: 30 },
  { nome: "Vitaminas e Imunidade", categoria: "Medicamentos", quantidade: 24 },
  { nome: "Analgésico", categoria: "Medicamentos", quantidade: 22 },

  { nome: "Combo Skincare", categoria: "Perfumaria", quantidade: 12 },
  { nome: "Kit Higiene Pessoal", categoria: "Perfumaria", quantidade: 17 },
  { nome: "Perfume Feminino", categoria: "Perfumaria", quantidade: 8 },
  { nome: "Kit Maquiagem", categoria: "Perfumaria", quantidade: 11 },

  { nome: "Aferição de Pressão", categoria: "Serviços", quantidade: 20 },
  { nome: "Testes Rápidos", categoria: "Serviços", quantidade: 14 },
  { nome: "Orientação Farmacêutica", categoria: "Serviços", quantidade: 25 },
  { nome: "Acompanhamento Farmacêutico", categoria: "Serviços", quantidade: 10 }
];

function converterEstoqueAntigo(lista) {
  if (!Array.isArray(lista)) return null;

  return lista
    .map((item) => {
      return {
        nome: item.nome || item.name,
        categoria: item.categoria || item.category,
        quantidade: Number(item.quantidade ?? item.quantity ?? 0)
      };
    })
    .filter((item) => item.nome);
}

function obterListaEstoque() {
  const estoqueSalvo = obterStorage("pedrinhoStock", null);
  const estoqueConvertido = converterEstoqueAntigo(estoqueSalvo);

  if (!estoqueConvertido || !Array.isArray(estoqueConvertido)) {
    salvarStorage("pedrinhoStock", estoquePadrao);
    return [...estoquePadrao];
  }

  return estoqueConvertido;
}

function salvarListaEstoque(listaEstoque) {
  salvarStorage("pedrinhoStock", listaEstoque);
}

function obterEstoqueProduto(nomeProduto) {
  const listaEstoque = obterListaEstoque();

  const produto = listaEstoque.find((item) => {
    return item.nome === nomeProduto;
  });

  return produto ? Number(produto.quantidade) : 0;
}

function obterStatusEstoque(quantidade) {
  const qtd = Number(quantidade);

  if (qtd <= 0) {
    return {
      texto: "Esgotado",
      classe: "status-zero",
      classeBadge: "stock-empty"
    };
  }

  if (qtd <= 5) {
    return {
      texto: "Estoque baixo",
      classe: "status-baixo",
      classeBadge: "stock-low"
    };
  }

  return {
    texto: "Disponível",
    classe: "status-ok",
    classeBadge: "stock-available"
  };
}

function diminuirEstoque(nomeProduto, quantidade) {
  const listaEstoque = obterListaEstoque();

  const produto = listaEstoque.find((item) => {
    return item.nome === nomeProduto;
  });

  if (!produto) return;

  produto.quantidade = Math.max(0, Number(produto.quantidade) - Number(quantidade));

  salvarListaEstoque(listaEstoque);
}

function atualizarEstoqueProduto(nomeProduto, novaQuantidade) {
  const listaEstoque = obterListaEstoque();

  const produto = listaEstoque.find((item) => {
    return item.nome === nomeProduto;
  });

  if (!produto) return;

  produto.quantidade = Math.max(0, Number(novaQuantidade));

  salvarListaEstoque(listaEstoque);

  renderizarBadgesEstoque();
  renderizarTabelaEstoque();
}

function restaurarEstoquePadrao() {
  if (!verificarSeAdmin()) {
    alert("Apenas administradores podem restaurar o estoque.");
    return;
  }

  const confirmar = confirm("Deseja restaurar o estoque padrão?");

  if (!confirmar) return;

  salvarStorage("pedrinhoStock", estoquePadrao);

  adicionarLogAdmin("ESTOQUE_RESTAURADO", "O estoque padrão foi restaurado.", estoquePadrao);

  alert("Estoque restaurado com sucesso!");

  renderizarBadgesEstoque();
  renderizarTabelaEstoque();
}

function renderizarBadgesEstoque() {
  const cards = document.querySelectorAll(".produto-card, .product-card");

  cards.forEach((card) => {
    const nomeProduto = card.dataset.name;

    if (!nomeProduto) return;

    const quantidade = obterEstoqueProduto(nomeProduto);
    const status = obterStatusEstoque(quantidade);

    let badge = card.querySelector(".stock-badge");

    if (!badge) {
      badge = document.createElement("div");

      const corpo = card.querySelector(".produto-body, .product-body");

      if (corpo) {
        corpo.appendChild(badge);
      }
    }

    badge.className = `stock-badge ${status.classeBadge}`;

    badge.textContent =
      quantidade <= 0
        ? "Produto esgotado"
        : `${status.texto} • ${quantidade} em estoque`;

    const botao = card.querySelector(".botao-comprar, .buy-button");

    if (!botao) return;

    if (!botao.dataset.textoOriginal) {
      botao.dataset.textoOriginal = botao.textContent.trim();
    }

    if (quantidade <= 0) {
      botao.disabled = true;
      botao.textContent = "Esgotado";
      botao.classList.add("disabled-button");
    } else {
      botao.disabled = false;
      botao.textContent = botao.dataset.textoOriginal;
      botao.classList.remove("disabled-button");
    }
  });
}

function renderizarTabelaEstoque() {
  const corpoTabela = document.querySelector("#stock-table-body");

  if (!corpoTabela) return;

  if (!verificarSeAdmin()) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:#999;padding:2rem">
          Acesso restrito para administradores.
        </td>
      </tr>
    `;
    return;
  }

  const listaEstoque = obterListaEstoque();

  corpoTabela.innerHTML = "";

  listaEstoque.forEach((produto) => {
    const status = obterStatusEstoque(produto.quantidade);
    const idInput = `stock-${criarIdSeguro(produto.nome)}`;

    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td><strong>${produto.nome}</strong></td>

      <td>${produto.categoria}</td>

      <td>
        <input
          type="number"
          min="0"
          value="${produto.quantidade}"
          id="${idInput}"
        />
      </td>

      <td>
        <span class="${status.classe}">
          ${status.texto}
        </span>
      </td>

      <td>
        <button
          type="button"
          class="save-stock-button"
          onclick="salvarEstoqueDoInput('${produto.nome}')"
        >
          Salvar
        </button>
      </td>
    `;

    corpoTabela.appendChild(linha);
  });
}

function salvarEstoqueDoInput(nomeProduto) {
  if (!verificarSeAdmin()) {
    alert("Acesso negado. Apenas administradores podem alterar o estoque.");
    return;
  }

  const idInput = `stock-${criarIdSeguro(nomeProduto)}`;
  const input = document.getElementById(idInput);

  if (!input) return;

  const novaQuantidade = Number(input.value);

  if (Number.isNaN(novaQuantidade) || novaQuantidade < 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  atualizarEstoqueProduto(nomeProduto, novaQuantidade);

  adicionarLogAdmin("ESTOQUE_ATUALIZADO", `Estoque atualizado para ${nomeProduto}.`, {
    produto: nomeProduto,
    quantidade: novaQuantidade
  });

  alert("Estoque atualizado com sucesso!");
}

/* ===============================
   CARRINHO
================================ */

let carrinho = obterStorage("pedrinhoCart", []);
let pedidoPagamentoPendente = null;

function converterCarrinhoAntigo(lista) {
  if (!Array.isArray(lista)) return [];

  return lista
    .map((item) => {
      return {
        nome: item.nome || item.name,
        preco: Number(item.preco ?? item.price ?? 0),
        imagem: item.imagem || item.image || "",
        quantidade: Number(item.quantidade ?? item.quantity ?? 1)
      };
    })
    .filter((item) => item.nome);
}

carrinho = converterCarrinhoAntigo(carrinho);

function salvarCarrinho() {
  salvarStorage("pedrinhoCart", carrinho);
}

function obterTotalCarrinho() {
  return carrinho.reduce((total, item) => {
    return total + Number(item.preco) * Number(item.quantidade);
  }, 0);
}

function obterQuantidadeCarrinho() {
  return carrinho.reduce((total, item) => {
    return total + Number(item.quantidade);
  }, 0);
}

function obterQuantidadeProdutoCarrinho(nomeProduto) {
  const produto = carrinho.find((item) => {
    return item.nome === nomeProduto;
  });

  return produto ? Number(produto.quantidade) : 0;
}

function adicionarAoCarrinho(nome, preco, imagem) {
  const estoqueDisponivel = obterEstoqueProduto(nome);
  const quantidadeNoCarrinho = obterQuantidadeProdutoCarrinho(nome);

  if (estoqueDisponivel <= 0) {
    alert("Produto esgotado.");
    return;
  }

  if (quantidadeNoCarrinho >= estoqueDisponivel) {
    alert("Você já adicionou a quantidade máxima disponível desse produto.");
    return;
  }

  const produtoExistente = carrinho.find((item) => {
    return item.nome === nome;
  });

  if (produtoExistente) {
    produtoExistente.quantidade += 1;
  } else {
    carrinho.push({
      nome,
      preco: Number(preco),
      imagem,
      quantidade: 1
    });
  }

  salvarCarrinho();
  renderizarCarrinho();
  abrirCarrinho();
}

function aumentarQuantidade(indice) {
  const item = carrinho[indice];

  if (!item) return;

  const estoqueDisponivel = obterEstoqueProduto(item.nome);

  if (item.quantidade >= estoqueDisponivel) {
    alert("Quantidade máxima disponível em estoque.");
    return;
  }

  item.quantidade += 1;

  salvarCarrinho();
  renderizarCarrinho();
}

function diminuirQuantidade(indice) {
  if (!carrinho[indice]) return;

  if (carrinho[indice].quantidade > 1) {
    carrinho[indice].quantidade -= 1;
  } else {
    carrinho.splice(indice, 1);
  }

  salvarCarrinho();
  renderizarCarrinho();
}

function removerDoCarrinho(indice) {
  if (!carrinho[indice]) return;

  carrinho.splice(indice, 1);

  salvarCarrinho();
  renderizarCarrinho();
}

function limparCarrinho() {
  if (!carrinho.length) return;

  const confirmar = confirm("Deseja limpar o carrinho?");

  if (!confirmar) return;

  carrinho = [];

  salvarCarrinho();
  renderizarCarrinho();
}

function renderizarCarrinho() {
  const itensCarrinho = document.querySelector("#cart-items");
  const contadorCarrinho = document.querySelector("#cart-count");
  const totalCarrinho = document.querySelector("#cart-total");

  if (contadorCarrinho) {
    contadorCarrinho.textContent = obterQuantidadeCarrinho();
  }

  if (totalCarrinho) {
    totalCarrinho.textContent = formatarDinheiro(obterTotalCarrinho());
  }

  if (!itensCarrinho) return;

  itensCarrinho.innerHTML = "";

  if (!carrinho.length) {
    itensCarrinho.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
    return;
  }

  carrinho.forEach((item, indice) => {
    const estoqueDisponivel = obterEstoqueProduto(item.nome);

    const artigo = document.createElement("article");
    artigo.className = "cart-item";

    artigo.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}" />

      <div class="cart-item-content">
        <div class="cart-item-info">
          <strong>${item.nome}</strong>
          <span>${formatarDinheiro(item.preco)}</span>
          <small class="cart-stock-info">
            Estoque disponível: ${estoqueDisponivel}
          </small>
        </div>

        <div class="cart-item-actions">
          <button type="button" onclick="diminuirQuantidade(${indice})">
            −
          </button>

          <span>${item.quantidade}</span>

          <button type="button" onclick="aumentarQuantidade(${indice})">
            +
          </button>
        </div>

        <button type="button" class="remove-item" onclick="removerDoCarrinho(${indice})">
          Remover
        </button>
      </div>
    `;

    itensCarrinho.appendChild(artigo);
  });
}

function abrirCarrinho() {
  const lateral = document.querySelector("#cart-sidebar");
  const fundo = document.querySelector("#cart-overlay");

  if (!lateral || !fundo) {
    alert("Estrutura do carrinho não encontrada nesta página.");
    return;
  }

  lateral.classList.add("active");
  fundo.classList.add("active");
}

function fecharCarrinho() {
  const lateral = document.querySelector("#cart-sidebar");
  const fundo = document.querySelector("#cart-overlay");

  if (!lateral || !fundo) return;

  lateral.classList.remove("active");
  fundo.classList.remove("active");
}

/* ===============================
   PAGAMENTO
================================ */

function finalizarPedido() {
  if (!carrinho.length) {
    alert("Seu carrinho está vazio.");
    return;
  }

  const produtoIndisponivel = carrinho.some((item) => {
    return item.quantidade > obterEstoqueProduto(item.nome);
  });

  if (produtoIndisponivel) {
    alert("Algum produto do carrinho não possui estoque suficiente.");
    return;
  }

  const usuarioLogado = obterUsuarioLogado();
  const total = obterTotalCarrinho();

  const pedido = {
    cliente: usuarioLogado
      ? {
          nome: usuarioLogado.nome,
          email: usuarioLogado.email,
          perfil: usuarioLogado.perfil || "usuario"
        }
      : {
          nome: "Cliente não identificado",
          email: "Não informado",
          perfil: "visitante"
        },

    itens: carrinho.map((item) => {
      return {
        nome: item.nome,
        preco: Number(item.preco),
        imagem: item.imagem,
        quantidade: Number(item.quantidade),
        subtotal: Number(item.preco) * Number(item.quantidade)
      };
    }),

    total: total,
    totalBruto: total,
    data: new Date().toLocaleString("pt-BR")
  };

  salvarStorage("pedrinhoPedidoPendente", pedido);

  window.location.href = "pagamento.html";
}

function iniciarPagamento() {
  finalizarPedido();
}

function abrirModalPagamento(pedido) {
  const modal = document.querySelector("#payment-modal");
  const caixaQrCode = document.querySelector("#payment-qrcode");
  const totalElemento = document.querySelector("#payment-total");

  if (!modal || !caixaQrCode || !totalElemento) {
    alert("Erro: estrutura do pagamento não encontrada no HTML.");
    return;
  }

  caixaQrCode.innerHTML = "";
  totalElemento.textContent = formatarDinheiro(pedido.total);

  const textoQr = gerarTextoPagamento(pedido);

  if (typeof QRCode !== "undefined") {
    new QRCode(caixaQrCode, {
      text: textoQr,
      width: 200,
      height: 200
    });
  } else {
    const imagemQr = document.createElement("img");

    imagemQr.src =
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
      encodeURIComponent(textoQr);

    imagemQr.alt = "QR Code de pagamento";

    caixaQrCode.appendChild(imagemQr);
  }

  fecharCarrinho();

  modal.classList.add("active");
}

function fecharModalPagamento() {
  const modal = document.querySelector("#payment-modal");

  if (!modal) return;

  modal.classList.remove("active");
}

function gerarTextoPagamento(pedido) {
  const itensTexto = pedido.itens
    .map((item) => {
      return `${item.quantidade}x ${item.nome} - ${formatarDinheiro(item.subtotal)}`;
    })
    .join(" | ");

  return (
    `PEDRINHO FARMÁCIAS\n` +
    `Cliente: ${pedido.cliente.nome}\n` +
    `Total: ${formatarDinheiro(pedido.total)}\n` +
    `Itens: ${itensTexto}`
  );
}

function confirmarPagamento() {
  if (!pedidoPagamentoPendente) {
    alert("Nenhum pagamento pendente.");
    return;
  }

  registrarVendaAdmin(pedidoPagamentoPendente);

  pedidoPagamentoPendente.itens.forEach((item) => {
    diminuirEstoque(item.nome, item.quantidade);
  });

  carrinho = [];

  salvarCarrinho();

  renderizarCarrinho();
  renderizarBadgesEstoque();
  renderizarTabelaEstoque();
  renderizarPainelAdmin();

  adicionarLogAdmin(
    "PAGAMENTO_CONFIRMADO",
    "Pagamento confirmado via QR Code.",
    pedidoPagamentoPendente
  );

  pedidoPagamentoPendente = null;

  fecharModalPagamento();

  alert("Pagamento confirmado com sucesso!");
}

/* ===============================
   PAGAMENTO - PÁGINA pagamento.html
================================ */

const LINK_QR_CODE_PAGAMENTO = "https://youtu.be/kAOZ14Tjg7A?si=F4XzVReQ7rPesPRp&t=56";

function montarPedidoDoCarrinho() {
  const usuarioLogado = obterUsuarioLogado();
  const total = obterTotalCarrinho();

  return {
    cliente: usuarioLogado
      ? {
          nome: usuarioLogado.nome,
          email: usuarioLogado.email,
          perfil: usuarioLogado.perfil || "usuario"
        }
      : {
          nome: "Cliente não identificado",
          email: "Não informado",
          perfil: "visitante"
        },

    itens: carrinho.map((item) => {
      return {
        nome: item.nome,
        preco: Number(item.preco),
        imagem: item.imagem,
        quantidade: Number(item.quantidade),
        subtotal: Number(item.preco) * Number(item.quantidade)
      };
    }),

    total: total,
    totalBruto: total,
    data: new Date().toLocaleString("pt-BR")
  };
}

function finalizarPedido() {
  if (!carrinho.length) {
    alert("Seu carrinho está vazio.");
    return;
  }

  const produtoIndisponivel = carrinho.some((item) => {
    return item.quantidade > obterEstoqueProduto(item.nome);
  });

  if (produtoIndisponivel) {
    alert("Algum produto do carrinho não possui estoque suficiente.");
    return;
  }

  const pedido = montarPedidoDoCarrinho();

  salvarStorage("pedrinhoPedidoPendente", pedido);

  window.location.href = "pagamento.html";
}

function iniciarPagamento() {
  finalizarPedido();
}

function obterPedidoPendentePagamento() {
  let pedido = obterStorage("pedrinhoPedidoPendente", null);

  if (pedido && pedido.itens && pedido.itens.length) {
    return pedido;
  }

  if (carrinho && carrinho.length) {
    pedido = montarPedidoDoCarrinho();
    salvarStorage("pedrinhoPedidoPendente", pedido);
    return pedido;
  }

  return null;
}

function gerarTextoPagamento(pedido) {
  const itensTexto = pedido.itens
    .map((item) => {
      return `${item.quantidade}x ${item.nome} - ${formatarDinheiro(item.subtotal)}`;
    })
    .join(" | ");

  return (
    `PEDRINHO FARMÁCIAS\n` +
    `Cliente: ${pedido.cliente.nome}\n` +
    `Total: ${formatarDinheiro(pedido.total)}\n` +
    `Itens: ${itensTexto}\n` +
    `Link: ${LINK_QR_CODE_PAGAMENTO}`
  );
}

function gerarQrCodeNaTela(elemento, texto) {
  if (!elemento) return;

  elemento.innerHTML = "";

  if (typeof QRCode !== "undefined") {
    new QRCode(elemento, {
      text: texto,
      width: 220,
      height: 220
    });

    return;
  }

  const imagemQr = document.createElement("img");

  imagemQr.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
    encodeURIComponent(texto);

  imagemQr.alt = "QR Code de pagamento";

  elemento.appendChild(imagemQr);
}

function renderizarPaginaPagamento() {
  const listaItens = document.querySelector("#payment-order-items");
  const totalResumo = document.querySelector("#payment-page-total");
  const totalQr = document.querySelector("#payment-page-total-qr");
  const caixaQrCode = document.querySelector("#payment-page-qrcode");

  if (!listaItens || !totalResumo || !totalQr || !caixaQrCode) {
    return;
  }

  const pedido = obterPedidoPendentePagamento();

  if (!pedido || !pedido.itens || !pedido.itens.length) {
    listaItens.innerHTML = `
      <p class="empty-cart">
        Nenhum pedido encontrado. Volte para a loja e adicione itens ao carrinho.
      </p>
    `;

    totalResumo.textContent = "R$ 0,00";
    totalQr.textContent = "R$ 0,00";

    gerarQrCodeNaTela(caixaQrCode, LINK_QR_CODE_PAGAMENTO);

    return;
  }

  listaItens.innerHTML = "";

  pedido.itens.forEach((item) => {
    const div = document.createElement("div");
    div.className = "payment-order-item";

    div.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}" />

      <div>
        <strong>${item.nome}</strong>
        <span>${item.quantidade}x ${formatarDinheiro(item.preco)}</span>
      </div>

      <div class="payment-order-item-price">
        ${formatarDinheiro(item.subtotal)}
      </div>
    `;

    listaItens.appendChild(div);
  });

  totalResumo.textContent = formatarDinheiro(pedido.total);
  totalQr.textContent = formatarDinheiro(pedido.total);

  gerarQrCodeNaTela(caixaQrCode, LINK_QR_CODE_PAGAMENTO);
}

function confirmarPagamentoPagina() {
  const pedido = obterPedidoPendentePagamento();

  if (!pedido || !pedido.itens || !pedido.itens.length) {
    alert("Nenhum pedido pendente para confirmar.");
    return;
  }

  registrarVendaAdmin(pedido);

  pedido.itens.forEach((item) => {
    diminuirEstoque(item.nome, item.quantidade);
  });

  carrinho = [];

  salvarCarrinho();

  localStorage.removeItem("pedrinhoPedidoPendente");

  adicionarLogAdmin(
    "PAGAMENTO_CONFIRMADO",
    "Pagamento confirmado na página de pagamento.",
    pedido
  );

  renderizarCarrinho();
  renderizarBadgesEstoque();
  renderizarTabelaEstoque();
  renderizarPainelAdmin();

  alert("Pagamento confirmado com sucesso!");

  window.location.href = "index.html";
}

function cancelarPagamentoPagina() {
  const confirmar = confirm("Deseja cancelar este pagamento?");

  if (!confirmar) return;

  localStorage.removeItem("pedrinhoPedidoPendente");

  alert("Pagamento cancelado.");

  window.location.href = "index.html";
}

/* Modal antigo mantido apenas para compatibilidade */

function abrirModalPagamento(pedido) {
  salvarStorage("pedrinhoPedidoPendente", pedido);
  window.location.href = "pagamento.html";
}

function fecharModalPagamento() {
  const modal = document.querySelector("#payment-modal");

  if (!modal) return;

  modal.classList.remove("active");
}

function confirmarPagamento() {
  confirmarPagamentoPagina();
};

/* ===============================
   FILTROS
================================ */

function configurarFiltros() {
  const campoBusca = document.querySelector("#product-search");
  const cardsProdutos = document.querySelectorAll(".produto-card, .product-card");
  const botoesFiltro = document.querySelectorAll(".filter-btn");

  let filtroAtivo = "all";

  function filtrarProdutos() {
    const termoBusca = campoBusca ? normalizarTexto(campoBusca.value) : "";

    cardsProdutos.forEach((card) => {
      const nome = normalizarTexto(card.dataset.name);
      const categoria = card.dataset.category;

      const combinaBusca = nome.includes(termoBusca);
      const combinaFiltro = filtroAtivo === "all" || categoria === filtroAtivo;

      card.style.display = combinaBusca && combinaFiltro ? "block" : "none";
    });
  }

  if (campoBusca) {
    campoBusca.addEventListener("input", filtrarProdutos);
  }

  botoesFiltro.forEach((botao) => {
    botao.addEventListener("click", () => {
      botoesFiltro.forEach((btn) => {
        btn.classList.remove("active");
      });

      botao.classList.add("active");
      filtroAtivo = botao.dataset.filter || "all";

      filtrarProdutos();
    });
  });
}

/* ===============================
   USUÁRIOS E LOGIN
================================ */

function converterUsuariosAntigos(lista) {
  if (!Array.isArray(lista)) return [];

  return lista
    .map((usuario) => {
      return {
        nome: usuario.nome || usuario.name,
        email: usuario.email,
        senha: usuario.senha || usuario.password,
        perfil: usuario.perfil || usuario.role || "usuario"
      };
    })
    .filter((usuario) => usuario.email);
}

function obterUsuarios() {
  return converterUsuariosAntigos(obterStorage("pedrinhoUsers", []));
}

function salvarUsuarios(usuarios) {
  salvarStorage("pedrinhoUsers", usuarios);
}

function obterUsuarioLogado() {
  const usuario = obterStorage("pedrinhoLoggedUser", null);

  if (!usuario) return null;

  return {
    nome: usuario.nome || usuario.name,
    email: usuario.email,
    perfil: usuario.perfil || usuario.role || "usuario"
  };
}

function definirUsuarioLogado(usuario) {
  salvarStorage("pedrinhoLoggedUser", usuario);
}

function iniciarAdministradorPadrao() {
  const usuarios = obterUsuarios();

  const adminExiste = usuarios.some((usuario) => {
    return usuario.email === "admin@pedrinho.com";
  });

  if (!adminExiste) {
    usuarios.push({
      nome: "Administrador",
      email: "admin@pedrinho.com",
      senha: "admin123",
      perfil: "admin"
    });

    salvarUsuarios(usuarios);
  }
}

function verificarSeAdmin() {
  const usuarioLogado = obterUsuarioLogado();

  return usuarioLogado && usuarioLogado.perfil === "admin";
}

function atualizarPermissoesNavbar() {
  const usuarioLogado = obterUsuarioLogado();

  document.querySelectorAll(".admin-only").forEach((elemento) => {
    elemento.classList.toggle("hidden", !(usuarioLogado && usuarioLogado.perfil === "admin"));
  });

  document.querySelectorAll(".user-only").forEach((elemento) => {
    elemento.classList.toggle("hidden", !usuarioLogado);
  });

  document.querySelectorAll(".guest-only").forEach((elemento) => {
    elemento.classList.toggle("hidden", !!usuarioLogado);
  });

  document.querySelectorAll(".user-name").forEach((elemento) => {
    if (!usuarioLogado) {
      elemento.textContent = "";
      return;
    }

    elemento.textContent =
      usuarioLogado.perfil === "admin"
        ? `Admin: ${usuarioLogado.nome}`
        : `Olá, ${usuarioLogado.nome}`;
  });
}

function protegerPaginasAdmin() {
  const pagina = window.location.pathname.toLowerCase();

  const paginaProtegida =
    pagina.includes("admin.html") ||
    pagina.includes("estoque.html");

  if (paginaProtegida && !verificarSeAdmin()) {
    alert("Acesso negado. Apenas administradores podem acessar essa área.");
    window.location.href = "login.html";
  }
}

function atualizarAbasLogin(abaAtiva) {
  const botoes = document.querySelectorAll(".tab-button");

  botoes.forEach((botao) => {
    botao.classList.remove("active");
  });

  if (abaAtiva === "login" && botoes[0]) {
    botoes[0].classList.add("active");
  }

  if (abaAtiva === "cadastro" && botoes[1]) {
    botoes[1].classList.add("active");
  }
}

function mostrarCadastro() {
  const formularioLogin = document.querySelector("#login-form");
  const formularioCadastro = document.querySelector("#register-form");
  const painelUsuario = document.querySelector("#user-panel");

  if (!formularioLogin || !formularioCadastro || !painelUsuario) return;

  formularioLogin.classList.add("hidden");
  formularioCadastro.classList.remove("hidden");
  painelUsuario.classList.add("hidden");

  atualizarAbasLogin("cadastro");
}

function mostrarLogin() {
  const formularioLogin = document.querySelector("#login-form");
  const formularioCadastro = document.querySelector("#register-form");
  const painelUsuario = document.querySelector("#user-panel");

  if (!formularioLogin || !formularioCadastro || !painelUsuario) return;

  formularioCadastro.classList.add("hidden");
  formularioLogin.classList.remove("hidden");
  painelUsuario.classList.add("hidden");

  atualizarAbasLogin("login");
}

function mostrarPainelUsuario(usuario) {
  const formularioLogin = document.querySelector("#login-form");
  const formularioCadastro = document.querySelector("#register-form");
  const painelUsuario = document.querySelector("#user-panel");
  const mensagemUsuario = document.querySelector("#user-message");

  if (!formularioLogin || !formularioCadastro || !painelUsuario || !mensagemUsuario) return;

  formularioLogin.classList.add("hidden");
  formularioCadastro.classList.add("hidden");
  painelUsuario.classList.remove("hidden");

  mensagemUsuario.textContent =
    `Bem-vindo(a), ${usuario.nome}. Você está logado como ${
      usuario.perfil === "admin" ? "Administrador" : "Usuário"
    }. E-mail: ${usuario.email}.`;

  atualizarPermissoesNavbar();
}

function sairUsuario() {
  localStorage.removeItem("pedrinhoLoggedUser");

  alert("Você saiu da conta.");

  atualizarPermissoesNavbar();

  const pagina = window.location.pathname.toLowerCase();

  if (pagina.includes("admin.html") || pagina.includes("estoque.html")) {
    window.location.href = "login.html";
    return;
  }

  mostrarLogin();
}

function configurarFormulariosLogin() {
  const formularioLogin = document.querySelector("#login-form");
  const formularioCadastro = document.querySelector("#register-form");

  if (formularioCadastro) {
    formularioCadastro.addEventListener("submit", (evento) => {
      evento.preventDefault();

      const nome = document.querySelector("#register-name")?.value.trim();
      const email = document.querySelector("#register-email")?.value.trim().toLowerCase();
      const senha = document.querySelector("#register-password")?.value.trim();

      if (!nome || !email || !senha) {
        alert("Preencha todos os campos.");
        return;
      }

      if (senha.length < 4) {
        alert("A senha precisa ter pelo menos 4 caracteres.");
        return;
      }

      const usuarios = obterUsuarios();

      const usuarioExiste = usuarios.some((usuario) => {
        return usuario.email === email;
      });

      if (usuarioExiste) {
        alert("Este e-mail já está cadastrado.");
        return;
      }

      const novoUsuario = {
        nome,
        email,
        senha,
        perfil: "usuario"
      };

      usuarios.push(novoUsuario);
      salvarUsuarios(usuarios);

      definirUsuarioLogado({
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        perfil: novoUsuario.perfil
      });

      adicionarLogAdmin("USUARIO_CRIADO", `Novo usuário cadastrado: ${novoUsuario.email}`, {
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        perfil: novoUsuario.perfil
      });

      alert("Conta criada com sucesso!");

      formularioCadastro.reset();

      mostrarPainelUsuario(novoUsuario);
      atualizarPermissoesNavbar();
    });
  }

  if (formularioLogin) {
    formularioLogin.addEventListener("submit", (evento) => {
      evento.preventDefault();

      const email = document.querySelector("#login-email")?.value.trim().toLowerCase();
      const senha = document.querySelector("#login-password")?.value.trim();

      const usuarios = obterUsuarios();

      const usuario = usuarios.find((item) => {
        return item.email === email && item.senha === senha;
      });

      if (!usuario) {
        alert("E-mail ou senha incorretos.");
        return;
      }

      const usuarioLogado = {
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil || "usuario"
      };

      definirUsuarioLogado(usuarioLogado);

      adicionarLogAdmin("LOGIN_REALIZADO", `Login realizado: ${usuarioLogado.email}`, usuarioLogado);

      alert("Login realizado com sucesso!");

      formularioLogin.reset();

      mostrarPainelUsuario(usuarioLogado);
      atualizarPermissoesNavbar();

      if (usuarioLogado.perfil === "admin") {
        window.location.href = "admin.html";
      }
    });
  }
}

/* ===============================
   ADMIN
================================ */

function obterVendasAdmin() {
  const vendas = obterStorage("pedrinhoAdminSales", []);

  if (!Array.isArray(vendas)) {
    return [];
  }

  return vendas;
}

function salvarVendasAdmin(vendas) {
  salvarStorage("pedrinhoAdminSales", vendas);
}

function obterNotasAdmin() {
  const notas = obterStorage("pedrinhoAdminInvoices", []);

  if (!Array.isArray(notas)) {
    return [];
  }

  return notas;
}

function salvarNotasAdmin(notas) {
  salvarStorage("pedrinhoAdminInvoices", notas);
}

function obterLogsAdmin() {
  const logs = obterStorage("pedrinhoAdminLogs", []);

  if (!Array.isArray(logs)) {
    return [];
  }

  return logs;
}

function salvarLogsAdmin(logs) {
  salvarStorage("pedrinhoAdminLogs", logs);
}

function gerarNumeroNota() {
  const notas = obterNotasAdmin();
  const proximoNumero = notas.length + 1;

  return String(proximoNumero).padStart(4, "0");
}

function adicionarLogAdmin(tipo, mensagem, dados = null) {
  const logs = obterLogsAdmin();

  logs.unshift({
    id: Date.now(),
    tipo,
    mensagem,
    dados,
    data: new Date().toLocaleString("pt-BR")
  });

  salvarLogsAdmin(logs);
}

function registrarVendaAdmin(dadosPedido) {
  if (!dadosPedido || !dadosPedido.itens || !dadosPedido.itens.length) {
    console.error("Pedido inválido para registrar venda:", dadosPedido);
    return;
  }

  const vendas = obterVendasAdmin();
  const notas = obterNotasAdmin();
  const numeroNota = gerarNumeroNota();

  const itensLimpos = dadosPedido.itens.map((item) => {
    return {
      nome: item.nome,
      preco: Number(item.preco || 0),
      quantidade: Number(item.quantidade || 0),
      subtotal: Number(item.subtotal || Number(item.preco || 0) * Number(item.quantidade || 0))
    };
  });

  const total = Number(
    dadosPedido.total ||
    itensLimpos.reduce((soma, item) => soma + item.subtotal, 0)
  );

  const cliente = dadosPedido.cliente || {
    nome: "Cliente não identificado",
    email: "Não informado",
    perfil: "visitante"
  };

  const dataVenda = new Date().toLocaleString("pt-BR");

  const venda = {
    id: Date.now(),
    numeroNota: numeroNota,
    cliente: cliente,
    itens: itensLimpos,
    total: total,
    totalBruto: Number(dadosPedido.totalBruto || total),
    data: dataVenda
  };

  const nota = {
    numero: numeroNota,
    cliente: cliente,
    itens: itensLimpos,
    total: total,
    totalBruto: Number(dadosPedido.totalBruto || total),
    data: dataVenda
  };

  vendas.push(venda);
  notas.push(nota);

  salvarVendasAdmin(vendas);
  salvarNotasAdmin(notas);

  adicionarLogAdmin("VENDA_FINALIZADA", `Venda finalizada com NF ${numeroNota}.`, venda);

  console.log("Venda registrada no admin:", venda);
}

function obterRankingProdutos() {
  const vendas = obterVendasAdmin();
  const ranking = {};

  vendas.forEach((venda) => {
    if (!venda.itens || !Array.isArray(venda.itens)) return;

    venda.itens.forEach((item) => {
      if (!ranking[item.nome]) {
        ranking[item.nome] = {
          nome: item.nome,
          quantidade: 0,
          total: 0
        };
      }

      ranking[item.nome].quantidade += Number(item.quantidade || 0);
      ranking[item.nome].total += Number(item.subtotal || 0);
    });
  });

  return Object.values(ranking).sort((a, b) => {
    return b.quantidade - a.quantidade;
  });
}

function renderizarPainelAdmin() {
  const totalVendasElemento = document.querySelector("#admin-total-sales");
  const totalBrutoElemento = document.querySelector("#admin-gross-sales");
  const produtoMaisVendidoElemento = document.querySelector("#admin-top-product");
  const quantidadeProdutoMaisVendidoElemento = document.querySelector("#admin-top-product-qty");
  const quantidadeNotasElemento = document.querySelector("#admin-invoice-count");
  const graficoElemento = document.querySelector("#admin-products-chart");
  const tabelaNotas = document.querySelector("#admin-invoices-table");
  const logsElemento = document.querySelector("#admin-raw-logs");

  const existePainel =
    totalVendasElemento ||
    totalBrutoElemento ||
    produtoMaisVendidoElemento ||
    quantidadeProdutoMaisVendidoElemento ||
    quantidadeNotasElemento ||
    graficoElemento ||
    tabelaNotas ||
    logsElemento;

  if (!existePainel) return;

  if (!verificarSeAdmin()) {
    if (graficoElemento) {
      graficoElemento.innerHTML = `
        <p class="admin-empty">
          Faça login como administrador para visualizar o painel.
        </p>
      `;
    }

    return;
  }

  const vendas = obterVendasAdmin();
  const notas = obterNotasAdmin();
  const logs = obterLogsAdmin();
  const ranking = obterRankingProdutos();

  const totalVendas = vendas.reduce((total, venda) => {
    return total + Number(venda.total || 0);
  }, 0);

  const totalBruto = vendas.reduce((total, venda) => {
    return total + Number(venda.totalBruto || venda.total || 0);
  }, 0);

  if (totalVendasElemento) {
    totalVendasElemento.textContent = formatarDinheiro(totalVendas);
  }

  if (totalBrutoElemento) {
    totalBrutoElemento.textContent = formatarDinheiro(totalBruto);
  }

  if (produtoMaisVendidoElemento) {
    produtoMaisVendidoElemento.textContent = ranking.length ? ranking[0].nome : "Nenhum";
  }

  if (quantidadeProdutoMaisVendidoElemento) {
    quantidadeProdutoMaisVendidoElemento.textContent = ranking.length
      ? `${ranking[0].quantidade} unidades vendidas.`
      : "0 unidades vendidas.";
  }

  if (quantidadeNotasElemento) {
    quantidadeNotasElemento.textContent = notas.length;
  }

  if (graficoElemento) {
    graficoElemento.innerHTML = "";

    if (!ranking.length) {
      graficoElemento.innerHTML = `
        <p class="admin-empty">
          Nenhuma venda registrada ainda.
        </p>
      `;
    } else {
      const maiorQuantidade = ranking[0].quantidade || 1;

      ranking.forEach((produto, indice) => {
        const porcentagem = Math.max(
          8,
          Math.round((produto.quantidade / maiorQuantidade) * 100)
        );

        const linha = document.createElement("div");
        linha.className = "chart-row";

        linha.innerHTML = `
          <div class="chart-label">
            ${indice + 1}. ${produto.nome}
          </div>

          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width: ${porcentagem}%"></div>
          </div>

          <div class="chart-value">
            ${produto.quantidade}
          </div>
        `;

        graficoElemento.appendChild(linha);
      });
    }
  }

  if (tabelaNotas) {
    tabelaNotas.innerHTML = "";

    if (!notas.length) {
      tabelaNotas.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:#999;padding:2rem">
            Nenhuma nota fiscal emitida.
          </td>
        </tr>
      `;
    } else {
      notas
        .slice()
        .reverse()
        .forEach((nota) => {
          const linha = document.createElement("tr");

          linha.innerHTML = `
            <td><strong>${nota.numero}</strong></td>
            <td>${nota.cliente?.nome || "Cliente não identificado"}</td>
            <td>${nota.data}</td>
            <td>${formatarDinheiro(nota.total)}</td>
            <td>${nota.itens ? nota.itens.length : 0} item(ns)</td>
          `;

          tabelaNotas.appendChild(linha);
        });
    }
  }

  if (logsElemento) {
    logsElemento.textContent = logs.length
      ? JSON.stringify(logs, null, 2)
      : "Nenhum log registrado.";
  }
}

function copiarLogsAdmin() {
  const logs = obterLogsAdmin();

  if (!logs.length) {
    alert("Não existem logs para copiar.");
    return;
  }

  const texto = JSON.stringify(logs, null, 2);

  navigator.clipboard.writeText(texto)
    .then(() => {
      alert("Logs copiados com sucesso!");
    })
    .catch(() => {
      alert("Não foi possível copiar os logs.");
    });
}

function limparDadosAdmin() {
  if (!verificarSeAdmin()) {
    alert("Apenas administradores podem limpar os dados.");
    return;
  }

  const confirmar = confirm(
    "Deseja apagar vendas, notas fiscais e logs? Essa ação não pode ser desfeita."
  );

  if (!confirmar) return;

  localStorage.removeItem("pedrinhoAdminSales");
  localStorage.removeItem("pedrinhoAdminInvoices");
  localStorage.removeItem("pedrinhoAdminLogs");

  alert("Dados administrativos apagados com sucesso.");

  renderizarPainelAdmin();
}

/* ===============================
   INICIALIZAÇÃO
================================ */

document.addEventListener("DOMContentLoaded", () => {
  iniciarAdministradorPadrao();
  obterListaEstoque();

  configurarCarrossel();
  configurarFiltros();
  configurarFormulariosLogin();

  const usuarioLogado = obterUsuarioLogado();

  if (usuarioLogado && document.querySelector("#user-panel")) {
    mostrarPainelUsuario(usuarioLogado);
  }

  atualizarPermissoesNavbar();
  protegerPaginasAdmin();

  renderizarCarrinho();
  renderizarBadgesEstoque();
  renderizarTabelaEstoque();
  renderizarPainelAdmin();
  renderizarPaginaPagamento();
});

/* ===============================
   EXPOR FUNÇÕES PARA O HTML
================================ */

window.abrirCarrinho = abrirCarrinho;
window.fecharCarrinho = fecharCarrinho;
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.aumentarQuantidade = aumentarQuantidade;
window.diminuirQuantidade = diminuirQuantidade;
window.removerDoCarrinho = removerDoCarrinho;
window.limparCarrinho = limparCarrinho;

window.finalizarPedido = finalizarPedido;
window.iniciarPagamento = iniciarPagamento;
window.abrirModalPagamento = abrirModalPagamento;
window.fecharModalPagamento = fecharModalPagamento;
window.confirmarPagamento = confirmarPagamento;
window.confirmarPagamentoPagina = confirmarPagamentoPagina;
window.cancelarPagamentoPagina = cancelarPagamentoPagina;

window.mostrarLogin = mostrarLogin;
window.mostrarCadastro = mostrarCadastro;
window.sairUsuario = sairUsuario;

window.restaurarEstoquePadrao = restaurarEstoquePadrao;
window.salvarEstoqueDoInput = salvarEstoqueDoInput;

window.limparDadosAdmin = limparDadosAdmin;
window.copiarLogsAdmin = copiarLogsAdmin;

/* Compatibilidade com nomes antigos em inglês */

window.openCart = abrirCarrinho;
window.closeCart = fecharCarrinho;
window.addToCart = adicionarAoCarrinho;
window.increaseQuantity = aumentarQuantidade;
window.decreaseQuantity = diminuirQuantidade;
window.removeFromCart = removerDoCarrinho;
window.clearCart = limparCarrinho;

window.finishOrder = finalizarPedido;
window.startPayment = iniciarPagamento;
window.openPaymentModal = abrirModalPagamento;
window.closePaymentModal = fecharModalPagamento;
window.confirmPayment = confirmarPagamento;

window.showLogin = mostrarLogin;
window.showRegister = mostrarCadastro;
window.logoutUser = sairUsuario;

window.resetStockSystem = restaurarEstoquePadrao;
window.saveStockFromInput = salvarEstoqueDoInput;

window.resetAdminData = limparDadosAdmin;
window.copyAdminLogs = copiarLogsAdmin;
window.finalizarPedido = finalizarPedido;
window.iniciarPagamento = iniciarPagamento;
window.renderizarPaginaPagamento = renderizarPaginaPagamento;
window.confirmarPagamentoPagina = confirmarPagamentoPagina;
window.cancelarPagamentoPagina = cancelarPagamentoPagina;

window.finishOrder = finalizarPedido;
window.startPayment = iniciarPagamento;