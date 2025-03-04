// Initialize cart array in localStorage if it doesn't exist
if (!localStorage.getItem("cartItems")) {
  localStorage.setItem("cartItems", JSON.stringify([]));
}

// Function to add items to cart
function addToCart(productId, name, price, imageUrl) {
  let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  const cleanPrice = parseFloat(price.toString().replace(/,/g, ""));

  const existingItem = cartItems.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({
      id: productId,
      name: name,
      price: cleanPrice,
      image_url: imageUrl,
      quantity: 1,
    });
  }

  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  updateCartCount();
  showNotification("Item added to cart!");
}

// Function to update cart count in header
function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const totalItems = cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
    cartCount.textContent = totalItems;
  }
}

// Function to show notification
function showNotification(message) {
  const existingNotification = document.querySelector(".cart-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = "cart-notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(20px)";
  }, 100);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(0)";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Function to update cart display
function updateCartDisplay() {
  const cartContainer = document.querySelector(".cart-items");
  const total = document.getElementById("total");
  if (!cartContainer) return;

  const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  let cartTotal = 0;

  if (cartItems.length === 0) {
    cartContainer.innerHTML =
      '<div class="empty-cart">Your cart is empty</div>';
    if (total) total.textContent = "₹0.00";
    document.querySelector(".cart-summary").style.display = "none";
    return;
  }

  cartContainer.innerHTML = "";
  document.querySelector(".cart-summary").style.display = "block";

  cartItems.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    cartTotal += itemTotal;

    const itemElement = document.createElement("div");
    itemElement.className = "cart-item";
    itemElement.innerHTML = `
      <img src="${item.image_url}" alt="${item.name}" class="item-image">
      <div class="item-info">
        <h3>${item.name}</h3>
        <div class="price">₹${item.price.toFixed(2)}</div>
        <div class="quantity">
          <button onclick="updateQuantity(${index}, -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateQuantity(${index}, 1)">+</button>
        </div>
        <button onclick="removeItem(${index})" class="remove">Remove</button>
      </div>
    `;
    cartContainer.appendChild(itemElement);
  });

  if (total) total.textContent = "₹" + cartTotal.toFixed(2);
}

// Function to update quantity
function updateQuantity(index, change) {
  const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  const newQuantity = cartItems[index].quantity + change;

  if (newQuantity < 1) {
    removeItem(index);
    return;
  }

  cartItems[index].quantity = newQuantity;
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  updateCartCount();
  updateCartDisplay();
  showNotification("Cart updated!");
}

// Function to remove item
function removeItem(index) {
  const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  cartItems.splice(index, 1);
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  updateCartCount();
  updateCartDisplay();
  showNotification("Item removed from cart!");
}

// Function to clear cart
function clearCart() {
  localStorage.setItem("cartItems", JSON.stringify([]));
  updateCartCount();
  updateCartDisplay();
  showNotification("Cart cleared!");
}

// Initialize cart display and event listeners
document.addEventListener("DOMContentLoaded", function () {
  updateCartDisplay();
  updateCartCount();
});

// Checkout functionality
function submitCheckoutForm(event) {
  event.preventDefault();

  const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  if (cartItems.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const form = event.target;
  const formData = new FormData(form);

  const data = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    cart_items: cartItems,
    cart_total: cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    ),
  };

  // Get CSRF token
  const csrftoken = document.querySelector("[name=csrfmiddlewaretoken]").value;

  // Send order to backend
  fetch("/checkout/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        localStorage.removeItem("cartItems");
        window.location.href = data.redirect_url;
      } else {
        alert("Error processing order: " + data.error);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error processing order. Please try again.");
    });
}

// Function to render checkout items
function renderCheckoutItems() {
  const checkoutItems = document.getElementById("checkout-items");
  const total = document.getElementById("total");

  if (!checkoutItems) return;

  const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  let cartTotal = 0;

  if (cartItems.length === 0) {
    window.location.href = "/cart/";
    return;
  }

  checkoutItems.innerHTML = "";

  cartItems.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    cartTotal += itemTotal;

    const itemElement = document.createElement("div");
    itemElement.className = "checkout-item";
    itemElement.innerHTML = `
      <img src="${item.image_url}" alt="${item.name}" class="item-image">
      <div class="item-details">
        <h3>${item.name}</h3>
        <p class="item-quantity">Quantity: ${item.quantity}</p>
        <p class="item-price">₹${itemTotal.toFixed(2)}</p>
      </div>
    `;
    checkoutItems.appendChild(itemElement);
  });

  if (total) {
    total.textContent = "₹" + cartTotal.toFixed(2);
  }
}

// Add event listeners for cart page if it exists
document.addEventListener("DOMContentLoaded", function () {
  const cartContainer = document.querySelector(".cart-items");
  const checkoutItems = document.getElementById("checkout-items");

  if (cartContainer) {
    updateCartDisplay();
  } else if (checkoutItems) {
    renderCheckoutItems();
  }

  updateCartCount();
});
