const user_id = localStorage.getItem("user_id")
const brands = [
  'dior',
  'chanel',
  'tomford',
  'creed',
  'byredo',
  'guerlain',
  'jomalone',
  'lelabo',
  'maisonmargiela',
  'yvessaintlaurent',
  'diptyque',
  "penhaligons"
];


const review_btn = document.getElementById("writeReviewBtn")
review_btn?.addEventListener("click", () => {
  document.getElementById("reviewForm").style.display = "block";
});

let selectedRating = 0;

const stars = document.querySelectorAll("#starRating .star");

stars.forEach((star) => {
  star.addEventListener("mouseover", () => {
    const value = parseInt(star.getAttribute("data-value"));
    highlightStars(value);
  });

  star.addEventListener("mouseout", () => {
    highlightStars(selectedRating);
  });

  star.addEventListener("click", () => {
    selectedRating = parseInt(star.getAttribute("data-value"));
    highlightStars(selectedRating);
  });
});

function highlightStars(rating) {
  stars.forEach((star) => {
    const value = parseInt(star.getAttribute("data-value"));
    star.classList.toggle("hover", value <= rating);
    star.classList.toggle("selected", value <= rating);
  });
}


document.getElementById("submitReview")?.addEventListener("click", async () => {
    const text = document.getElementById("reviewText").value;
    const perfume = document.getElementById("fragranceName").innerHTML;
    const rating = selectedRating; // Assuming you have a variable `selectedRating` holding the rating value

    if (!text || !perfume || !rating) {
        alert("Please enter both a review, perfume name, and a rating.");
        return;
    }

    const review = {
        text,
        rating,
        perfume,  // This will be looked up in the backend for the product_id
        authorId: user_id,
    };

    try {
        const response = await fetch("http://localhost:5000/reviews", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(review)
        });

        if (!response.ok) {
            throw new Error("Failed to submit review");
        }

        // Clear form and hide
        document.getElementById("reviewText").value = "";
        document.getElementById("fragranceName").innerHTML = "";  // Adjust according to your HTML structure
        document.getElementById("reviewForm").style.display = "none";

        alert("Review submitted! You can view it in your profile.");

    } catch (error) {
        console.error(error);
        alert("An error occurred while submitting the review.");
    }
});

