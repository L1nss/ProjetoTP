//init

document.addEventListener("DOMContentLoaded", () => {
  iniciarAdministradorPadrao();
  atualizarPermissoesNavbar();
  protegerPaginasAdmin();
  configurarFiltros();
  renderizarBadgesEstoque();
  renderizarTabelaEstoque();
  renderizarCarrinho();
  renderizarPaginaPagamento();
  renderizarPaginaAgendamento();
});

//utilitários

function obterStorage(chave, padrao = null) {
  try {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : padrao;
  } catch {
    return padrao;
  }
}

function salvarStorage(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
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

//estoque

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

const servicosAgendamento = [
  "Aferição de Pressão",
  "Testes Rápidos",
  "Orientação Farmacêutica",
  "Acompanhamento Farmacêutico"
];

function converterEstoqueAntigo(lista) {
  if (!Array.isArray(lista)) return null;

  return lista
    .map((item) => ({
      nome: item.nome || item.name,
      categoria: item.categoria || item.category,
      quantidade: Number(item.quantidade ?? item.quantity ?? 0)
    }))
    .filter((item) => item.nome);
}

function obterListaEstoque() {
  const salvo = obterStorage("pedrinhoStock", null);
  const convertido = converterEstoqueAntigo(salvo);

  if (!convertido || !convertido.length) {
    salvarStorage("pedrinhoStock", estoquePadrao);
    return [...estoquePadrao];
  }

  return convertido;
}

function salvarListaEstoque(lista) {
  salvarStorage("pedrinhoStock", lista);
}

function obterEstoqueProduto(nomeProduto) {
  const produto = obterListaEstoque().find((item) => item.nome === nomeProduto);
  return produto ? Number(produto.quantidade) : 999;
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
  const lista = obterListaEstoque();
  const produto = lista.find((item) => item.nome === nomeProduto);

  if (!produto) return;

  produto.quantidade = Math.max(0, Number(produto.quantidade) - Number(quantidade));
  salvarListaEstoque(lista);
}

function atualizarEstoqueProduto(nomeProduto, novaQuantidade) {
  const lista = obterListaEstoque();
  const produto = lista.find((item) => item.nome === nomeProduto);

  if (!produto) return;

  produto.quantidade = Math.max(0, Number(novaQuantidade));

  salvarListaEstoque(lista);
  renderizarBadgesEstoque();
  renderizarTabelaEstoque();
}

function restaurarEstoquePadrao() {
  if (!verificarSeAdmin()) {
    alert("Apenas administradores podem restaurar o estoque.");
    return;
  }

  if (!confirm("Deseja restaurar o estoque padrão?")) return;

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
        <td colspan="5" style="text-align:center;padding:2rem;color:#999;">
          Acesso restrito para administradores.
        </td>
      </tr>
    `;
    return;
  }

  corpoTabela.innerHTML = "";

  obterListaEstoque().forEach((produto) => {
    const status = obterStatusEstoque(produto.quantidade);
    const idInput = `stock-${criarIdSeguro(produto.nome)}`;

    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td><strong>${produto.nome}</strong></td>
      <td>${produto.categoria}</td>
      <td>
        <input type="number" min="0" value="${produto.quantidade}" id="${idInput}" />
      </td>
      <td>
        <span class="${status.classe}">${status.texto}</span>
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

  const input = document.getElementById(`stock-${criarIdSeguro(nomeProduto)}`);

  if (!input) return;

  const quantidade = Number(input.value);

  if (Number.isNaN(quantidade) || quantidade < 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  atualizarEstoqueProduto(nomeProduto, quantidade);

  adicionarLogAdmin("ESTOQUE_ATUALIZADO", `Estoque atualizado para ${nomeProduto}.`, {
    produto: nomeProduto,
    quantidade: quantidade
  });

  alert("Estoque atualizado com sucesso!");
}

//carrinho de compras

function converterCarrinhoAntigo(lista) {
  if (!Array.isArray(lista)) return [];

  return lista
    .map((item) => ({
      nome: item.nome || item.name,
      preco: Number(item.preco ?? item.price ?? 0),
      imagem: item.imagem || item.image || "",
      quantidade: Number(item.quantidade ?? item.quantity ?? 1)
    }))
    .filter((item) => item.nome);
}

let carrinho = converterCarrinhoAntigo(obterStorage("pedrinhoCart", []));

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
  const produto = carrinho.find((item) => item.nome === nomeProduto);
  return produto ? Number(produto.quantidade) : 0;
}

function adicionarAoCarrinho(nome, preco, imagem) {
  if (servicosAgendamento.includes(nome)) {
    agendarServico(nome, preco, imagem);
    return;
  }

  const estoque = obterEstoqueProduto(nome);
  const quantidadeNoCarrinho = obterQuantidadeProdutoCarrinho(nomeProduto = nome);

  if (estoque <= 0) {
    alert("Produto esgotado.");
    return;
  }

  if (quantidadeNoCarrinho >= estoque) {
    alert("Você já adicionou a quantidade máxima disponível desse produto.");
    return;
  }

  const existente = carrinho.find((item) => item.nome === nome);

  if (existente) {
    existente.quantidade += 1;
  } else {
    carrinho.push({
      nome: nome,
      preco: Number(preco),
      imagem: imagem,
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

  if (item.quantidade >= obterEstoqueProduto(item.nome)) {
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

  if (!confirm("Deseja limpar o carrinho?")) return;

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
    const artigo = document.createElement("article");
    artigo.className = "cart-item";

    artigo.innerHTML = `
      <img src="${item.imagem}" alt="${item.nome}" />

      <div class="cart-item-content">
        <div class="cart-item-info">
          <strong>${item.nome}</strong>
          <span>${formatarDinheiro(item.preco)}</span>
          <small class="cart-stock-info">
            Estoque disponível: ${obterEstoqueProduto(item.nome)}
          </small>
        </div>

        <div class="cart-item-actions">
          <button type="button" onclick="diminuirQuantidade(${indice})">−</button>
          <span>${item.quantidade}</span>
          <button type="button" onclick="aumentarQuantidade(${indice})">+</button>
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

//pagamento

const LINK_QR_CODE_PAGAMENTO = "https://youtu.be/kAOZ14Tjg7A?si=F4XzVReQ7rPesPRp&t=56";

function montarPedidoDoCarrinho() {
  const usuario = obterUsuarioLogado();
  const total = obterTotalCarrinho();

  return {
    cliente: usuario
      ? {
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil || "usuario"
        }
      : {
          nome: "Cliente não identificado",
          email: "Não informado",
          perfil: "visitante"
        },

    itens: carrinho.map((item) => ({
      nome: item.nome,
      preco: Number(item.preco),
      imagem: item.imagem,
      quantidade: Number(item.quantidade),
      subtotal: Number(item.preco) * Number(item.quantidade)
    })),

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
  return obterStorage("pedrinhoPedidoPendente", null);
}

function gerarTextoPagamento(pedido) {
  const itensTexto = pedido.itens
    .map((item) => `${item.quantidade}x ${item.nome} - ${formatarDinheiro(item.subtotal)}`)
    .join(" | ");

  return (
    `PEDRINHO FARMÁCIAS\n` +
    `Cliente: ${pedido.cliente.nome}\n` +
    `Total: ${formatarDinheiro(pedido.total)}\n` +
    `Itens: ${itensTexto}\n` +
    `Link: ${LINK_QR_CODE_PAGAMENTO}`
  );
}

function gerarQrCode(elemento, texto) {
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

  const img = document.createElement("img");

  img.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
    encodeURIComponent(texto);

  img.alt = "QR Code";

  elemento.appendChild(img);
}

function renderizarPaginaPagamento() {
  const listaItens = document.querySelector("#payment-order-items");
  const totalResumo = document.querySelector("#payment-page-total");
  const totalQr = document.querySelector("#payment-page-total-qr");
  const caixaQr = document.querySelector("#payment-page-qrcode");

  if (!listaItens || !totalResumo || !totalQr || !caixaQr) return;

  const pedido = obterPedidoPendentePagamento();

  if (!pedido || !pedido.itens || !pedido.itens.length) {
    listaItens.innerHTML = `<p class="empty-cart">Nenhum pedido encontrado.</p>`;
    totalResumo.textContent = "R$ 0,00";
    totalQr.textContent = "R$ 0,00";
    gerarQrCode(caixaQr, LINK_QR_CODE_PAGAMENTO);
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

  gerarQrCode(caixaQr, LINK_QR_CODE_PAGAMENTO);
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

  alert("Pagamento confirmado com sucesso!");

  window.location.href = "admin.html";
}

function cancelarPagamentoPagina() {
  if (!confirm("Deseja cancelar este pagamento?")) return;

  localStorage.removeItem("pedrinhoPedidoPendente");

  alert("Pagamento cancelado.");

  window.location.href = "index.html";
}

function abrirModalPagamento(pedido) {
  salvarStorage("pedrinhoPedidoPendente", pedido);
  window.location.href = "pagamento.html";
}

function fecharModalPagamento() {
  const modal = document.querySelector("#payment-modal");
  if (modal) modal.classList.remove("active");
}

function confirmarPagamento() {
  confirmarPagamentoPagina();
}

//agendamento de serviços

function agendarServico(nome, preco, imagem) {
  const servico = {
    nome: nome,
    preco: Number(preco),
    imagem: imagem,
    criadoEm: new Date().toLocaleString("pt-BR")
  };

  salvarStorage("pedrinhoServicoAgendamento", servico);

  window.location.href = "agendamento.html";
}

function obterServicoAgendamento() {
  return obterStorage("pedrinhoServicoAgendamento", null);
}

function obterAgendamentos() {
  const lista = obterStorage("pedrinhoAgendamentos", []);
  return Array.isArray(lista) ? lista : [];
}

function salvarAgendamentos(lista) {
  salvarStorage("pedrinhoAgendamentos", lista);
}

function renderizarPaginaAgendamento() {
  const caixaServico = document.querySelector("#agendamento-servico");
  const formulario = document.querySelector("#agendamento-form");

  if (!caixaServico || !formulario) return;

  const servico = obterServicoAgendamento();
  const usuario = obterUsuarioLogado();

  if (usuario) {
    const nomeInput = document.querySelector("#agendamento-nome");
    const emailInput = document.querySelector("#agendamento-email");

    if (nomeInput) nomeInput.value = usuario.nome || "";
    if (emailInput) emailInput.value = usuario.email || "";
  }

  if (!servico) {
    caixaServico.innerHTML = `
      <p class="empty-cart">
        Nenhum serviço selecionado. Volte para a página de serviços.
      </p>
    `;
    return;
  }

  caixaServico.innerHTML = `
    <div class="agendamento-servico-card">
      <img src="${servico.imagem}" alt="${servico.nome}" />

      <div>
        <h3>${servico.nome}</h3>

        <p>
          Serviço selecionado para agendamento na Pedrinho Farmácias.
          Preencha seus dados para confirmar.
        </p>

        <span class="agendamento-preco">
          ${servico.preco > 0 ? formatarDinheiro(servico.preco) : "Grátis"}
        </span>
      </div>
    </div>
  `;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const nome = document.querySelector("#agendamento-nome")?.value.trim();
    const email = document.querySelector("#agendamento-email")?.value.trim();
    const telefone = document.querySelector("#agendamento-telefone")?.value.trim();
    const data = document.querySelector("#agendamento-data")?.value;
    const hora = document.querySelector("#agendamento-hora")?.value;
    const observacao = document.querySelector("#agendamento-observacao")?.value.trim();

    if (!nome || !email || !telefone || !data || !hora) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const agendamento = {
      id: Date.now(),
      servico: servico.nome,
      preco: servico.preco,
      imagem: servico.imagem,
      cliente: {
        nome: nome,
        email: email,
        telefone: telefone
      },
      data: data,
      hora: hora,
      observacao: observacao || "Nenhuma observação",
      status: "Agendado",
      criadoEm: new Date().toLocaleString("pt-BR")
    };

    const agendamentos = obterAgendamentos();

    agendamentos.push(agendamento);

    salvarAgendamentos(agendamentos);

    adicionarLogAdmin(
      "AGENDAMENTO_CRIADO",
      `Agendamento criado para ${servico.nome}.`,
      agendamento
    );

    localStorage.removeItem("pedrinhoServicoAgendamento");

    alert("Agendamento confirmado com sucesso!");

    window.location.href = "servicos.html";
  });
}

function cancelarAgendamento() {
  localStorage.removeItem("pedrinhoServicoAgendamento");

  alert("Agendamento cancelado.");

  window.location.href = "servicos.html";
}

//filtros

function configurarFiltros() {
  const campoBusca = document.querySelector("#product-search");
  const cards = document.querySelectorAll(".produto-card, .product-card");
  const botoes = document.querySelectorAll(".filter-btn");

  let filtroAtivo = "all";

  function filtrar() {
    const termo = campoBusca ? normalizarTexto(campoBusca.value) : "";

    cards.forEach((card) => {
      const nome = normalizarTexto(card.dataset.name);
      const categoria = card.dataset.category;
      const combinaBusca = nome.includes(termo);
      const combinaFiltro = filtroAtivo === "all" || categoria === filtroAtivo;

      card.style.display = combinaBusca && combinaFiltro ? "" : "none";
    });
  }

  if (campoBusca) {
    campoBusca.addEventListener("input", filtrar);
  }

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      botoes.forEach((btn) => btn.classList.remove("active"));
      botao.classList.add("active");
      filtroAtivo = botao.dataset.filter || "all";
      filtrar();
    });
  });
}

