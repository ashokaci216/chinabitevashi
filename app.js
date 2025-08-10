// === China Bite - app.js ===

let cart = {};
let allProducts = [];

const categories = [
  { name: "BOGO", icon: "bogo.png" },
  { name: "Meal for 1", icon: "meal1.png" },
  { name: "Combo", icon: "combo.png" },
  { name: "Soup", icon: "soup.png" },
  { name: "Starter", icon: "starter.png" },
  { name: "Oriental Wings", icon: "wings.png" },
  { name: "Momo", icon: "rolls-momo.png" },
  { name: "Nuggets & More", icon: "nuggets.png" },
  { name: "Rice", icon: "rice.png" },
  { name: "Noodle", icon: "noodles.png" },
  { name: "Sizzler", icon: "sizzler.png" },
  { name: "Main Course", icon: "maincourse.png" },
];

/* ---------- View helpers (NEW) ---------- */
function showCategoriesView() {
  document.getElementById("menu-section").classList.add("hidden");
  document.getElementById("category-section").classList.remove("hidden");
  document.getElementById("home-floating-btn").classList.add("hidden");
}

function showProductsView() {
  document.getElementById("category-section").classList.add("hidden");
  document.getElementById("menu-section").classList.remove("hidden");
  document.getElementById("home-floating-btn").classList.remove("hidden");
}

// Render products for a given category WITHOUT pushing history (NEW)
function renderForCategory(categoryName) {
  document.getElementById("menu-heading").textContent = categoryName;
  fetch("menu.json")
    .then(res => res.json())
    .then(data => {
      allProducts = data.filter(item => item.category === categoryName);
      renderProducts();
    });
}

/* ---------- App init (MODIFIED) ---------- */
window.onload = () => {
  setTimeout(() => {
    const intro = document.getElementById('intro-screen');
    if (intro) intro.classList.add('hidden');
  }, 3000);

  displayCategories();

  const savedCart = localStorage.getItem('chinaCart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCart();
  }

  setupCartButtons();

  // Ensure we start on a "home" (categories) state
  if (!history.state) {
    history.replaceState({ view: "categories" }, "", location.pathname);
  }

  // Deep link support: if URL has #Category, open it
  const hashCat = decodeURIComponent(location.hash.replace("#", ""));
  if (hashCat) {
    openCategory(hashCat);
  } else {
    showCategoriesView();
  }
};

/* ---------- In-page home/back button (MODIFIED) ---------- */
document.getElementById("home-floating-btn").onclick = () => {
  // Use history so phone back and UI back behave the same
  history.back();
};

/* ---------- Categories ---------- */
function displayCategories() {
  const section = document.getElementById("category-section");
  categories.forEach(cat => {
    const div = document.createElement("div");
    div.className = "category-card";
    div.innerHTML = `
      <img src="images/${cat.icon}" class="category-icon" />
      <p class="category-label">${cat.name}</p>
    `;
    div.onclick = () => openCategory(cat.name);
    section.appendChild(div);
  });
}

/* ---------- Open Category (MODIFIED) ---------- */
function openCategory(categoryName) {
  // Push a history state so phone back button returns here
  history.pushState({ view: "products", cat: categoryName }, "", `#${encodeURIComponent(categoryName)}`);
  showProductsView();
  renderForCategory(categoryName);
}