// used in panier.html
async function loadCart() {
  const container = document.getElementById('cartItemsContainer');
  const totalElement = document.getElementById('cartTotal');

  try {
    // Fetch cart items from the backend
    const response = await fetch(`http://localhost:5000/cart/${user_id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart items');
    }

    const cartItems = await response.json();

    container.innerHTML = '';
    let total = 0;

    if (cartItems.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <h4 class="text-muted mb-4">Your cart is empty</h4>
          <a href="index.html#fragrances" class="btn btn-dark">Browse Fragrances</a>
        </div>
      `;
      return;
    }

    // Fetch product details for each cart item (product_id -> product details)
    for (const item of cartItems) {
      console.log(item)
      const productResponse = await fetch(`http://localhost:5000/products/${item.product_id}`);
      const product = await productResponse.json();

      total += product.price;  // Add the product price to the total (adjust as needed for quantity)

      const card = document.createElement('div');
      card.className = 'col-12 mb-3';
      card.innerHTML = `
        <div class="card shadow-sm" data-product-id="${product.id}">
          <div class="row g-0">
            <div class="col-md-3">
              <img src="${product.image}" class="img-fluid rounded-start" alt="${product.name}" style="height: 200px; object-fit: cover;">
            </div>
            <div class="col-md-7 p-4">
              <h5 class="card-title">${product.name}</h5>
              <div class="row align-items-center">
                <div class="col-md-6">
                  <p class="item-price mb-2" data-value="${product.price.toFixed(2)}">Price: ${product.price.toFixed(2)} TND</p>
                  <div class="input-group quantity-control">
                    <button class="btn btn-outline-dark" onclick="updateQuantity(${product.id}, -1, ${user_id})">-</button>
                    <input type="text" class="quantity-input form-control text-center" value="1" readonly> <!-- You can handle quantity logic here -->
                    <button class="btn btn-outline-dark" onclick="updateQuantity(${product.id}, 1, ${user_id})">+</button>
                  </div>
                </div>
                <div class="col-md-6 text-md-end mt-3 mt-md-0">
                  <p class="item-subtotal mb-2">Subtotal: TND${(product.price).toFixed(2)}</p>
                  <button class="btn btn-danger" onclick="removeItem('${product.id}')">
                    <i class="bi bi-trash"></i> Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    }

    totalElement.textContent = total.toFixed(2);

  } catch (error) {
    console.error('Error loading cart:', error);
    // Show an error message if the cart items can't be loaded
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <h4 class="text-muted mb-4">Failed to load cart. Please try again later.</h4>
      </div>
    `;
  }
}

function updateQuantity(productId, change) {
  const container = document.querySelector(`[data-product-id="${productId}"]`);
  const quantityInput = container.querySelector('.quantity-input');
  const subtotalElement = container.querySelector('.item-subtotal');
  const priceElement = container.querySelector('.item-price');

  let currentQuantity = parseInt(quantityInput.value);
  let price = parseFloat(priceElement.dataset.value);

  const newQuantity = currentQuantity + change;

  if (newQuantity < 1) {
    container.remove(); // Remove item from DOM if quantity is less than 1
  } else {
    quantityInput.value = newQuantity;
    subtotalElement.textContent = `Subtotal: TND${(price * newQuantity).toFixed(2)}`;
  }

  updateCartTotal(); // Update overall cart total
}

function updateCartTotal() {
  let total = 0;

  // Loop through each cart item and sum up the subtotal
  document.querySelectorAll('[data-product-id]').forEach(item => {
    const price = parseFloat(item.querySelector('.item-price').dataset.value);
    const quantity = parseInt(item.querySelector('.quantity-input').value);

    total += price * quantity;
  });

  // Update the total in the DOM
  const totalElement = document.getElementById('cartTotal');
  if (totalElement) {
    totalElement.textContent = total.toFixed(2);
  }
}

async function removeItem(productId) {
  try {
      // Send a DELETE request to the backend to remove the item from the cart
      const response = await fetch(`http://localhost:5000/cart/remove`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              user_id: user_id,
              product_id: productId
          })
      });

      const data = await response.json();

      if (response.ok) {
          console.log(data.message);  // e.g., 'Item removed from cart'
          location.reload();  // Reload the page to update the cart display
      } else {
          console.error('Error removing item from cart:', data.message);
      }
  } catch (error) {
      console.error('Error details:', error);
      // Optional: Show a user-friendly message
      alert('An error occurred. Please try again.');
  }
}

// Function to add a fragrance to the user's collection
function addToCollection(productId, name, image, brand) {
  
    // Mock data for fragrance (name, image, size, etc.)
    const fragranceData = {
      productId: productId,
      name: name,
      image: image,
      brand: brand,
    };
  
    // Making a POST request to the API to add the fragrance to the collection
    fetch('http://localhost:5000/collection/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user_id,
        productId: productId,
        brand: brand,
        fragranceData: fragranceData,
      }),
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert('Fragrance added to your collection!');
      } else {
        alert('Failed to add fragrance to collection!');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An error occurred while adding to the collection.');
    });
  }

  async function addToCart(productId) {
    try {
        // Prepare the data to send to the backend
        const response = await fetch('http://localhost:5000/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: localStorage.getItem("user_id"),  // The user's ID
                product_id: productId  // The product's ID
            })
        });

        const data = await response.json();

        // If the product is added successfully
        if (response.ok) {
            console.log(data.message);  // 'Added to cart'
            showCartNotification(); // Update UI to reflect the cart update
        } else {
            // Handle errors (e.g., if the cart couldn't be updated)
            console.error('Error adding to cart:', data.message);
        }
    } catch (error) {
        console.error('Error details:', error);
        // Optional: show a user-friendly message
        alert('An error occurred. Please try again.');
    }
}

