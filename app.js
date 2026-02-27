// === China Bite - app.js ===

let cart = {};
let allProducts = [];
const RUPEE = "\u20B9";
let isOutletOpen = true;

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

const HIDE_CATEGORY_CARDS = new Set(["BOGO", "Meal for 1", "Combo"]);

// ==============================
// Google Sheet Orders Web App URL
// ==============================
const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwAc0qCDLzlSI7sdSlDlc79eX6hrwzDlXhbkZeMO2k2KMgUa_BxCwK56ICvjapjAm6Ifg/exec";

/* ---------- View helpers (NEW) ---------- */
function showCategoriesView() {
  const categorySection = document.getElementById("category-section");
  const productsView = document.getElementById("products-view");
  const menuSection = document.getElementById("menu-section");
  if (categorySection) categorySection.classList.remove("hidden", "is-hidden");
  if (productsView) productsView.classList.add("hidden", "is-hidden");
  if (menuSection) menuSection.classList.add("hidden", "is-hidden");
  const list = document.getElementById("product-list");
  if (list) list.innerHTML = "";
  document.getElementById("home-floating-btn").classList.add("hidden", "is-hidden");
}

function showProductsView() {
  const categorySection = document.getElementById("category-section");
  const productsView = document.getElementById("products-view");
  const menuSection = document.getElementById("menu-section");
  if (categorySection) categorySection.classList.add("hidden", "is-hidden");
  if (productsView) productsView.classList.remove("hidden", "is-hidden");
  if (menuSection) menuSection.classList.remove("hidden", "is-hidden");
  document.getElementById("home-floating-btn").classList.remove("hidden", "is-hidden");
}

function checkOutletStatus() {
  const now = new Date();
  const hours = now.getHours();
  isOutletOpen = hours >= 11 && hours < 23;

  document.body.classList.toggle("closed-state", !isOutletOpen);

  let statusEl = document.getElementById("outlet-status-message");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "outlet-status-message";
    statusEl.className = "outlet-status-message";
    const hero = document.querySelector(".hero");
    if (hero && hero.parentNode) {
      hero.insertAdjacentElement("afterend", statusEl);
    }
  }

  if (statusEl) {
    statusEl.textContent = "We are currently closed. Open daily 11 AM - 11 PM";
    statusEl.hidden = isOutletOpen;
  }

  document.querySelectorAll("button.btn-add").forEach((button) => {
    if (!button.classList.contains("is-disabled")) {
      button.disabled = !isOutletOpen;
    }
  });

  const checkoutBtn = document.getElementById("whatsapp-order");
  if (checkoutBtn) {
    checkoutBtn.classList.toggle("checkout-disabled", !isOutletOpen);
    checkoutBtn.setAttribute("aria-disabled", String(!isOutletOpen));
    if (!isOutletOpen) {
      checkoutBtn.removeAttribute("href");
    }
  }
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
document.addEventListener("DOMContentLoaded", checkOutletStatus);