//login e administração

function converterUsuariosAntigos(lista) {
  if (!Array.isArray(lista)) return [];

  return lista
    .map((usuario) => ({
      nome: usuario.nome || usuario.name,
      email: usuario.email,
      senha: usuario.senha || usuario.password,
      perfil: usuario.perfil || usuario.role || "usuario"
    }))
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

  const existeAdmin = usuarios.some((usuario) => usuario.email === "admin@pedrinho.com");

  if (!existeAdmin) {
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
  const usuario = obterUsuarioLogado();
  return usuario && usuario.perfil === "admin";
}

function atualizarPermissoesNavbar() {
  const usuario = obterUsuarioLogado();

  document.querySelectorAll(".admin-only").forEach((el) => {
    el.classList.toggle("hidden", !(usuario && usuario.perfil === "admin"));
  });

  document.querySelectorAll(".user-only").forEach((el) => {
    el.classList.toggle("hidden", !usuario);
  });

  document.querySelectorAll(".guest-only").forEach((el) => {
    el.classList.toggle("hidden", !!usuario);
  });

  document.querySelectorAll(".user-name").forEach((el) => {
    if (!usuario) {
      el.textContent = "";
      return;
    }

    el.textContent =
      usuario.perfil === "admin"
        ? `Admin: ${usuario.nome}`
        : `Olá, ${usuario.nome}`;
  });
}

function protegerPaginasAdmin() {
  const pagina = window.location.pathname.toLowerCase();

  const protegida =
    pagina.includes("admin.html") ||
    pagina.includes("estoque.html");

  if (protegida && !verificarSeAdmin()) {
    alert("Acesso negado. Apenas administradores podem acessar essa área.");
    window.location.href = "login.html";
  }
}

function mostrarCadastro() {
  const login = document.querySelector("#login-form");
  const cadastro = document.querySelector("#register-form");
  const painel = document.querySelector("#user-panel");

  if (!login || !cadastro || !painel) return;

  login.classList.add("hidden");
  cadastro.classList.remove("hidden");
  painel.classList.add("hidden");
}

function mostrarLogin() {
  const login = document.querySelector("#login-form");
  const cadastro = document.querySelector("#register-form");
  const painel = document.querySelector("#user-panel");

  if (!login || !cadastro || !painel) return;

  cadastro.classList.add("hidden");
  login.classList.remove("hidden");
  painel.classList.add("hidden");
}

function mostrarPainelUsuario(usuario) {
  const login = document.querySelector("#login-form");
  const cadastro = document.querySelector("#register-form");
  const painel = document.querySelector("#user-panel");
  const mensagem = document.querySelector("#user-message");

  if (!login || !cadastro || !painel || !mensagem) return;

  login.classList.add("hidden");
  cadastro.classList.add("hidden");
  painel.classList.remove("hidden");

  mensagem.textContent =
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
  }
}

