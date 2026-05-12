/* ===============================
   CARROSSEL
================================ */

const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");

let currentSlide = 0;
let carouselInterval;

function showSlide(index) {
  if (!slides.length || !dots.length) return;

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  currentSlide = index;
}

function nextSlide() {
  if (!slides.length) return;

  const nextIndex = (currentSlide + 1) % slides.length;
  showSlide(nextIndex);
}

function startCarousel() {
  if (slides.length <= 1) return;

  carouselInterval = setInterval(nextSlide, 5500);
}

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    clearInterval(carouselInterval);
    showSlide(index);
    startCarousel();
  });
});

startCarousel();

/* ===============================
   SISTEMA DE ESTOQUE
================================ */

const defaultStock = [
  { name: "Kit Medicamentos Essenciais", category: "Medicamentos", quantity: 18 },
  { name: "Vitaminas e Imunidade", category: "Medicamentos", quantity: 24 },
  { name: "Combo Skincare", category: "Perfumaria", quantity: 12 },
  { name: "Medicamento Genérico", category: "Medicamentos", quantity: 30 },
  { name: "Perfume Especial", category: "Perfumaria", quantity: 9 },
  { name: "Teste Rápido", category: "Serviços", quantity: 15 },
  { name: "Analgésico", category: "Medicamentos", quantity: 22 },
  { name: "Kit Higiene Pessoal", category: "Perfumaria", quantity: 17 },
  { name: "Perfume Feminino", category: "Perfumaria", quantity: 8 },
  { name: "Kit Maquiagem", category: "Perfumaria", quantity: 11 },
  { name: "Aferição de Pressão", category: "Serviços", quantity: 20 },
  { name: "Testes Rápidos", category: "Serviços", quantity: 14 },
  { name: "Orientação Farmacêutica", category: "Serviços", quantity: 25 },
  { name: "Acompanhamento Farmacêutico", category: "Serviços", quantity: 10 }
];

function getStockList() {
  const savedStock = JSON.parse(localStorage.getItem("pedrinhoStock"));

  if (!savedStock) {
    localStorage.setItem("pedrinhoStock", JSON.stringify(defaultStock));
    return defaultStock;
  }

  return savedStock;
}

function saveStockList(stockList) {
  localStorage.setItem("pedrinhoStock", JSON.stringify(stockList));
}

function getProductStock(productName) {
  const stockList = getStockList();
  const product = stockList.find((item) => item.name === productName);

  return product ? product.quantity : 0;
}

function getStockStatus(quantity) {
  if (quantity <= 0) {
    return {
      text: "Esgotado",
      className: "stock-empty"
    };
  }

  if (quantity <= 5) {
    return {
      text: "Estoque baixo",
      className: "stock-low"
    };
  }

  return {
    text: "Disponível",
    className: "stock-available"
  };
}

function decreaseStock(productName, quantity) {
  const stockList = getStockList();
  const product = stockList.find((item) => item.name === productName);

  if (!product) return;

  product.quantity -= quantity;

  if (product.quantity < 0) {
    product.quantity = 0;
  }

  saveStockList(stockList);
}

function updateProductStock(productName, newQuantity) {
  const stockList = getStockList();
  const product = stockList.find((item) => item.name === productName);

  if (!product) return;

  product.quantity = Number(newQuantity);

  saveStockList(stockList);
  renderProductStockBadges();
  renderStockTable();
}

function resetStockSystem() {
  if (!isAdmin()) {
    alert("Apenas administradores podem restaurar o estoque.");
    return;
  }

  const confirmReset = confirm("Deseja restaurar o estoque padrão?");

  if (!confirmReset) return;

  localStorage.setItem("pedrinhoStock", JSON.stringify(defaultStock));

  addAdminLog("ESTOQUE_RESTAURADO", "O estoque padrão foi restaurado.", defaultStock);

  alert("Estoque restaurado com sucesso!");

  renderProductStockBadges();
  renderStockTable();
}