function showCartNotification() {
  const notification = document.createElement('div');
  notification.className = 'position-fixed bottom-0 end-0 m-3 p-3 bg-success text-white rounded shadow';
  notification.textContent = 'Item added to cart!';
  document.body.appendChild(notification);
  
  setTimeout(() => {
      notification.remove();
  }, 2000);
}

async function placeOrder() {
  const items = document.querySelectorAll('[data-product-id]');

  for (const item of items) {
    const productId = item.getAttribute('data-product-id');

    await fetch('http://localhost:5000/cart/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user_id,
        product_id: parseInt(productId)
      })
    });

    item.remove();
  }

  updateCartTotal();
  alert('Your order has been placed successfully!');
  window.location = "index.html"
}

// to be used in profile.html
async function loadUserReviews(userId) {
  const response = await fetch(`http://localhost:5000/reviews/${userId}`);
  const reviews = await response.json();
  const reviewsContainer = document.getElementById("reviewsContainer");
  const noReviewsMessage = document.getElementById("noReviewsMessage");

  reviewsContainer.innerHTML = '';  // Clear previous content

  if (reviews.length === 0) {
    noReviewsMessage.style.display = 'block';
    return;
  }

  noReviewsMessage.style.display = 'none';

  reviews.forEach(review => {
    const reviewCard = document.createElement("div");
    reviewCard.classList.add("col-md-4", "mb-4");

    reviewCard.innerHTML = `
      <div class="review-card">
        <div class="review-header d-flex align-items-center mb-3">
          <img src="http://localhost:5000/${review.user.image}" alt="User" class="review-avatar">
          <div class="ms-3">
            <h5 class="review-username mb-0">${review.user.name}</h5>
            <div class="review-rating">
              ${generateStars(review.rating)}
            </div>
          </div>
        </div>
        <h6 class="review-fragrance">${review.product.name}</h6>
        <p class="review-text">${review.content}</p>
        <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
      </div>
    `;
    
    reviewsContainer.appendChild(reviewCard);
  });
}

// Helper function to generate stars based on rating (1-5)
function generateStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<i class="bi bi-star-fill"></i>';  // Filled star
    } else {
      stars += '<i class="bi bi-star"></i>';  // Empty star
    }
  }
  return stars;
}

async function loadUserCollection(userId) {
  try {
      const response = await fetch(`http://localhost:5000/collection/${userId}`);
      const collections = await response.json();
      
      const collectionContainer = document.getElementById('collectionContainer');
      collectionContainer.innerHTML = '';  // Clear previous content

      if (Object.keys(collections).length === 0) {
          collectionContainer.innerHTML = `
              <div class="col-12 text-center py-5">
                  <h4 class="text-muted mb-4">Your collection is empty</h4>
                  <p>Add fragrances to your collection!</p>
              </div>
          `;
          return;
      }

      // Loop through the collection items and display them
      for (let productId in collections) {
          const fragranceData = collections[productId];

          // You can use the fragranceData to fetch product info if needed, or display directly
          const productCard = document.createElement('div');
          productCard.classList.add('col-md-4', 'mb-4');
          
          productCard.innerHTML = `
              <div class="collection-card">
                  <div class="card shadow-sm">
                      <img src="${fragranceData.image}" class="card-img-top" alt="${fragranceData.name}">
                      <div class="card-body">
                          <h5 class="card-title">${fragranceData.name}</h5>
                          <h4 class="card-title">${fragranceData.brand}</h4>
                      </div>
                  </div>
              </div>
          `;
          
          collectionContainer.appendChild(productCard);
      }
  } catch (error) {
      console.error('Error loading collection:', error);
  }
}

async function removeFromCollection(userId, productId) {
  try {
      const response = await fetch('http://localhost:5000/collection/remove', {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: userId, product_id: productId })
      });
      
      const result = await response.json();
      if (result.success) {
          alert('Fragrance removed from your collection!');
          loadUserCollection(userId); // Refresh the collection display
      } else {
          alert(result.message);
      }
  } catch (error) {
      console.error('Error removing from collection:', error);
  }
}

