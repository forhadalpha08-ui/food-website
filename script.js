/**
 * FipPzo - Good Food. Great Mood.
 * 120fps Canvas Video Scrubbing Engine + Interactive Menu & Audio System
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const canvas = document.getElementById('scrollCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
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

    // Header scroll background
    if (navbar) {
      if (scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
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
    if (cartCountBadge) {
      if (cart.length > 0) {
        cartCountBadge.style.display = 'inline-flex';
        cartCountBadge.textContent = cart.length;
      } else {
        cartCountBadge.style.display = 'none';
      }
    }

    if (!cartItemsList) return;
    if (cart.length === 0) {
      cartItemsList.innerHTML = '<p style="color:#9ca3af; text-align:center; padding:1.5rem 0;">Your cart is empty. Pick a burger from our signature menu!</p>';
      if (cartTotalVal) cartTotalVal.textContent = '$0.00';
      return;
    }

    let total = 0;
    cartItemsList.innerHTML = cart.map((item, idx) => {
      total += item.price;
      return `
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
      `;
    }).join('');

    if (cartTotalVal) cartTotalVal.textContent = `$${total.toFixed(2)}`;
  }

  window.removeCartItem = function(idx) {
    cart.splice(idx, 1);
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
});
