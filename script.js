/**
 * FipPzo - Good Food. Great Mood.
 * 120fps Canvas Video Scrubbing Engine + Interactive Menu & Audio System
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const canvas = document.getElementById('scrollCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const navbar = document.getElementById('navbar');
  const navContainer = document.getElementById('navContainer');
  const navRoundToggle = document.getElementById('navRoundToggle');
  const navFloatingClose = document.getElementById('navFloatingClose');
  const navBackdropScrim = document.getElementById('navBackdropScrim');
  const navLinks = document.querySelectorAll('.nav-link');
  const allNavLinks = document.querySelectorAll('.nav-link, .submenu-link');
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  const glowCursor = document.getElementById('glowCursor');
  const filterButtons = document.querySelectorAll('.filter-pill-btn');
  const burgerCards = document.querySelectorAll('.burger-card');
  const openCartBtn = document.getElementById('openCartBtn');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const cartDialog = document.getElementById('cartDialog');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartTotalVal = document.getElementById('cartTotalVal');
  const confirmOrderCheckout = document.getElementById('confirmOrderCheckout');
  const addCartButtons = document.querySelectorAll('.btn-add-cart');

  // Video Frame Scrub Constants
  const TOTAL_DURATION = 20.00;
  const FRAME_COUNT = 120;
  const frameImages = [];
  let currentRenderedIndex = -1;

  // Cart State
  const cart = [];

  // ==========================================================================
  // 1. CANVAS SETUP & PRELOADED FRAME ENGINE (120 FPS GPU RENDERING - UNTOUCHED)
  // ==========================================================================
  function resizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    if (currentRenderedIndex >= 0) {
      renderFrame(currentRenderedIndex);
    }
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function renderFrame(index) {
    if (!ctx || !canvas) return;
    const img = frameImages[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;

    let renderW, renderH, offsetX, offsetY;
    if (canvasRatio > imgRatio) {
      renderW = cw;
      renderH = cw / imgRatio;
      offsetX = 0;
      offsetY = (ch - renderH) / 2;
    } else {
      renderH = ch;
      renderW = ch * imgRatio;
      offsetX = (cw - renderW) / 2;
      offsetY = 0;
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    currentRenderedIndex = index;
  }

  // Preload all 120 frames in order
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.src = `frames/frame_${String(i).padStart(3, '0')}.jpg`;

    if (i === 0) {
      img.onload = () => {
        renderFrame(0);
        updateScrollyState();
      };
    }
    frameImages.push(img);
  }

  // ==========================================================================
  // 2. SCROLL ENGINE (120 FPS GPU RENDERING)
  // ==========================================================================
  let isTicking = false;

  function updateScrollyState() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    
    let progress = maxScroll > 0 ? scrollY / maxScroll : 0;
    progress = Math.max(0, Math.min(1, progress));

    // Map scroll strictly to Frame Index (0 to 119)
    const targetFrame = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
    if (targetFrame !== currentRenderedIndex) {
      renderFrame(targetFrame);
    }

    // Update Interactive Scroll Progress Indicator
    if (scrollProgressBar) {
      scrollProgressBar.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    // Header scroll background & collapsible round toggle behavior
    if (navbar) {
      if (scrollY > 90) {
        navbar.classList.add('scrolled');
        navbar.classList.add('nav-collapsed');
      } else {
        navbar.classList.remove('scrolled');
        navbar.classList.remove('nav-collapsed');
        navbar.classList.remove('nav-expanded');
      }
    }

    // Nav active link based on section
    const sections = [
      { id: 'hero', el: document.getElementById('hero') },
      { id: 'features', el: document.getElementById('features') },
      { id: 'menu', el: document.getElementById('menu') },
      { id: 'footer', el: document.getElementById('footer') }
    ];

    sections.forEach(sec => {
      if (!sec.el) return;
      const rect = sec.el.getBoundingClientRect();
      if (rect.top <= 200 && rect.bottom >= 200) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${sec.id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });

    isTicking = false;
  }

  function onScroll() {
    if (!isTicking) {
      requestAnimationFrame(updateScrollyState);
      isTicking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Initial draw
  updateScrollyState();

  // ==========================================================================
  // 3. INTERACTIVE CART SYSTEM
  // ==========================================================================
  function updateCartUI() {
    const totalCount = cart.length;
    if (cartCountBadge) {
      if (totalCount > 0) {
        cartCountBadge.style.display = 'inline-flex';
        cartCountBadge.textContent = totalCount;
      } else {
        cartCountBadge.style.display = 'none';
      }
    }

    let subtotal = 0;
    cart.forEach(item => { subtotal += item.price; });
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + tax;

    // Sync Workspace Hub Badges & Summary
    const hubCartCount = document.getElementById('hubCartCount');
    const hubCartTotal = document.getElementById('hubCartTotal');
    const hubOrderBadge = document.getElementById('hubOrderBadge');
    const hubSubtotalVal = document.getElementById('hubSubtotalVal');
    const hubTaxVal = document.getElementById('hubTaxVal');
    const hubGrandTotalVal = document.getElementById('hubGrandTotalVal');
    const hubOrderItemsList = document.getElementById('hubOrderItemsList');

    if (hubCartCount) hubCartCount.textContent = totalCount;
    if (hubOrderBadge) hubOrderBadge.textContent = totalCount;
    if (hubCartTotal) hubCartTotal.textContent = `$${subtotal.toFixed(2)}`;
    if (hubSubtotalVal) hubSubtotalVal.textContent = `$${subtotal.toFixed(2)}`;
    if (hubTaxVal) hubTaxVal.textContent = `$${tax.toFixed(2)}`;
    if (hubGrandTotalVal) hubGrandTotalVal.textContent = `$${grandTotal.toFixed(2)}`;

    // Sync Main Cart Dialog List
    if (cartItemsList) {
      if (totalCount === 0) {
        cartItemsList.innerHTML = '<p style="color:#9ca3af; text-align:center; padding:1.5rem 0;">Your cart is empty. Pick a burger from our signature menu!</p>';
        if (cartTotalVal) cartTotalVal.textContent = '$0.00';
      } else {
        cartItemsList.innerHTML = cart.map((item, idx) => `
          <div class="cart-item-row">
            <div>
              <strong style="color:#fff;">${item.name}</strong>
              <small style="color:#9ca3af; display:block;">Handcrafted &bull; Fresh Daily</small>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <strong style="color:#f8a825;">$${item.price.toFixed(2)}</strong>
              <button onclick="removeCartItem(${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem;" title="Remove">&times;</button>
            </div>
          </div>
        `).join('');
        if (cartTotalVal) cartTotalVal.textContent = `$${subtotal.toFixed(2)}`;
      }
    }

    // Sync Workspace Hub Order List
    if (hubOrderItemsList) {
      if (totalCount === 0) {
        hubOrderItemsList.innerHTML = '<p style="color:#9ca3af; text-align:center; padding:2rem 0; font-size:0.86rem;">Your order is empty. Browse dishes in the Explorer tab to add items!</p>';
      } else {
        const grouped = {};
        cart.forEach(item => {
          if (!grouped[item.name]) {
            grouped[item.name] = { name: item.name, price: item.price, count: 0 };
          }
          grouped[item.name].count++;
        });

        hubOrderItemsList.innerHTML = Object.values(grouped).map(item => `
          <div class="hub-order-row">
            <div class="hub-order-item-info">
              <span class="hub-order-item-name">${item.name}</span>
              <span class="hub-order-item-sub">$${item.price.toFixed(2)} each</span>
            </div>
            <div class="hub-order-qty-ctrl">
              <button class="btn-qty" onclick="changeHubItemQty('${item.name.replace(/'/g, "\\'")}', -1)" title="Decrease">&minus;</button>
              <span class="qty-display">${item.count}</span>
              <button class="btn-qty" onclick="changeHubItemQty('${item.name.replace(/'/g, "\\'")}', 1)" title="Increase">&plus;</button>
            </div>
            <span class="hub-order-row-price">$${(item.price * item.count).toFixed(2)}</span>
          </div>
        `).join('');
      }
    }
  }

  window.removeCartItem = function(idx) {
    cart.splice(idx, 1);
    updateCartUI();
  };

  window.changeHubItemQty = function(itemName, delta) {
    if (delta > 0) {
      // Find item price from existing cart or database
      const existing = cart.find(i => i.name === itemName);
      if (existing) {
        cart.push({ name: existing.name, price: existing.price });
      }
    } else if (delta < 0) {
      const idx = cart.findIndex(i => i.name === itemName);
      if (idx !== -1) {
        cart.splice(idx, 1);
      }
    }
    updateCartUI();
  };

  addCartButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price'));
      cart.push({ name, price });

      // Visual feedback on button
      const originalText = btn.textContent;
      btn.textContent = '✓ Added!';
      btn.style.background = '#f8a825';
      btn.style.color = '#111116';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 1200);

      updateCartUI();
    });
  });

  if (openCartBtn && cartDialog) {
    openCartBtn.addEventListener('click', () => {
      updateCartUI();
      cartDialog.showModal();
    });
  }

  if (closeCartBtn && cartDialog) {
    closeCartBtn.addEventListener('click', () => {
      cartDialog.close();
    });
  }

  if (confirmOrderCheckout && cartDialog) {
    confirmOrderCheckout.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Please add a burger to your cart before proceeding!');
        return;
      }
      confirmOrderCheckout.textContent = '✓ Order Placed! Kitchen Notified';
      confirmOrderCheckout.style.background = '#22c55e';
      setTimeout(() => {
        cart.length = 0;
        updateCartUI();
        cartDialog.close();
        confirmOrderCheckout.textContent = 'Proceed to Checkout';
        confirmOrderCheckout.style.background = '';
      }, 2000);
    });
  }

  // ==========================================================================
  // 4. INTERACTIVE MENU CATEGORY FILTER SYSTEM
  // ==========================================================================
  if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');
        burgerCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filterValue === 'all' || category === filterValue) {
            card.classList.remove('filtered-out');
          } else {
            card.classList.add('filtered-out');
          }
        });
      });
    });
  }

  // ==========================================================================
  // 5. INTERACTIVE AMBIENT CURSOR GLOW SPOTLIGHT
  // ==========================================================================
  if (glowCursor && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isTracking = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isTracking) {
        isTracking = true;
        glowCursor.style.opacity = '1';
      }
    }, { passive: true });

    function animateGlow() {
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      glowCursor.style.left = `${currentX}px`;
      glowCursor.style.top = `${currentY}px`;
      requestAnimationFrame(animateGlow);
    }
    requestAnimationFrame(animateGlow);
  }

  // ==========================================================================
  // 6. MORE RECIPES DROPDOWN TOGGLE (Hover + Click/Tap support)
  // ==========================================================================
  const moreRecipesToggle = document.getElementById('moreRecipesToggle');
  const dropdownWrapper = document.querySelector('.nav-dropdown-wrapper');
  if (moreRecipesToggle && dropdownWrapper) {
    moreRecipesToggle.addEventListener('click', (e) => {
      e.preventDefault();
      dropdownWrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!dropdownWrapper.contains(e.target)) {
        dropdownWrapper.classList.remove('open');
      }
    });
  }

  // ==========================================================================
  // 7. COLLAPSIBLE ROUND ICON NAVBAR & WORKSPACE HUB CONTROLS
  // ==========================================================================
  const navHubWindow = document.getElementById('navHubWindow');
  const navHubTriggerBtn = document.getElementById('navHubTriggerBtn');
  const hubCloseBtn = document.getElementById('hubCloseBtn');
  const hubCartPillBtn = document.getElementById('hubCartPillBtn');
  const hubTabBtns = document.querySelectorAll('.hub-tab-btn');
  const hubTabPanes = document.querySelectorAll('.hub-tab-pane');
  const hubDishSearch = document.getElementById('hubDishSearch');
  const hubSearchClear = document.getElementById('hubSearchClear');
  const hubCategoryPills = document.querySelectorAll('.hub-cat-pill');
  const hubDishesGrid = document.getElementById('hubDishesGrid');
  const hubClearCartBtn = document.getElementById('hubClearCartBtn');
  const hubCheckoutBtn = document.getElementById('hubCheckoutBtn');
  const hubReserveForm = document.getElementById('hubReserveForm');
  const reserveSuccessMsg = document.getElementById('reserveSuccessMsg');

  function openHubWindow() {
    if (navHubWindow) {
      navHubWindow.classList.add('open');
      if (navbar) navbar.classList.add('hub-open');
      if (navBackdropScrim) navBackdropScrim.classList.add('hub-active');
      renderHubDishes();
      updateCartUI();
    }
  }

  function closeHubWindow() {
    if (navHubWindow) {
      navHubWindow.classList.remove('open');
      if (navbar) navbar.classList.remove('hub-open');
      if (navBackdropScrim) navBackdropScrim.classList.remove('hub-active');
    }
  }

  // Click round toggle icon: Open the Hub Window!
  if (navRoundToggle) {
    navRoundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navHubWindow && navHubWindow.classList.contains('open')) {
        closeHubWindow();
      } else {
        openHubWindow();
      }
    });
  }

  // Workspace trigger button on top bar
  if (navHubTriggerBtn) {
    navHubTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openHubWindow();
    });
  }

  // Close button inside Hub
  if (hubCloseBtn) {
    hubCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeHubWindow();
    });
  }

  // Close when clicking the backdrop scrim
  if (navBackdropScrim) {
    navBackdropScrim.addEventListener('click', () => {
      closeHubWindow();
      if (navbar) navbar.classList.remove('nav-expanded');
    });
  }

  // Escape key closes both Hub and expanded navbar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeHubWindow();
      if (navbar) navbar.classList.remove('nav-expanded');
    }
  });

  // Click outside Hub closes it (clicking inside NEVER closes it)
  document.addEventListener('click', (e) => {
    if (navHubWindow && navHubWindow.classList.contains('open')) {
      if (!navHubWindow.contains(e.target) && !navRoundToggle.contains(e.target) && (!navHubTriggerBtn || !navHubTriggerBtn.contains(e.target))) {
        closeHubWindow();
      }
    }
  });

  // Hub Header Cart pill switches to Order Tab
  if (hubCartPillBtn) {
    hubCartPillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      switchHubTab('orderTab');
    });
  }

  // Hub Tab switching function
  function switchHubTab(targetTabId) {
    hubTabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    hubTabPanes.forEach(pane => {
      if (pane.id === targetTabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  hubTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchHubTab(target);
    });
  });

  // Quick navigation items inside Hub: jump to section and close Hub
  const hubNavItems = document.querySelectorAll('.hub-nav-item');
  hubNavItems.forEach(item => {
    item.addEventListener('click', () => {
      closeHubWindow();
    });
  });

  // ==========================================================================
  // DISHES DATA & REAL-TIME DISCOVERY ENGINE INSIDE HUB
  // ==========================================================================
  const hubDishes = [
    { name: 'Classic Cheeseburger', cat: 'beef', price: 8.99, badge: '★ Bestseller', desc: 'Flame-seared Angus beef, aged sharp cheddar, butter lettuce, secret sauce' },
    { name: 'Bacon Deluxe', cat: 'beef', price: 10.99, badge: '🥓 Smoked Bacon', desc: 'Double beef patty, aged cheddar, applewood bacon, crispy onions, bourbon BBQ' },
    { name: 'Spicy Jalapeño', cat: 'spicy', price: 9.99, badge: '🔥 Hot Pick', desc: 'Pepper jack, charred jalapeños, smoked chipotle aioli, crispy brioche' },
    { name: 'Truffle Mushroom', cat: 'beef', price: 11.49, badge: '🍄 Gourmet', desc: 'Sautéed cremini mushrooms, black truffle glaze, melted swiss' },
    { name: 'Truffle Tagliatelle', cat: 'pasta', price: 14.50, badge: '🍝 Handcrafted', desc: 'Hand-rolled egg pasta, shaved black summer truffles, parmesan emulsion' },
    { name: 'Rigatoni Bolognese', cat: 'pasta', price: 13.20, badge: '🍝 Classic', desc: 'Slow-simmered beef ragù, san marzano tomatoes, aged pecorino' },
    { name: 'Stone Margherita', cat: 'pizza', price: 12.00, badge: '🍕 Wood-Fired', desc: 'San Marzano DOP tomatoes, buffalo mozzarella, fresh sweet basil' },
    { name: 'Prosciutto & Fig Pizza', cat: 'pizza', price: 15.50, badge: '🍕 Artisanal', desc: '24-month Parma prosciutto, wild figs, gorgonzola crema, balsamic reduction' },
    { name: 'Chocolate Lava Cake', cat: 'dessert', price: 6.50, badge: '🍫 Sweet', desc: 'Warm molten Valrhona ganache center with Madagascar vanilla bean gelato' },
    { name: 'Tiramisu Classico', cat: 'dessert', price: 7.00, badge: '🍰 Italian', desc: 'Espresso-soaked ladyfingers, velvety mascarpone cream, dark cocoa dust' },
    { name: 'Craft Nitro Cold Brew', cat: 'drinks', price: 5.00, badge: '☕ Brew', desc: 'Single-origin Ethiopian beans steeped 24h, velvet cascading crema' },
    { name: 'Sparkling Peach Fizz', cat: 'drinks', price: 4.50, badge: '🍑 Refresh', desc: 'White peach purée, handcrafted herbal tonic, fresh rosemary sprig' }
  ];

  let currentHubCategory = 'all';
  let currentHubSearchQuery = '';

  function renderHubDishes() {
    if (!hubDishesGrid) return;
    const query = currentHubSearchQuery.toLowerCase().trim();
    const filtered = hubDishes.filter(dish => {
      const matchCat = (currentHubCategory === 'all' || dish.cat === currentHubCategory);
      const matchQuery = !query || dish.name.toLowerCase().includes(query) || dish.desc.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      hubDishesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; color: #9ca3af;">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No dishes match "${currentHubSearchQuery}"</p>
          <small>Try searching for "burger", "pasta", "pizza", or "truffle"</small>
        </div>
      `;
      return;
    }

    hubDishesGrid.innerHTML = filtered.map(dish => `
      <div class="hub-dish-card">
        <div class="hub-dish-top">
          <div style="flex:1;">
            <h4 class="hub-dish-name">${dish.name}</h4>
            <p class="hub-dish-desc">${dish.desc}</p>
          </div>
          <span class="hub-dish-cat-badge">${dish.badge}</span>
        </div>
        <div class="hub-dish-bottom">
          <span class="hub-dish-price">$${dish.price.toFixed(2)}</span>
          <button class="btn-hub-add" onclick="addDishFromHub('${dish.name.replace(/'/g, "\\'")}', ${dish.price})">
            &plus; Add to Order
          </button>
        </div>
      </div>
    `).join('');
  }

  window.addDishFromHub = function(name, price) {
    cart.push({ name, price });
    updateCartUI();

    // Button animation feedback
    if (window.event && window.event.target) {
      const btn = window.event.target;
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Added!';
      btn.style.background = '#22c55e';
      btn.style.color = '#111116';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
        btn.style.color = '';
      }, 900);
    }
  };

  // Search input listeners
  if (hubDishSearch) {
    hubDishSearch.addEventListener('input', (e) => {
      currentHubSearchQuery = e.target.value;
      if (hubSearchClear) {
        hubSearchClear.style.display = currentHubSearchQuery ? 'block' : 'none';
      }
      renderHubDishes();
    });
  }

  if (hubSearchClear) {
    hubSearchClear.addEventListener('click', () => {
      hubDishSearch.value = '';
      currentHubSearchQuery = '';
      hubSearchClear.style.display = 'none';
      renderHubDishes();
      hubDishSearch.focus();
    });
  }

  // Category filter chips inside Hub
  hubCategoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      hubCategoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentHubCategory = pill.getAttribute('data-cat');
      renderHubDishes();
    });
  });

  // Hub Clear Order button
  if (hubClearCartBtn) {
    hubClearCartBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      if (confirm('Are you sure you want to clear your current order?')) {
        cart.length = 0;
        updateCartUI();
      }
    });
  }

  // Hub Checkout button
  if (hubCheckoutBtn) {
    hubCheckoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Your order is empty. Please add items before checking out!');
        return;
      }
      hubCheckoutBtn.textContent = '✓ Order Placed! Kitchen Notified';
      hubCheckoutBtn.style.background = '#22c55e';
      setTimeout(() => {
        cart.length = 0;
        updateCartUI();
        hubCheckoutBtn.textContent = 'Proceed to Checkout';
        hubCheckoutBtn.style.background = '';
        switchHubTab('orderTab');
      }, 1800);
    });
  }

  // Table reservation form listeners
  const guestPills = document.querySelectorAll('.guest-pill');
  guestPills.forEach(pill => {
    pill.addEventListener('click', () => {
      guestPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  const timePills = document.querySelectorAll('.time-pill');
  timePills.forEach(pill => {
    pill.addEventListener('click', () => {
      timePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  if (hubReserveForm) {
    hubReserveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const activeGuest = document.querySelector('.guest-pill.active')?.getAttribute('data-guests') || '2';
      const activeTime = document.querySelector('.time-pill.active')?.getAttribute('data-time') || '7:00 PM';
      const seating = document.getElementById('reserveSeating')?.value || 'Main Dining Room';
      const name = document.getElementById('reserveName')?.value || 'Guest';

      const bookingRef = 'FIP-' + Math.floor(1000 + Math.random() * 9000);
      if (reserveSuccessMsg) {
        reserveSuccessMsg.style.display = 'block';
        reserveSuccessMsg.innerHTML = `
          <strong>🎉 Table Reserved for ${name}!</strong><br>
          Party of ${activeGuest} &bull; ${activeTime} &bull; ${seating}<br>
          <span style="color:#FAF9FB; font-weight:700;">Reference #${bookingRef}</span> &bull; Confirmation SMS sent.
        `;
      }
      document.getElementById('reserveName').value = '';
    });
  }

  // Initial dishes render
  renderHubDishes();
});