async function loadUserDetails(userId) {
  try {
      const response = await fetch(`http://localhost:5000/user/${userId}`);
      const userDetails = await response.json();

      if (!userDetails || Object.keys(userDetails).length === 0) {
          console.log("User details not found.");
          return;
      }

      // Update profile name
      const profileNameElement = document.getElementById('profile-name');
      profileNameElement.textContent = userDetails.username;

      document.getElementById("profile-bio").innerHTML = userDetails.bio;
      document.querySelector('.profile-avatar').src = `http://localhost:5000/${userDetails.image}`;

      // Update profile bio
      const profileBioElement = document.querySelector('.profile-bio');
      profileBioElement.textContent = userDetails.bio;

      // Update collection count
      const collectionCountElement = document.getElementById('collectionCount');
      const collections = userDetails.collections ? Object.keys(userDetails.collections).length : 0;
      collectionCountElement.textContent = collections;

      // 🛠️ Fetch and update review count separately
      const reviewsResponse = await fetch(`http://localhost:5000/reviews/${userId}`);
      const reviews = await reviewsResponse.json();
      const reviewCountElement = document.getElementById('reviewCount');
      reviewCountElement.textContent = reviews.length; // because reviews is an array

  } catch (error) {
      console.error('Error loading user details:', error);
  }
}


function handleSearchRedirect(event) {
  event.preventDefault();

  const input = document.getElementById('searchInput').value.toLowerCase().trim();

  if (input) {
    // Redirect to the brands page with a search query parameter
    window.location.href = `brands.html?search=${encodeURIComponent(input)}`;
  } else {
    alert("Please enter a search term.");
  }
}

function filterBrandsBySearchQuery() {
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get('search')?.toLowerCase().trim();

  if (searchQuery) {
    const brandCards = document.getElementById("brands-grid").querySelectorAll('.brand-card');
    brandCards.forEach(brandCard => {
      const brandName = brandCard.getAttribute('data-brand').toLowerCase();
      
      if (brandName.includes(searchQuery)) {
        // Show matching brand and highlight it
        brandCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        brandCard.style.backgroundColor = '#99939d';  // Highlight with a light yellow background
        setTimeout(() => {
          brandCard.style.backgroundColor = '';  // Remove highlight after 2 seconds
        }, 4000);
      } else {
        // Make sure the non-matching brands are not hidden (we just don't highlight them)
        brandCard.style.backgroundColor = '';  // Reset background color for non-matching items
      }
    });
  }
}

function addToFavorite() {
  // Get the fragrance's ID and the user ID from relevant elements (can be fetched dynamically)
  const fragranceId = currentFragrance.id; // Assuming currentFragrance is already defined

  // Prepare the data to be sent in the request
  const data = {
    user_id: user_id,
    product_id: fragranceId
  };

  // Send the POST request to add to favorites
  fetch('http://localhost:5000/favorite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Added to favorites') {
      // Optionally, update the UI or show a success message
      alert('Fragrance added to your favorites!');
      
      // Optionally update button style to indicate it was favorited
      document.getElementById('fav-btn').classList.add('favorited'); // Add a 'favorited' class or change style
    } else {
      alert('Failed to add to favorites.');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('An error occurred while adding to favorites.');
  });
};