function configurarFormulariosLogin() {
  const login = document.querySelector("#login-form");
  const cadastro = document.querySelector("#register-form");

  if (cadastro) {
    cadastro.addEventListener("submit", (evento) => {
      evento.preventDefault();

      const nome = document.querySelector("#register-name")?.value.trim();
      const email = document.querySelector("#register-email")?.value.trim().toLowerCase();
      const senha = document.querySelector("#register-password")?.value.trim();

      if (!nome || !email || !senha) {
        alert("Preencha todos os campos.");
        return;
      }

      const usuarios = obterUsuarios();

      if (usuarios.some((usuario) => usuario.email === email)) {
        alert("Este e-mail já está cadastrado.");
        return;
      }

      const novo = {
        nome: nome,
        email: email,
        senha: senha,
        perfil: "usuario"
      };

      usuarios.push(novo);
      salvarUsuarios(usuarios);

      definirUsuarioLogado({
        nome: novo.nome,
        email: novo.email,
        perfil: novo.perfil
      });

      adicionarLogAdmin("USUARIO_CRIADO", `Novo usuário cadastrado: ${email}`, novo);

      alert("Conta criada com sucesso!");

      cadastro.reset();

      mostrarPainelUsuario(novo);
    });
  }

  if (login) {
    login.addEventListener("submit", (evento) => {
      evento.preventDefault();

      const email = document.querySelector("#login-email")?.value.trim().toLowerCase();
      const senha = document.querySelector("#login-password")?.value.trim();

      const usuario = obterUsuarios().find((item) => {
        return item.email === email && item.senha === senha;
      });

      if (!usuario) {
        alert("E-mail ou senha incorretos.");
        return;
      }

      definirUsuarioLogado({
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil || "usuario"
      });

      adicionarLogAdmin("LOGIN_REALIZADO", `Login realizado: ${usuario.email}`, usuario);

      alert("Login realizado com sucesso!");

      login.reset();

      if (usuario.perfil === "admin") {
        window.location.href = "admin.html";
      } else {
        mostrarPainelUsuario(usuario);
      }
    });
  }
}