window.onload = () => {
  setTimeout(() => {
    const intro = document.getElementById('intro-screen');
    if (intro) intro.classList.add('hidden');
  }, 3000);

  displayCategories();

  const savedCart = localStorage.getItem('chinaCart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }

  setupCartButtons();
  updateCart();

  // Default first screen is Home flow.
  showCategoriesView();

  // Keep Home state as default.
  if (!history.state || history.state.view !== "categories") {
    history.replaceState({ view: "categories" }, "", location.pathname);
  }

  // Only open products from a valid deep-link hash.
  const hashCat = decodeURIComponent(location.hash.replace("#", "")).trim();
  const validCategoryNames = new Set(categories.map(c => c.name));
  const isHomeHash = !hashCat || hashCat.toLowerCase() === "categories";

  if (!isHomeHash && validCategoryNames.has(hashCat)) {
    showProductsView();
    renderForCategory(hashCat);
    history.replaceState({ view: "products", cat: hashCat }, "", location.pathname);
  }

  checkOutletStatus();
};

document.getElementById("home-floating-btn").onclick = () => {
  showCategoriesView();
  history.replaceState({ view: "categories" }, "", location.pathname);
};

/* ---------- Categories ---------- */
function displayCategories() {
  const section = document.getElementById("category-section");
  section.innerHTML = ""; // prevent duplicate rendering

  categories.forEach(cat => {

      // 🔴 Hide specific category cards
    if (HIDE_CATEGORY_CARDS.has(cat.name)) return;

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
  history.pushState({ view: "products", cat: categoryName }, "", location.pathname);
  showProductsView();
  renderForCategory(categoryName);
  const menuSection = document.getElementById("menu-section");
  if (menuSection) {
    menuSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ---------- Product rendering (unchanged) ---------- */
function renderProducts() {
  const list = getCategoryProductList();
  list.innerHTML = "";
  allProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
  <div class="product-details">
    <h3>${product.name}</h3>
    <p>${product.description}</p>
    <p>&#8377;${product.price}</p>
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
      <button onclick="changeQty('${product.name}', -1)">-</button>
      <span>${cart[product.name]?.qty || 0}</span>
      <button onclick="changeQty('${product.name}', 1)">+</button>
    </div>
  </div>
`;
    list.appendChild(card);
  });
}

function getCategoryProductList() {
  const productsView = document.getElementById("products-view");
  if (!productsView) return document.getElementById("product-list");

  let list = productsView.querySelector(".product-list");
  if (!list) {
    const menuSection = productsView.querySelector("#menu-section") || productsView;
    list = document.createElement("div");
    list.id = "product-list";
    list.className = "product-list";
    menuSection.appendChild(list);
  }

  return list;
}

function changeQty(name, delta) {
  const item = allProducts.find(p => p.name === name) || Object.values(cart).find(p => p.name === name);
  if (!item) return;

  if (!cart[name]) cart[name] = { ...item, qty: 0 };
  cart[name].qty += delta;
  if (cart[name].qty <= 0) delete cart[name];

  updateCart();
  localStorage.setItem("chinaCart", JSON.stringify(cart));

  // Only re-render if we're on product listing view
  if (!document.getElementById("menu-section").classList.contains("hidden")) {
    renderProducts();
  }
}

function updateCart() {
  const itemsDiv = document.getElementById("cart-items");
  const subtotalSpan = document.getElementById("cart-subtotal");
  const discountSpan = document.getElementById("cart-discount");
  const deliverySpan = document.getElementById("cart-delivery");
  const totalSpan = document.getElementById("cart-total");
  const cartBar = document.getElementById("view-cart-bar");
  const cartText = document.getElementById("cart-bar-text");
  const desktopCount = document.getElementById("cart-count-desktop");
  const itemCountText = document.getElementById("cart-count-text");
  const deliveryRow = document.querySelector(".cart-delivery");

  if (!hasNonOfferItemsInCart(cart) && hasTodaysOfferItemsInCart(cart)) {
    if (removeAllTodaysOfferItemsFromCart()) {
      localStorage.setItem("chinaCart", JSON.stringify(cart));
      showToast("Today Offer removed — add any item to unlock Today Offer.");
    }
  }

  let count = 0;
  itemsDiv.innerHTML = "";

  for (let key in cart) {
    const item = cart[key];
    count += item.qty;
    const isTodayOfferInCart = isTodaysOfferItem(item.specialId || item.specialType || item.name);
    const disablePlus = isTodayOfferInCart && item.qty >= 1;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.setAttribute("data-key", item.name);
    div.innerHTML = `
  <div class="cart-item-text">${item.name}</div>
  <div>&#8377;${item.qty * item.price}</div>
  <div>
    <button class="qty-minus" type="button" data-key="${item.name}">-</button>
    <span class="qty-num">${item.qty}</span>
    <button class="qty-plus" type="button" data-key="${item.name}" ${disablePlus ? "disabled" : ""}>+</button>
  </div>
  <button class="remove-btn remove-item" type="button" data-key="${item.name}">X</button>
`;
    itemsDiv.appendChild(div);
  }

  const totals = calculateCartTotals();
  if (subtotalSpan) subtotalSpan.textContent = formatMoney(totals.subtotalAll);
  if (discountSpan) discountSpan.textContent = formatMoney(totals.discount);
  if (deliverySpan) deliverySpan.textContent = formatMoney(totals.delivery);
  cartText.textContent = `${count} item${count !== 1 ? 's' : ''} added`;
  desktopCount.textContent = count;
  itemCountText.textContent = count;
  if (deliveryRow) deliveryRow.classList.toggle("hidden", count === 0);
  totalSpan.textContent = count === 0 ? "0" : formatMoney(totals.total);
  cartBar.classList.toggle("active", count > 0);
  syncSpecialButtonsFromCart();
  updateTodaysOfferUIState();
  checkOutletStatus();
}

function increaseCartItem(itemName) {
  const item = cart[itemName];
  if (!item) return;
  const isTodayOfferInCart = isTodaysOfferItem(item.specialId || item.specialType || item.name);
  if (isTodayOfferInCart && item.qty >= 1) return;
  changeQty(itemName, 1);
}

function decreaseCartItem(itemName) {
  changeQty(itemName, -1);
}

function removeCartItem(itemName) {
  const item = cart[itemName];
  if (!item) return;
  changeQty(itemName, -item.qty);
}

function setupCartItemDelegation() {
  const container = document.getElementById("cart-items");
  if (!container || container.dataset.boundClick === "1") return;

  container.dataset.boundClick = "1";
  container.addEventListener("click", (e) => {
    const plusBtn = e.target.closest(".qty-plus");
    if (plusBtn) {
      const key = plusBtn.dataset.key || plusBtn.closest("[data-key]")?.dataset.key;
      if (key) increaseCartItem(key);
      return;
    }

    const minusBtn = e.target.closest(".qty-minus");
    if (minusBtn) {
      const key = minusBtn.dataset.key || minusBtn.closest("[data-key]")?.dataset.key;
      if (key) decreaseCartItem(key);
      return;
    }

    const removeBtn = e.target.closest(".remove-item");
    if (removeBtn) {
      const key = removeBtn.dataset.key || removeBtn.closest("[data-key]")?.dataset.key;
      if (key) removeCartItem(key);
    }
  });
}

function setupCartButtons() {
  setupCartItemDelegation();
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

  document.getElementById("back-to-categories").onclick = () => {
  showCategoriesView();  // your existing function

  history.replaceState(
    { view: "categories" },
    "",
    location.pathname
  );
};

  document.getElementById("whatsapp-order").onclick = () => {
    if (!isOutletOpen) {
      alert("We are currently closed. Open daily 11 AM - 11 PM");
      return;
    }

    const name = document.getElementById("name-and-phone-number").value;
    const phone = document.getElementById("phone-number").value;
    const address = document.getElementById("table-number-or-address").value;
    if (!name || !phone || !address) {
      alert("Please fill in your name, phone number and address.");
      return;
    }
    let message = `Order from China Bite\n`;
    const totals = calculateCartTotals();
    for (let key in cart) {
      const item = cart[key];
      message += `\n${item.qty}x ${item.name} - ${RUPEE}${item.qty * item.price}`;
    }
    message += `\n\nSubtotal: ${RUPEE}${formatMoney(totals.subtotalAll)}`;
    message += `\nDiscount: -${RUPEE}${formatMoney(totals.discount)}`;
    message += `\nDelivery: ${RUPEE}${formatMoney(totals.delivery)}`;
    message += `\nGrand Total: ${RUPEE}${formatMoney(totals.total)}`;
    const payment = document.querySelector("input[name='payment-method']:checked")?.value || "Cash";
    message += `\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nPayment: ${payment}`;

    const instruction = document.getElementById("cooking-instructions").value;
    if (instruction) {
      message += `\n\nInstructions: ${instruction}`;
    }

    // ==============================
// Save order to Google Sheet (NO parsing WhatsApp text)
// ==============================

// Items summary (single line with |) - matches WhatsApp line total style
const itemsSummary = Object.values(cart)
  .map(item => `${item.qty}x ${item.name} - ${RUPEE}${formatMoney(item.qty * item.price)}`)
  .join(" | ");

// Total items count
const totalItems = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

// Send to sheet using your existing variables
sendOrderToGoogleSheet({
  name: name.trim(),
  phone: phone.trim(),
  addressRaw: address.trim(),
  instructions: (instruction || "").trim(),
  paymentMethod: payment,

  subtotal: totals.subtotalAll,
  discount: totals.discount,
  deliveryFee: totals.delivery,
  grandTotal: totals.total,

  totalItems,
  itemsSummary
});

    const encoded = encodeURIComponent(message);
    document.getElementById("whatsapp-order").href = `https://wa.me/918104193919?text=${encoded}`;

    setTimeout(() => {
      alert("Your order has been placed!");
      cart = {};
      localStorage.removeItem("chinaCart");
      updateCart();
      document.getElementById("cart-panel").classList.remove("active");
      document.getElementById("name-and-phone-number").value = "";
      document.getElementById("table-number-or-address").value = "";
      document.getElementById("phone-number").value = "";
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
  document.getElementById("modal-price").textContent = `${RUPEE}${item.price}`;
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
    // Return to that category's products (no extra push)
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

function formatMoney(value) {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function showToast(message) {
  const existing = document.querySelector(".toast-msg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast-msg";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 250);
  }, 1800);
}

function calculateCartTotals() {
  let subtotalAll = 0;
  let eligibleSubtotal = 0;

  for (const key in cart) {
    const item = cart[key];
    const lineTotal = item.qty * item.price;
    subtotalAll += lineTotal;
    if (!isTodaysOfferItem(item.specialId || item.specialType || item.name)) {
      eligibleSubtotal += lineTotal;
    }
  }

  const discount = eligibleSubtotal > 250 ? eligibleSubtotal * 0.20 : 0;
  const payableSubtotal = subtotalAll - discount;
  const delivery = payableSubtotal < 300 ? 50 : 0;
  const total = payableSubtotal + delivery;

  return { subtotalAll, eligibleSubtotal, discount, delivery, total };
}
// ==================================
// Today Offer + Combo cart sync
// ==================================

const specialMenuItems = {
  "offer-veg": { name: "Honey Chilly Potato (Today Offer)", price: 189, type: "today" },
  "offer-nv": { name: "Chicken Spring Roll (Today Offer)", price: 196, type: "today" },
  "combo-1": { name: "Meal for 1 (Combo)", price: 369, type: "combo" },
  "combo-2": { name: "Starter + Rice (Combo)", price: 449, type: "combo" },
  "combo-3": { name: "Noodles Combo (Combo)", price: 399, type: "combo" },
  "combo-4": { name: "Family Feast (Combo)", price: 699, type: "combo" },
  "combo-5": { name: "BOGO Deal (Combo)", price: 399, type: "combo" },
  "combo-veg-1": { name: "Veg Meal 1 (Combo)", price: 329, type: "combo" },
  "combo-veg-2": { name: "Veg Meal 2 (Combo)", price: 339, type: "combo" },
  "combo-veg-3": { name: "Veg Meal 3 (Combo)", price: 349, type: "combo" },
  "combo-veg-4": { name: "Veg Meal 4 (Combo)", price: 319, type: "combo" },
  "combo-nv-1": { name: "Non-Veg Meal 1 (Combo)", price: 379, type: "combo" },
  "combo-nv-2": { name: "Non-Veg Meal 2 (Combo)", price: 389, type: "combo" },
  "combo-nv-3": { name: "Non-Veg Meal 3 (Combo)", price: 379, type: "combo" },
  "combo-nv-4": { name: "Non-Veg Meal 4 (Combo)", price: 399, type: "combo" },
  "combo-family-1": { name: "Family Combo 1 (Combo)", price: 849, type: "combo" },
  "combo-family-2": { name: "Family Combo 2 (Combo)", price: 949, type: "combo" },
};

const specialQty = {}; // { id: qty }

function isTodaysOfferItem(itemIdOrType) {
  if (!itemIdOrType) return false;
  if (itemIdOrType === "today") return true;
  if (typeof itemIdOrType === "string" && itemIdOrType.startsWith("offer-")) return true;

  const entry = Object.entries(specialMenuItems).find(([, item]) => item.name === itemIdOrType);
  return entry ? entry[1].type === "today" : false;
}

function getSpecialIdByName(name) {
  const found = Object.entries(specialMenuItems).find(([, item]) => item.name === name);
  return found ? found[0] : null;
}

function getRegularItemQtyInCart() {
  let qty = 0;
  for (const key in cart) {
    const item = cart[key];
    const marker = item.specialId || item.specialType || getSpecialIdByName(item.name) || item.name;
    if (!isTodaysOfferItem(marker)) {
      qty += item.qty;
    }
  }
  return qty;
}

function hasNonOfferItemsInCart(cartObj) {
  for (const key in cartObj) {
    const item = cartObj[key];
    const marker = item.specialId || item.specialType || getSpecialIdByName(item.name) || item.name;
    if (!isTodaysOfferItem(marker)) return true;
  }
  return false;
}

function hasTodaysOfferItemsInCart(cartObj) {
  for (const key in cartObj) {
    const item = cartObj[key];
    const marker = item.specialId || item.specialType || getSpecialIdByName(item.name) || item.name;
    if (isTodaysOfferItem(marker)) return true;
  }
  return false;
}

function removeAllTodaysOfferItemsFromCart() {
  let removed = false;
  for (const key in cart) {
    const item = cart[key];
    const marker = item.specialId || item.specialType || getSpecialIdByName(item.name) || item.name;
    if (isTodaysOfferItem(marker)) {
      delete cart[key];
      removed = true;
    }
  }
  return removed;
}

function getTodaysOfferQtyInCart() {
  let qty = 0;
  for (const key in cart) {
    const item = cart[key];
    const marker = item.specialId || item.specialType || getSpecialIdByName(item.name) || item.name;
    if (isTodaysOfferItem(marker)) {
      qty += item.qty;
    }
  }
  return qty;
}

function getSelectedTodaysOfferId() {
  for (const key in cart) {
    const item = cart[key];
    const specialId = item.specialId || getSpecialIdByName(item.name);
    if (specialId && isTodaysOfferItem(specialId) && item.qty > 0) {
      return specialId;
    }
  }
  return null;
}

function ensureTodaysOfferMessageEls() {
  document.querySelectorAll(".offer-card").forEach((card) => {
    let msgEl = card.querySelector(".todays-offer-msg");
    if (!msgEl) {
      msgEl = document.createElement("p");
      msgEl.className = "todays-offer-msg";
      const bottom = card.querySelector(".offer-bottom");
      if (bottom) {
        bottom.insertAdjacentElement("afterend", msgEl);
      }
    }
  });
}

function renderSpecialBtn(btn, id) {
  const qty = specialQty[id] || 0;

  if (qty <= 0) {
    btn.innerHTML = "ADD";
    btn.classList.remove("is-qty");
    btn.removeAttribute("data-qty-mode");
    return;
  }

  btn.classList.add("is-qty");
  btn.setAttribute("data-qty-mode", "1");
  btn.innerHTML = `
    <span class="qminus" data-q="minus">-</span>
    <span class="qnum">${qty}</span>
    <span class="qplus" data-q="plus">+</span>
  `;
}

function renderAllSpecialButtons() {
  document.querySelectorAll("button.btn-add[data-id]").forEach((btn) => {
    renderSpecialBtn(btn, btn.dataset.id);
  });
}

function syncSpecialButtonsFromCart() {
  for (const id in specialMenuItems) {
    const itemName = specialMenuItems[id].name;
    specialQty[id] = cart[itemName]?.qty || 0;
  }
  renderAllSpecialButtons();
}

function updateTodaysOfferUIState() {
  ensureTodaysOfferMessageEls();

  const regularQty = getRegularItemQtyInCart();
  const todayQty = getTodaysOfferQtyInCart();
  const selectedTodayId = getSelectedTodaysOfferId();

  let message = "";
  if (regularQty < 1) {
    message = "Add any 1 regular item to unlock Today's Offer";
  } else if (todayQty < 1) {
    message = "Unlocked - You can add only 1 Today's Offer item";
  } else {
    message = "Today's Offer already added (1 per order)";
  }

  document.querySelectorAll(".todays-offer-msg").forEach((el) => {
    el.textContent = message;
  });

  document.querySelectorAll("button.btn-add[data-type='today'][data-id]").forEach((btn) => {
    const id = btn.dataset.id;
    const isSelected = id === selectedTodayId;
    const shouldDisable = regularQty < 1 || (todayQty >= 1 && !isSelected);

    btn.disabled = shouldDisable;
    btn.classList.toggle("is-disabled", shouldDisable);

    const plus = btn.querySelector(".qplus");
    if (plus) {
      const plusBlocked = todayQty >= 1;
      plus.classList.toggle("qplus-disabled", plusBlocked);
    }
  });
}

function addSpecialToCart(id) {
  const item = specialMenuItems[id];
  if (!item) return;

  if (item.type === "today") {
    if (!hasNonOfferItemsInCart(cart)) {
      showToast("Add any item to unlock Today Offer.");
      return;
    }
    if (getTodaysOfferQtyInCart() >= 1) return;
  }

  if (!cart[item.name]) {
    cart[item.name] = { name: item.name, price: item.price, qty: 0, specialId: id, specialType: item.type };
  }

  if (item.type === "today") {
    cart[item.name].qty = 1;
  } else {
    cart[item.name].qty += 1;
  }

  localStorage.setItem("chinaCart", JSON.stringify(cart));
  updateCart();
}

function removeSpecialFromCart(id) {
  const item = specialMenuItems[id];
  if (!item || !cart[item.name]) return;

  cart[item.name].qty -= 1;
  if (cart[item.name].qty <= 0) {
    delete cart[item.name];
  }

  localStorage.setItem("chinaCart", JSON.stringify(cart));
  updateCart();
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button.btn-add[data-id]");
  if (!btn) return;

  const id = btn.dataset.id;
  if (!specialMenuItems[id]) return;

  const qBtn = e.target.closest("[data-q]");
  if (qBtn) {
    const action = qBtn.dataset.q;

    if (action === "plus") {
      addSpecialToCart(id);
      return;
    }

    if (action === "minus") {
      removeSpecialFromCart(id);
      return;
    }

    return;
  }

  if (btn.disabled) return;
  addSpecialToCart(id);
});

/* ==============================
   Hero Slider Auto Play
============================== */
(function(){
  const slider = document.getElementById("heroSlider");
  if(!slider) return;

  const slides = slider.querySelectorAll(".slide");
  if(slides.length < 2) return;

  let index = 0;

  setInterval(() => {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }, 3500);
})();

// ==============================
// Send Order to Google Sheet
// ==============================
function sendOrderToGoogleSheet(payload) {
  fetch(SHEETS_WEBAPP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