async function getProductDetails(productId) {
  try {
    const response = await fetch(`http://localhost:5000/products/${productId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product details');
    }
    const productData = await response.json();
    return productData;
  } catch (error) {
    console.error(error);
    return null;
  }
}


async function loadUserFavorites() {
  try {
    const response = await fetch(`http://localhost:5000/favorites/${user_id}`);
    const favorites = await response.json();
    
    const favoriteContainer = document.getElementById('favoriteContainer');
    favoriteContainer.innerHTML = '';  // Clear previous content

    if (Object.keys(favorites).length === 0) {
        favoriteContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <h4 class="text-muted mb-4">Your favorite collection is empty</h4>
                <p>Add fragrances to your favorites!</p>
            </div>
        `;
        return;
    }

    // Loop through the collection items and display them
    for (let ind in favorites) {
        const fragranceData = await getProductDetails(favorites[ind].product_id);

        // You can use the fragranceData to fetch product info if needed, or display directly
        const productCard = document.createElement('div');
        productCard.classList.add('col-md-4', 'mb-4');
        
        productCard.innerHTML = `
            <div class="favorite-card">
                <div class="card shadow-sm">
                    <img src="${fragranceData.image}" class="card-img-top" alt="${fragranceData.name}">
                    <div class="card-body">
                        <h5 class="card-title">${fragranceData.name}</h5>
                        <h4 class="card-title">${fragranceData.brand}</h4>
                    </div>
                </div>
            </div>
        `;
        
        favoriteContainer.appendChild(productCard);
    }
    
    document.getElementById("favoriteCount").innerHTML = Object.keys(favorites).length;
  } catch (error) {
    console.error('Error loading favorites:', error);
  }

}

// Add event listener to search form on all pages
document.getElementById('searchForm')?.addEventListener('submit', handleSearchRedirect);

function setupPicUploadHandler(userId) {
  document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        // Create a FormData object to send the file to the server
        const formData = new FormData();
        formData.append('file', file);

        // Make an AJAX request to the Flask server to upload the image
        fetch(`http://localhost:5000/upload_profile_pic/${userId}`, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.profile_pic) {
                // Update the profile avatar with the new image
                document.getElementById('profileAvatar').src = '/' + data.profile_pic;
                alert(data.message);  // Show success message
            } else {
                alert('Error uploading image: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while uploading the image.');
        });
    }
  });
  
}

document.querySelectorAll(".brand-card").forEach(brandCard => {
  const brandName = brandCard.getAttribute('data-brand').toLowerCase();
  brandCard.addEventListener('click', () => {window.location = `products.html?brand=${brandName}`})

  
})

document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem('user_id');
  const nav = document.querySelector('.navbar-nav');
  const cartLink = document.querySelector('a[href="panier.html"]');
if (cartLink) {
  cartLink.addEventListener('click', (e) => {
    if (!userId) { 
      e.preventDefault(); // Stop navigating to cart.html
      window.location.href = 'login.html'; // Redirect to login page
    }
  });
}


  if (userId) {
    const loginLink = nav.querySelector('a[href="login.html"]')?.parentElement;
    const signInLink = nav.querySelector('a[href="signin.html"]')?.parentElement;
    loginLink?.remove();
    signInLink?.remove();

    const logoutItem = document.createElement('li');
    logoutItem.className = 'nav-item';
    logoutItem.innerHTML = `<a class="nav-link" href="#" id="logoutBtn">Logout</a>`;
    nav.appendChild(logoutItem);

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('user_id');
      window.location.replace('index.html');

    });
  } else {
    // User is not logged in
    const profileLink = nav.querySelector('a[href="profile.html"]')?.parentElement;
    profileLink?.remove();

    // Remove any existing login and sign-in links to avoid duplicates
    const oldLoginLink = nav.querySelector('a[href="login.html"]')?.parentElement;
    const oldSigninLink = nav.querySelector('a[href="signin.html"]')?.parentElement;
    oldLoginLink?.remove();
    oldSigninLink?.remove();

    // Now safely add them again
    const loginItem = document.createElement('li');
    loginItem.className = 'nav-item';
    loginItem.innerHTML = `<a class="nav-link" href="login.html">Login</a>`;
    nav.appendChild(loginItem);

    const signinItem = document.createElement('li');
    signinItem.className = 'nav-item';
    signinItem.innerHTML = `<a class="nav-link" href="signin.html">Sign Up</a>`;
    nav.appendChild(signinItem);
  }

  if (!userId) {
    document.querySelectorAll('.profile-protected').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        alert('You must log in to access this page!');
        window.location.href = 'login.html'; // redirect to login if not logged in
      });
    });
  }
});