//admin functions

function obterVendasAdmin() {
  const vendas = obterStorage("pedrinhoAdminSales", []);
  return Array.isArray(vendas) ? vendas : [];
}

function salvarVendasAdmin(vendas) {
  salvarStorage("pedrinhoAdminSales", vendas);
}

function obterNotasAdmin() {
  const notas = obterStorage("pedrinhoAdminInvoices", []);
  return Array.isArray(notas) ? notas : [];
}

function salvarNotasAdmin(notas) {
  salvarStorage("pedrinhoAdminInvoices", notas);
}

function obterLogsAdmin() {
  const logs = obterStorage("pedrinhoAdminLogs", []);
  return Array.isArray(logs) ? logs : [];
}

function salvarLogsAdmin(logs) {
  salvarStorage("pedrinhoAdminLogs", logs);
}

function gerarNumeroNota() {
  return String(obterNotasAdmin().length + 1).padStart(4, "0");
}

function adicionarLogAdmin(tipo, mensagem, dados = null) {
  const logs = obterLogsAdmin();

  logs.unshift({
    id: Date.now(),
    tipo: tipo,
    mensagem: mensagem,
    dados: dados,
    data: new Date().toLocaleString("pt-BR")
  });

  salvarLogsAdmin(logs);
}

function registrarVendaAdmin(pedido) {
  if (!pedido || !pedido.itens || !pedido.itens.length) return;

  const vendas = obterVendasAdmin();
  const notas = obterNotasAdmin();
  const numeroNota = gerarNumeroNota();

  const itens = pedido.itens.map((item) => ({
    nome: item.nome,
    preco: Number(item.preco || 0),
    quantidade: Number(item.quantidade || 0),
    subtotal: Number(item.subtotal || Number(item.preco || 0) * Number(item.quantidade || 0))
  }));

  const total = Number(
    pedido.total ||
    itens.reduce((soma, item) => soma + item.subtotal, 0)
  );

  const cliente = pedido.cliente || {
    nome: "Cliente não identificado",
    email: "Não informado",
    perfil: "visitante"
  };

  const data = new Date().toLocaleString("pt-BR");

  const venda = {
    id: Date.now(),
    numeroNota: numeroNota,
    cliente: cliente,
    itens: itens,
    total: total,
    totalBruto: Number(pedido.totalBruto || total),
    data: data
  };

  const nota = {
    numero: numeroNota,
    cliente: cliente,
    itens: itens,
    total: total,
    totalBruto: Number(pedido.totalBruto || total),
    data: data
  };

  vendas.push(venda);
  notas.push(nota);

  salvarVendasAdmin(vendas);
  salvarNotasAdmin(notas);

  adicionarLogAdmin("VENDA_FINALIZADA", `Venda finalizada com NF ${numeroNota}.`, venda);
}