function renderProductStockBadges() {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    const productName = card.dataset.name;

    if (!productName) return;

    const quantity = getProductStock(productName);
    const status = getStockStatus(quantity);

    let stockBadge = card.querySelector(".stock-badge");

    if (!stockBadge) {
      stockBadge = document.createElement("div");
      stockBadge.className = "stock-badge";

      const productBody = card.querySelector(".product-body");

      if (productBody) {
        productBody.appendChild(stockBadge);
      }
    }

    stockBadge.className = `stock-badge ${status.className}`;

    if (quantity <= 0) {
      stockBadge.textContent = "Produto esgotado";
    } else {
      stockBadge.textContent = `${status.text} • ${quantity} em estoque`;
    }

    const buyButton = card.querySelector(".buy-button");

    if (buyButton) {
      if (quantity <= 0) {
        buyButton.disabled = true;
        buyButton.textContent = "Esgotado";
        buyButton.classList.add("disabled-button");
      } else {
        buyButton.disabled = false;
        buyButton.classList.remove("disabled-button");

        if (buyButton.textContent.trim() === "Esgotado") {
          buyButton.textContent = buyButton.dataset.originalText || "Comprar";
        }
      }
    }
  });
}

function renderStockTable() {
  const tableBody = document.querySelector("#stock-table-body");

  if (!tableBody) return;

  if (!isAdmin()) {
    tableBody.innerHTML = "";
    return;
  }

  const stockList = getStockList();

  tableBody.innerHTML = "";

  stockList.forEach((product) => {
    const status = getStockStatus(product.quantity);
    const inputId = `stock-${product.name.replaceAll(" ", "-")}`;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td><strong>${product.name}</strong></td>

      <td>${product.category}</td>

      <td>
        <input
          type="number"
          min="0"
          value="${product.quantity}"
          id="${inputId}"
        />
      </td>

      <td>
        <span class="stock-status ${status.className}">
          ${status.text}
        </span>
      </td>

      <td>
        <button
          type="button"
          class="save-stock-button"
          onclick="saveStockFromInput('${product.name}')"
        >
          Salvar
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

function saveStockFromInput(productName) {
  if (!isAdmin()) {
    alert("Acesso negado. Apenas administradores podem alterar o estoque.");
    return;
  }

  const inputId = `stock-${productName.replaceAll(" ", "-")}`;
  const input = document.getElementById(inputId);

  if (!input) return;

  const newQuantity = Number(input.value);

  if (newQuantity < 0) {
    alert("O estoque não pode ser negativo.");
    return;
  }

  updateProductStock(productName, newQuantity);

  addAdminLog("ESTOQUE_ATUALIZADO", `Estoque atualizado para ${productName}.`, {
    produto: productName,
    quantidade: newQuantity
  });

  alert("Estoque atualizado com sucesso!");
}

/* ===============================
   CARRINHO
================================ */

let cart = JSON.parse(localStorage.getItem("pedrinhoCart")) || [];

const cartSidebar = document.querySelector("#cart-sidebar");
const cartOverlay = document.querySelector("#cart-overlay");
const cartItems = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");

function formatMoney(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function saveCart() {
  localStorage.setItem("pedrinhoCart", JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

function getCartQuantity() {
  return cart.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
}

function getCartProductQuantity(productName) {
  const product = cart.find((item) => item.name === productName);

  return product ? product.quantity : 0;
}

function addToCart(name, price, image) {
  const stockQuantity = getProductStock(name);
  const cartQuantity = getCartProductQuantity(name);

  if (stockQuantity <= 0) {
    alert("Produto esgotado.");
    return;
  }

  if (cartQuantity >= stockQuantity) {
    alert("Você já adicionou a quantidade máxima disponível desse produto.");
    return;
  }

  const existingProduct = cart.find((item) => item.name === name);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      name,
      price,
      image,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
}

function increaseQuantity(index) {
  const item = cart[index];
  const stockQuantity = getProductStock(item.name);

  if (item.quantity >= stockQuantity) {
    alert("Quantidade máxima disponível em estoque.");
    return;
  }

  cart[index].quantity += 1;

  saveCart();
  renderCart();
}

function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    cart.splice(index, 1);
  }

  saveCart();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);

  saveCart();
  renderCart();
}

function clearCart() {
  if (!cart.length) return;

  const confirmClear = confirm("Deseja limpar o carrinho?");

  if (!confirmClear) return;

  cart = [];

  saveCart();
  renderCart();
}

function renderCart() {
  if (!cartItems || !cartCount || !cartTotal) return;

  cartItems.innerHTML = "";

  if (!cart.length) {
    cartItems.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
  }

  cart.forEach((item, index) => {
    const stockQuantity = getProductStock(item.name);

    const article = document.createElement("article");
    article.className = "cart-item";

    article.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />

      <div class="cart-item-content">
        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <span>${formatMoney(item.price)}</span>
          <small class="cart-stock-info">
            Estoque disponível: ${stockQuantity}
          </small>
        </div>

        <div class="cart-item-actions">
          <button type="button" onclick="decreaseQuantity(${index})">−</button>
          <span>${item.quantity}</span>
          <button type="button" onclick="increaseQuantity(${index})">+</button>
        </div>

        <button type="button" class="remove-item" onclick="removeFromCart(${index})">
          Remover
        </button>
      </div>
    `;

    cartItems.appendChild(article);
  });

  cartCount.textContent = getCartQuantity();
  cartTotal.textContent = formatMoney(getCartTotal());
}

function openCart() {
  if (!cartSidebar || !cartOverlay) return;

  cartSidebar.classList.add("active");
  cartOverlay.classList.add("active");
}

function closeCart() {
  if (!cartSidebar || !cartOverlay) return;

  cartSidebar.classList.remove("active");
  cartOverlay.classList.remove("active");
}

function finishOrder() {
  if (!cart.length) {
    alert("Seu carrinho está vazio.");
    return;
  }

  const hasUnavailableProduct = cart.some((item) => {
    const stockQuantity = getProductStock(item.name);
    return item.quantity > stockQuantity;
  });

  if (hasUnavailableProduct) {
    alert("Algum produto do carrinho não possui estoque suficiente.");
    return;
  }

  const loggedUser = getLoggedUser();

  const items = cart
    .map((item) => {
      return `${item.quantity}x ${item.name} - ${formatMoney(item.price * item.quantity)}`;
    })
    .join("\n");

  const total = getCartTotal();
  const totalFormatted = formatMoney(total);

  const customerText = loggedUser
    ? `Cliente: ${loggedUser.name}\nE-mail: ${loggedUser.email}\nPerfil: ${loggedUser.role === "admin" ? "Administrador" : "Usuário"}\n\n`
    : "";

  const message =
    `Olá! Gostaria de finalizar meu pedido na Pedrinho Farmácias:\n\n` +
    customerText +
    `${items}\n\n` +
    `Total: ${totalFormatted}`;

  registerAdminSale({
    customer: loggedUser
      ? {
          name: loggedUser.name,
          email: loggedUser.email,
          role: loggedUser.role || "user"
        }
      : {
          name: "Cliente não identificado",
          email: "Não informado",
          role: "guest"
        },
    items: cart,
    total: total,
    grossTotal: total
  });

  cart.forEach((item) => {
    decreaseStock(item.name, item.quantity);
  });

  cart = [];
  saveCart();

  renderCart();
  renderProductStockBadges();
  renderAdminDashboard();

  const phone = "555596601385";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

/* ===============================
   BUSCA E FILTROS
================================ */

const productSearch = document.querySelector("#product-search");
const productCards = document.querySelectorAll(".product-card");
const filterButtons = document.querySelectorAll(".filter-btn");

let activeFilter = "all";

function filterProducts() {
  const searchTerm = productSearch ? productSearch.value.toLowerCase().trim() : "";

  productCards.forEach((card) => {
    const name = card.dataset.name.toLowerCase();
    const category = card.dataset.category;

    const matchesSearch = name.includes(searchTerm);
    const matchesFilter = activeFilter === "all" || category === activeFilter;

    card.style.display = matchesSearch && matchesFilter ? "block" : "none";
  });
}

if (productSearch) {
  productSearch.addEventListener("input", filterProducts);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    activeFilter = button.dataset.filter;

    filterProducts();
  });
});

/* ===============================
   NEWSLETTER / FORMS SIMPLES
================================ */

const forms = document.querySelectorAll("form:not(#login-form):not(#register-form)");

forms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.querySelector('input[type="text"]')?.value.trim();
    const email = form.querySelector('input[type="email"]')?.value.trim();

    if (!name || !email) {
      alert("Preencha seu nome e e-mail corretamente.");
      return;
    }

    alert("Cadastro realizado com sucesso!");

    form.reset();
  });
});

/* ===============================
   USUÁRIOS E PERMISSÕES
================================ */

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const userPanel = document.querySelector("#user-panel");
const userMessage = document.querySelector("#user-message");

function getUsers() {
  return JSON.parse(localStorage.getItem("pedrinhoUsers")) || [];
}

function saveUsers(users) {
  localStorage.setItem("pedrinhoUsers", JSON.stringify(users));
}

function getLoggedUser() {
  return JSON.parse(localStorage.getItem("pedrinhoLoggedUser"));
}

function setLoggedUser(user) {
  localStorage.setItem("pedrinhoLoggedUser", JSON.stringify(user));
}

function initDefaultAdmin() {
  const users = getUsers();

  const adminExists = users.some((user) => user.email === "admin@pedrinho.com");

  if (!adminExists) {
    users.push({
      name: "Administrador",
      email: "admin@pedrinho.com",
      password: "admin123",
      role: "admin"
    });

    saveUsers(users);
  }
}

function isAdmin() {
  const loggedUser = getLoggedUser();

  return loggedUser && loggedUser.role === "admin";
}

function applyUserVisualMode() {
  const loggedUser = getLoggedUser();

  document.body.classList.remove("admin-mode", "user-mode", "guest-mode");

  if (!loggedUser) {
    document.body.classList.add("guest-mode");
    return;
  }

  if (loggedUser.role === "admin") {
    document.body.classList.add("admin-mode");
  } else {
    document.body.classList.add("user-mode");
  }
}

function updateNavbarPermissions() {
  const loggedUser = getLoggedUser();

  const adminOnlyElements = document.querySelectorAll(".admin-only");
  const userOnlyElements = document.querySelectorAll(".user-only");
  const guestOnlyElements = document.querySelectorAll(".guest-only");
  const userNameElements = document.querySelectorAll(".user-name");

  adminOnlyElements.forEach((element) => {
    if (loggedUser && loggedUser.role === "admin") {
      element.classList.remove("hidden");
    } else {
      element.classList.add("hidden");
    }
  });

  userOnlyElements.forEach((element) => {
    if (loggedUser) {
      element.classList.remove("hidden");
    } else {
      element.classList.add("hidden");
    }
  });

  guestOnlyElements.forEach((element) => {
    if (loggedUser) {
      element.classList.add("hidden");
    } else {
      element.classList.remove("hidden");
    }
  });

  userNameElements.forEach((element) => {
    if (!loggedUser) {
      element.textContent = "";
      return;
    }

    element.textContent =
      loggedUser.role === "admin"
        ? `Admin: ${loggedUser.name}`
        : `Olá, ${loggedUser.name}`;
  });

  applyUserVisualMode();
}

function protectAdminPages() {
  const currentPage = window.location.pathname.toLowerCase();

  const isAdminPage =
    currentPage.includes("estoque.html") ||
    currentPage.includes("admin.html");

  if (isAdminPage && !isAdmin()) {
    alert("Acesso negado. Apenas administradores podem acessar essa área.");
    window.location.href = "login.html";
  }
}

function updateLoginTabs(activeTab) {
  const tabButtons = document.querySelectorAll(".tab-button");

  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  if (activeTab === "login" && tabButtons[0]) {
    tabButtons[0].classList.add("active");
  }

  if (activeTab === "register" && tabButtons[1]) {
    tabButtons[1].classList.add("active");
  }
}

function showRegister() {
  if (!loginForm || !registerForm || !userPanel) return;

  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  userPanel.classList.add("hidden");

  updateLoginTabs("register");
}

function showLogin() {
  if (!loginForm || !registerForm || !userPanel) return;

  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  userPanel.classList.add("hidden");

  updateLoginTabs("login");
}

function showUserPanel(user) {
  if (!loginForm || !registerForm || !userPanel || !userMessage) return;

  loginForm.classList.add("hidden");
  registerForm.classList.add("hidden");
  userPanel.classList.remove("hidden");

  const roleText = user.role === "admin" ? "Administrador" : "Usuário";

  userMessage.textContent =
    `Bem-vindo(a), ${user.name}. Você está logado como ${roleText}. E-mail: ${user.email}.`;

  updateNavbarPermissions();
}

function logoutUser() {
  localStorage.removeItem("pedrinhoLoggedUser");

  alert("Você saiu da conta.");

  updateNavbarPermissions();

  const currentPage = window.location.pathname.toLowerCase();

  if (
    currentPage.includes("estoque.html") ||
    currentPage.includes("admin.html")
  ) {
    window.location.href = "login.html";
    return;
  }

  if (loginForm && registerForm && userPanel) {
    showLogin();
  }
}

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.querySelector("#register-name").value.trim();
    const email = document.querySelector("#register-email").value.trim().toLowerCase();
    const password = document.querySelector("#register-password").value.trim();

    if (!name || !email || !password) {
      alert("Preencha todos os campos.");
      return;
    }

    if (password.length < 4) {
      alert("A senha precisa ter pelo menos 4 caracteres.");
      return;
    }

    const users = getUsers();

    const userExists = users.some((user) => user.email === email);

    if (userExists) {
      alert("Este e-mail já está cadastrado.");
      return;
    }

    const newUser = {
      name,
      email,
      password,
      role: "user"
    };

    users.push(newUser);
    saveUsers(users);

    setLoggedUser({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

    addAdminLog("USUARIO_CRIADO", `Novo usuário cadastrado: ${newUser.email}`, {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

    alert("Conta criada com sucesso!");

    registerForm.reset();

    showUserPanel(newUser);
    updateNavbarPermissions();
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.querySelector("#login-email").value.trim().toLowerCase();
    const password = document.querySelector("#login-password").value.trim();

    const users = getUsers();

    const user = users.find((item) => {
      return item.email === email && item.password === password;
    });

    if (!user) {
      alert("E-mail ou senha incorretos.");
      return;
    }

    const loggedUser = {
      name: user.name,
      email: user.email,
      role: user.role || "user"
    };

    setLoggedUser(loggedUser);

    addAdminLog("LOGIN_REALIZADO", `Login realizado: ${loggedUser.email}`, {
      name: loggedUser.name,
      email: loggedUser.email,
      role: loggedUser.role
    });

    alert("Login realizado com sucesso!");

    loginForm.reset();

    showUserPanel(loggedUser);
    updateNavbarPermissions();

    if (loggedUser.role === "admin") {
      window.location.href = "admin.html";
    }
  });
}

/* ===============================
   PAINEL ADMINISTRATIVO
================================ */

function getAdminSales() {
  return JSON.parse(localStorage.getItem("pedrinhoAdminSales")) || [];
}

function saveAdminSales(sales) {
  localStorage.setItem("pedrinhoAdminSales", JSON.stringify(sales));
}

function getAdminInvoices() {
  return JSON.parse(localStorage.getItem("pedrinhoAdminInvoices")) || [];
}

function saveAdminInvoices(invoices) {
  localStorage.setItem("pedrinhoAdminInvoices", JSON.stringify(invoices));
}

function getAdminLogs() {
  return JSON.parse(localStorage.getItem("pedrinhoAdminLogs")) || [];
}

function saveAdminLogs(logs) {
  localStorage.setItem("pedrinhoAdminLogs", JSON.stringify(logs));
}

function generateInvoiceNumber() {
  const invoices = getAdminInvoices();
  const nextNumber = invoices.length + 1;

  return String(nextNumber).padStart(4, "0");
}

function addAdminLog(type, message, payload = null) {
  const logs = getAdminLogs();

  logs.unshift({
    id: Date.now(),
    type,
    message,
    payload,
    date: new Date().toLocaleString("pt-BR")
  });

  saveAdminLogs(logs);
}

function registerAdminSale(orderData) {
  const sales = getAdminSales();
  const invoices = getAdminInvoices();

  const invoiceNumber = generateInvoiceNumber();

  const cleanItems = orderData.items.map((item) => {
    return {
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    };
  });

  const sale = {
    id: Date.now(),
    invoiceNumber,
    customer: orderData.customer,
    items: cleanItems,
    total: orderData.total,
    grossTotal: orderData.grossTotal,
    date: new Date().toLocaleString("pt-BR")
  };

  const invoice = {
    number: invoiceNumber,
    customer: orderData.customer,
    items: cleanItems,
    total: orderData.total,
    grossTotal: orderData.grossTotal,
    date: sale.date
  };

  sales.push(sale);
  invoices.push(invoice);

  saveAdminSales(sales);
  saveAdminInvoices(invoices);

  addAdminLog("VENDA_FINALIZADA", `Venda finalizada com NF ${invoiceNumber}`, sale);
}

function getProductSalesRanking() {
  const sales = getAdminSales();
  const ranking = {};

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!ranking[item.name]) {
        ranking[item.name] = {
          name: item.name,
          quantity: 0,
          total: 0
        };
      }

      ranking[item.name].quantity += item.quantity;
      ranking[item.name].total += item.subtotal;
    });
  });

  return Object.values(ranking).sort((a, b) => b.quantity - a.quantity);
}

function renderAdminDashboard() {
  const totalSalesElement = document.querySelector("#admin-total-sales");
  const grossSalesElement = document.querySelector("#admin-gross-sales");
  const topProductElement = document.querySelector("#admin-top-product");
  const topProductQtyElement = document.querySelector("#admin-top-product-qty");
  const invoiceCountElement = document.querySelector("#admin-invoice-count");
  const chartElement = document.querySelector("#admin-products-chart");
  const invoicesTable = document.querySelector("#admin-invoices-table");
  const rawLogsElement = document.querySelector("#admin-raw-logs");

  if (
    !totalSalesElement &&
    !grossSalesElement &&
    !topProductElement &&
    !chartElement &&
    !invoicesTable &&
    !rawLogsElement
  ) {
    return;
  }

  if (!isAdmin()) return;

  const sales = getAdminSales();
  const invoices = getAdminInvoices();
  const logs = getAdminLogs();
  const ranking = getProductSalesRanking();

  const totalSales = sales.reduce((total, sale) => {
    return total + Number(sale.total || 0);
  }, 0);

  const grossSales = sales.reduce((total, sale) => {
    return total + Number(sale.grossTotal || 0);
  }, 0);

  if (totalSalesElement) {
    totalSalesElement.textContent = formatMoney(totalSales);
  }

  if (grossSalesElement) {
    grossSalesElement.textContent = formatMoney(grossSales);
  }

  if (topProductElement) {
    topProductElement.textContent = ranking[0] ? ranking[0].name : "Nenhum";
  }

  if (topProductQtyElement) {
    topProductQtyElement.textContent = ranking[0]
      ? `${ranking[0].quantity} unidades vendidas.`
      : "0 unidades vendidas.";
  }

  if (invoiceCountElement) {
    invoiceCountElement.textContent = invoices.length;
  }

  if (chartElement) {
    chartElement.innerHTML = "";

    if (!ranking.length) {
      chartElement.innerHTML = `<p class="admin-empty">Nenhuma venda registrada ainda.</p>`;
    } else {
      const maxQuantity = ranking[0].quantity;

      ranking.forEach((product, index) => {
        const percentage = maxQuantity > 0
          ? Math.round((product.quantity / maxQuantity) * 100)
          : 0;

        const bar = document.createElement("div");
        bar.className = "admin-chart-row";

        bar.innerHTML = `
          <div class="admin-chart-info">
            <strong>${index + 1}. ${product.name}</strong>
            <span>${product.quantity} unidades • ${formatMoney(product.total)}</span>
          </div>

          <div class="admin-chart-bar">
            <div style="width: ${percentage}%"></div>
          </div>
        `;

        chartElement.appendChild(bar);
      });
    }
  }

  if (invoicesTable) {
    invoicesTable.innerHTML = "";

    if (!invoices.length) {
      invoicesTable.innerHTML = `
        <tr>
          <td colspan="5">Nenhuma nota fiscal emitida.</td>
        </tr>
      `;
    } else {
      invoices
        .slice()
        .reverse()
        .forEach((invoice) => {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td><strong>${invoice.number}</strong></td>
            <td>${invoice.customer.name}</td>
            <td>${invoice.date}</td>
            <td>${formatMoney(invoice.total)}</td>
            <td>${invoice.items.length} item(ns)</td>
          `;

          invoicesTable.appendChild(row);
        });
    }
  }

  if (rawLogsElement) {
    if (!logs.length) {
      rawLogsElement.textContent = "Nenhum log registrado.";
    } else {
      rawLogsElement.textContent = JSON.stringify(logs, null, 2);
    }
  }
}

function copyAdminLogs() {
  const logs = getAdminLogs();

  if (!logs.length) {
    alert("Não existem logs para copiar.");
    return;
  }

  const text = JSON.stringify(logs, null, 2);

  navigator.clipboard.writeText(text)
    .then(() => {
      alert("Logs copiados com sucesso!");
    })
    .catch(() => {
      alert("Não foi possível copiar os logs.");
    });
}

function resetAdminData() {
  if (!isAdmin()) {
    alert("Apenas administradores podem limpar os dados.");
    return;
  }

  const confirmReset = confirm(
    "Deseja apagar vendas, notas fiscais e logs? Essa ação não pode ser desfeita."
  );

  if (!confirmReset) return;

  localStorage.removeItem("pedrinhoAdminSales");
  localStorage.removeItem("pedrinhoAdminInvoices");
  localStorage.removeItem("pedrinhoAdminLogs");

  alert("Dados administrativos apagados com sucesso.");

  renderAdminDashboard();
}

/* ===============================
   INICIALIZAÇÃO
================================ */

initDefaultAdmin();
getStockList();

const loggedUser = getLoggedUser();

if (loggedUser && userPanel) {
  showUserPanel(loggedUser);
}

updateNavbarPermissions();
protectAdminPages();

document.querySelectorAll(".buy-button").forEach((button) => {
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent.trim();
  }
});

renderCart();
renderProductStockBadges();
renderStockTable();
renderAdminDashboard();