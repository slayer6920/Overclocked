document.addEventListener("DOMContentLoaded", function () {
  // Display cart items in checkout
  const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
  const itemsContainer = document.querySelector(".checkout-items");
  const totalElement = document.getElementById("checkout-total");
  let total = 0;

  if (cartItems.length === 0) {
    window.location.href = "/cart/";
    return;
  }

  // Clear existing items
  itemsContainer.innerHTML = "";

  // Add each item to the checkout display
  cartItems.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const itemElement = document.createElement("div");
    itemElement.className = "checkout-item";
    itemElement.innerHTML = `
            <img src="${item.image_url}" alt="${item.name}" class="item-image">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>Quantity: ${item.quantity}</p>
                <p>Price: ₹${item.price.toFixed(2)}</p>
                <p>Total: ₹${itemTotal.toFixed(2)}</p>
            </div>
        `;
    itemsContainer.appendChild(itemElement);
  });

  // Update total display
  if (totalElement) {
    totalElement.textContent = total.toFixed(2);
  }

  // Handle form submission
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        pincode: formData.get("pincode"),
        cart_items: cartItems,
        cart_total: total,
      };

      // Get CSRF token
      const csrftoken = document.querySelector(
        "[name=csrfmiddlewaretoken]"
      ).value;

      // Disable submit button to prevent double submission
      const submitButton = checkoutForm.querySelector("button[type=submit]");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Processing...";
      }

      // Send order to backend
      fetch("/checkout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            // Store order details for confirmation page
            localStorage.setItem(
              "orderDetails",
              JSON.stringify({
                orderId: data.order_id,
                total: total,
              })
            );
            // Clear cart and redirect
            localStorage.removeItem("cartItems");
            window.location.href = data.redirect_url;
          } else {
            throw new Error(data.error || "Error processing order");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Error processing order: " + error.message);
          // Re-enable submit button on error
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Place Order";
          }
        });
    });
  }
});