function obterRankingProdutos() {
  const ranking = {};

  obterVendasAdmin().forEach((venda) => {
    if (!Array.isArray(venda.itens)) return;

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

  return Object.values(ranking).sort((a, b) => b.quantidade - a.quantidade);
}

function obterAgendamentosAdmin() {
  const agendamentos = obterStorage("pedrinhoAgendamentos", []);
  return Array.isArray(agendamentos) ? agendamentos : [];
}

function formatarDataAgendamento(data) {
  if (!data) return "Não informada";

  const partes = data.split("-");

  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function renderizarAgendamentosAdmin() {
  const tabela = document.querySelector("#admin-appointments-table");

  if (!tabela) return;

  const agendamentos = obterAgendamentosAdmin();

  tabela.innerHTML = "";

  if (!agendamentos.length) {
    tabela.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:#999;padding:2rem">
          Nenhum agendamento registrado.
        </td>
      </tr>
    `;
    return;
  }

  agendamentos
    .slice()
    .reverse()
    .forEach((agendamento) => {
      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td>
          <strong>${agendamento.servico || "Serviço não informado"}</strong>
          <br>
          <small>${Number(agendamento.preco || 0) > 0 ? formatarDinheiro(agendamento.preco) : "Grátis"}</small>
        </td>

        <td>
          ${agendamento.cliente?.nome || "Cliente não informado"}
          <br>
          <small>${agendamento.cliente?.email || "E-mail não informado"}</small>
        </td>

        <td>
          ${agendamento.cliente?.telefone || "Telefone não informado"}
        </td>

        <td>
          ${formatarDataAgendamento(agendamento.data)}
        </td>

        <td>
          ${agendamento.hora || "Não informado"}
        </td>

        <td>
          <span class="status-ok">
            ${agendamento.status || "Agendado"}
          </span>
        </td>
      `;

      tabela.appendChild(linha);
    });
}

function limparAgendamentosAdmin() {
  if (!confirm("Deseja apagar todos os agendamentos?")) return;

  localStorage.removeItem("pedrinhoAgendamentos");

  adicionarLogAdmin(
    "AGENDAMENTOS_LIMPOS",
    "Todos os agendamentos foram apagados pelo administrador.",
    null
  );

  alert("Agendamentos apagados com sucesso.");

  renderizarAgendamentosAdmin();
  renderizarPainelAdmin();
}

function renderizarPainelAdmin() {
  const totalVendas = document.querySelector("#admin-total-sales");
  const totalBruto = document.querySelector("#admin-gross-sales");
  const produtoTop = document.querySelector("#admin-top-product");
  const produtoQtd = document.querySelector("#admin-top-product-qty");
  const notasQtd = document.querySelector("#admin-invoice-count");
  const grafico = document.querySelector("#admin-products-chart");
  const tabela = document.querySelector("#admin-invoices-table");
  const logsEl = document.querySelector("#admin-raw-logs");

  const existePainel =
    totalVendas ||
    totalBruto ||
    produtoTop ||
    produtoQtd ||
    notasQtd ||
    grafico ||
    tabela ||
    logsEl;

  if (!existePainel) return;

  const vendas = obterVendasAdmin();
  const notas = obterNotasAdmin();
  const logs = obterLogsAdmin();
  const ranking = obterRankingProdutos();

  const somaTotal = vendas.reduce((soma, venda) => soma + Number(venda.total || 0), 0);
  const somaBruto = vendas.reduce((soma, venda) => soma + Number(venda.totalBruto || venda.total || 0), 0);

  if (totalVendas) totalVendas.textContent = formatarDinheiro(somaTotal);
  if (totalBruto) totalBruto.textContent = formatarDinheiro(somaBruto);
  if (produtoTop) produtoTop.textContent = ranking.length ? ranking[0].nome : "Nenhum";

  if (produtoQtd) {
    produtoQtd.textContent = ranking.length
      ? `${ranking[0].quantidade} unidades vendidas.`
      : "0 unidades vendidas.";
  }

  if (notasQtd) notasQtd.textContent = notas.length;

  if (grafico) {
    grafico.innerHTML = "";

    if (!ranking.length) {
      grafico.innerHTML = `<p class="admin-empty">Nenhuma venda registrada ainda.</p>`;
    } else {
      const maior = ranking[0].quantidade || 1;

      ranking.forEach((produto, indice) => {
        const porcentagem = Math.max(8, Math.round((produto.quantidade / maior) * 100));

        const linha = document.createElement("div");
        linha.className = "chart-row";

        linha.innerHTML = `
          <div class="chart-label">${indice + 1}. ${produto.nome}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${porcentagem}%"></div>
          </div>
          <div class="chart-value">${produto.quantidade}</div>
        `;

        grafico.appendChild(linha);
      });
    }
  }

  if (tabela) {
    tabela.innerHTML = "";

    if (!notas.length) {
      tabela.innerHTML = `
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

          tabela.appendChild(linha);
        });
    }
  }

  if (logsEl) {
    logsEl.textContent = logs.length
      ? JSON.stringify(logs, null, 2)
      : "Nenhum log registrado.";
  }

  renderizarAgendamentosAdmin();
}

function copiarLogsAdmin() {
  const logs = obterLogsAdmin();

  if (!logs.length) {
    alert("Não existem logs para copiar.");
    return;
  }

  navigator.clipboard.writeText(JSON.stringify(logs, null, 2))
    .then(() => alert("Logs copiados com sucesso!"))
    .catch(() => alert("Não foi possível copiar os logs."));
}

function limparDadosAdmin() {
  if (!confirm("Deseja apagar vendas, notas fiscais e logs?")) return;

  localStorage.removeItem("pedrinhoAdminSales");
  localStorage.removeItem("pedrinhoAdminInvoices");
  localStorage.removeItem("pedrinhoAdminLogs");

  alert("Dados administrativos apagados com sucesso.");

  renderizarPainelAdmin();
}

//carrossel de imagens

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

//inicialização geral ao carregar a página

document.addEventListener("DOMContentLoaded", () => {
  iniciarAdministradorPadrao();
  obterListaEstoque();

  configurarCarrossel();
  configurarFiltros();
  configurarFormulariosLogin();

  const usuario = obterUsuarioLogado();

  if (usuario && document.querySelector("#user-panel")) {
    mostrarPainelUsuario(usuario);
  }

  atualizarPermissoesNavbar();
  protegerPaginasAdmin();

  renderizarCarrinho();
  renderizarBadgesEstoque();
  renderizarTabelaEstoque();
  renderizarPainelAdmin();
  renderizarPaginaPagamento();
  renderizarPaginaAgendamento();
  renderizarAgendamentosAdmin();
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
window.confirmarPagamentoPagina = confirmarPagamentoPagina;
window.cancelarPagamentoPagina = cancelarPagamentoPagina;
window.confirmarPagamento = confirmarPagamento;
window.fecharModalPagamento = fecharModalPagamento;

window.agendarServico = agendarServico;
window.cancelarAgendamento = cancelarAgendamento;

window.mostrarLogin = mostrarLogin;
window.mostrarCadastro = mostrarCadastro;
window.sairUsuario = sairUsuario;

window.restaurarEstoquePadrao = restaurarEstoquePadrao;
window.salvarEstoqueDoInput = salvarEstoqueDoInput;

window.limparDadosAdmin = limparDadosAdmin;
window.copiarLogsAdmin = copiarLogsAdmin;
window.limparAgendamentosAdmin = limparAgendamentosAdmin;
window.renderizarAgendamentosAdmin = renderizarAgendamentosAdmin;

window.openCart = abrirCarrinho;
window.closeCart = fecharCarrinho;
window.addToCart = adicionarAoCarrinho;
window.increaseQuantity = aumentarQuantidade;
window.decreaseQuantity = diminuirQuantidade;
window.removeFromCart = removerDoCarrinho;
window.clearCart = limparCarrinho;

window.finishOrder = finalizarPedido;
window.startPayment = iniciarPagamento;
window.confirmPayment = confirmarPagamento;
window.closePaymentModal = fecharModalPagamento;

window.showLogin = mostrarLogin;
window.showRegister = mostrarCadastro;
window.logoutUser = sairUsuario;

window.resetStockSystem = restaurarEstoquePadrao;
window.saveStockFromInput = salvarEstoqueDoInput;

window.resetAdminData = limparDadosAdmin;
window.copyAdminLogs = copiarLogsAdmin;