/* ---------- Product rendering (unchanged) ---------- */
function renderProducts() {
  const list = document.getElementById("product-list");
  list.innerHTML = "";
  allProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
  <div class="product-details">
    <h3>${product.name}</h3>
    <p>${product.description}</p>
    <p>₹${product.price}</p>
  </div>
  <div>
    <img 
      src="images/${product.image}" 
      alt="${product.name}" 
      class="product-img"
      onclick="openPreview('${product.name}')"
      onerror="this.src='images/placeholder-china-bite.png'"
    >
    <div class="quantity-buttons">
      <button onclick="changeQty('${product.name}', -1)">➖</button>
      <span>${cart[product.name]?.qty || 0}</span>
      <button onclick="changeQty('${product.name}', 1)">➕</button>
    </div>
  </div>
`;
    list.appendChild(card);
  });
}

function changeQty(name, delta) {
  const item = allProducts.find(p => p.name === name) || Object.values(cart).find(p => p.name === name);
  if (!item) return;

  if (!cart[name]) cart[name] = { ...item, qty: 0 };
  cart[name].qty += delta;
  if (cart[name].qty <= 0) delete cart[name];

  updateCart();
  localStorage.setItem("chinaCart", JSON.stringify(cart));

  // ✅ Only re-render if we’re on product listing view
  if (!document.getElementById("menu-section").classList.contains("hidden")) {
    renderProducts();
  }
}

function updateCart() {
  const itemsDiv = document.getElementById("cart-items");
  const totalSpan = document.getElementById("cart-total");
  const cartBar = document.getElementById("view-cart-bar");
  const cartText = document.getElementById("cart-bar-text");
  const desktopCount = document.getElementById("cart-count-desktop");
  const itemCountText = document.getElementById("cart-count-text");

  let total = 0;
  let count = 0;
  itemsDiv.innerHTML = "";

  for (let key in cart) {
    const item = cart[key];
    total += item.qty * item.price;
    count += item.qty;
    const div = document.createElement("div");
    div.className = "border-b py-2 text-sm";
    div.className = "cart-item";
    div.innerHTML = `
  <div class="cart-item-text">
    <span>${item.name} x ${item.qty} = ₹${item.qty * item.price}</span>
  </div>
  <button class="remove-btn" onclick="changeQty('${item.name}', -1)">❌</button>
`;
    itemsDiv.appendChild(div);
  }

  totalSpan.textContent = total;
  cartText.textContent = `${count} item${count !== 1 ? 's' : ''} added`;
  desktopCount.textContent = count;
  itemCountText.textContent = count;
  cartBar.classList.toggle("active", count > 0);
}

function setupCartButtons() {
  document.getElementById("desktop-cart-btn").onclick = () => {
    document.getElementById("cart-panel").classList.add("active");
  };
  document.getElementById("view-cart-btn").onclick = () => {
    document.getElementById("cart-panel").classList.add("active");
  };
  document.getElementById("close-cart").onclick = () => {
    document.getElementById("cart-panel").classList.remove("active");
  };
  document.getElementById("clear-cart").onclick = () => {
    cart = {};
    localStorage.removeItem("chinaCart");
    updateCart();
    renderProducts();
  };

  // Back to categories (MODIFIED -> use history)
  document.getElementById("back-to-categories").onclick = () => {
    history.back(); // triggers popstate
  };

  document.getElementById("whatsapp-order").onclick = () => {
    const name = document.getElementById("name-and-phone-number").value;
    const address = document.getElementById("table-number-or-address").value;
    if (!name || !address) {
      alert("Please fill in your name and address.");
      return;
    }
    let message = `Order from China Bite\n`;
    let total = 0;
    for (let key in cart) {
      const item = cart[key];
      message += `\n${item.qty}x ${item.name} - ₹${item.qty * item.price}`;
      total += item.qty * item.price;
    }
    message += `\n\nTotal: ₹${total}`;
    message += `\n\nName: ${name}\nAddress: ${address}`;

    const instruction = document.getElementById("cooking-instructions").value;
    if (instruction) {
      message += `\n\nInstructions: ${instruction}`;
    }

    const encoded = encodeURIComponent(message);
    document.getElementById("whatsapp-order").href = `https://wa.me/918104193919?text=${encoded}`;

    setTimeout(() => {
      alert("✅ Your order has been placed!");
      cart = {};
      localStorage.removeItem("chinaCart");
      updateCart();
      document.getElementById("cart-panel").classList.remove("active");
      document.getElementById("name-and-phone-number").value = "";
      document.getElementById("table-number-or-address").value = "";
      renderProducts();
    }, 500);
  };
}

/* ---------- Preview modal (unchanged) ---------- */
function openPreview(name) {
  const item = allProducts.find(p => p.name === name);
  if (!item) return;
  document.getElementById("modal-image").src = `images/${item.image}`;
  document.getElementById("modal-name").textContent = item.name;
  document.getElementById("modal-description").textContent = item.description;
  document.getElementById("modal-price").textContent = `₹${item.price}`;
  document.getElementById("preview-modal").classList.remove("hidden");
  document.getElementById("modal-add-to-cart").onclick = () => {
    changeQty(name, 1);
    document.getElementById("preview-modal").classList.add("hidden");
  };
  document.getElementById("close-modal").onclick = () => {
    document.getElementById("preview-modal").classList.add("hidden");
  };
  document.getElementById("back-to-menu").onclick = (e) => {
    e.preventDefault();
    document.getElementById("preview-modal").classList.add("hidden");
  };
}

/* ---------- Phone back / Browser back handler (NEW) ---------- */
window.addEventListener("popstate", (event) => {
  const st = event.state;
  if (st && st.view === "products" && st.cat) {
    // Return to that category’s products (no extra push)
    showProductsView();
    renderForCategory(st.cat);
  } else {
    // Back to categories/home
    showCategoriesView();
    // Optional: clean the URL hash so a second back closes the tab/app
    if (location.hash) {
      history.replaceState({ view: "categories" }, "", location.pathname);
    }
  }
});
