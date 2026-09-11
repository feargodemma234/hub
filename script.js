// ===============================
// MARKET HUB — SCRIPT.JS
// PART 1: PRODUCTS + CATEGORIES
// ===============================

const products = [];

const categories = [
  ['all','▦'],
  ['electronics','▱'],
  ['fashion','♢'],
  ['home','⌂'],
  ['beauty','◈'],
  ['sports','◉'],
  ['books','▤'],
  ['vehicles','▰'],
  ['other','•••']
];

const plans = [
  ['Starter',5,10,'Perfect for getting started.'],
  ['Business',15,50,'For growing sellers.'],
  ['Pro',30,200,'For serious sellers.']
];

let cart = [];
let selectedCategory = 'all';

const money = n => `$${Number(n || 0).toFixed(2)}`;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[c]));
}

function renderCategories() {
  const box = document.getElementById('categories');
  if (!box) return;

  box.innerHTML = categories.map((c,i) => `
    <button
      class="category ${i === 0 ? 'active' : ''}"
      data-cat="${c[0]}"
    >
      <span>${c[1]}</span>
      ${c[0][0].toUpperCase() + c[0].slice(1)}
    </button>
  `).join('');
}

function productVisual(p) {
  if (p.image_url) {
    return `
      <img
        src="${esc(p.image_url)}"
        alt="${esc(p.name)}"
        loading="lazy"
      >
    `;
  }

  return `<span>${p.icon || '🛍️'}</span>`;
}

function renderProducts(list = products) {
  const box = document.getElementById('products');
  if (!box) return;

  if (!list.length) {
    box.innerHTML = `
      <div class="empty-products">
        <div>🛍️</div>
        <h3>No products yet</h3>
        <p>
          Products posted by approved sellers will appear here.
        </p>
      </div>
    `;
    return;
  }

  box.innerHTML = list.map(p => `
    <article class="product" data-product-id="${p.id}">

      <button
        class="product-click"
        data-product="${p.id}"
        aria-label="View ${esc(p.name)}"
      >
        <div class="product-img">
          ${productVisual(p)}
        </div>

        <div class="product-body">
          <span class="tag">
            ${esc(p.category || 'other')}
          </span>

          <h3>${esc(p.name)}</h3>

          <div class="price">
            ${money(p.price)}
          </div>
        </div>
      </button>

      <div class="product-actions">

        <button
          class="secondary details"
          data-product="${p.id}"
        >
          View Details
        </button>

        <button
          class="primary add"
          data-id="${p.id}"
        >
          Add to Cart
        </button>

      </div>

    </article>
  `).join('');
}

function getProduct(id) {
  return products.find(
    p => String(p.id) === String(id)
  );
}

function openProduct(id) {
  const p = getProduct(id);
  if (!p) return;

  const stock = Number(p.stock ?? 0);

  const detail = document.getElementById('productDetail');
  if (!detail) return;

  detail.innerHTML = `
    <div class="product-detail-grid">

      <div class="product-detail-image">
        ${productVisual(p)}
      </div>

      <div class="product-detail-info">

        <span class="tag">
          ${esc(p.category || 'other')}
        </span>

        <h2>${esc(p.name)}</h2>

        <div class="detail-price">
          ${money(p.price)}
        </div>

        <p class="detail-description">
          ${esc(
            p.description ||
            'No description provided.'
          )}
        </p>

        <div class="detail-meta">
          <span>
            📦 ${
              stock > 0
                ? `${stock} in stock`
                : 'Out of stock'
            }
          </span>

          <span>
            🛍️ MarketHub seller
          </span>
        </div>

        <div class="detail-actions">

          <button
            class="primary full add-detail"
            data-id="${p.id}"
            ${stock === 0 ? 'disabled' : ''}
          >
            ${
              stock === 0
                ? 'Out of Stock'
                : 'Add to Cart'
            }
          </button>

        </div>

      </div>

    </div>
  `;

  const modal = document.getElementById('productModal');

  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
  }
}// ===============================
// PART 2: SUPABASE + CART
// ===============================

async function loadApprovedProducts() {

  const box = document.getElementById('products');

  // Start completely empty.
  products.splice(0, products.length);

  if (box) {
    box.innerHTML = `
      <div class="empty-products">
        <div>⏳</div>
        <h3>Loading products...</h3>
        <p>Checking MarketHub for approved listings.</p>
      </div>
    `;
  }

  if (
    typeof supabaseClient === 'undefined' ||
    !supabaseClient
  ) {
    if (box) {
      box.innerHTML = `
        <div class="empty-products">
          <div>🛍️</div>
          <h3>No products yet</h3>
          <p>
            Products posted by approved sellers will appear here.
          </p>
        </div>
      `;
    }
    return;
  }

  try {

    const { data, error } =
      await supabaseClient
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category,
          image_url,
          stock,
          created_at
        `)
        .eq('active', true)
        .eq('approval_status', 'approved')
        .order('created_at', {
          ascending: false
        });

    if (error) throw error;

    if (data && data.length) {

      products.push(
        ...data.map(p => ({
          ...p,
          price: Number(p.price) || 0,
          stock: Number(p.stock ?? 0),
          icon: '🛍️'
        }))
      );

    }

    renderProducts();

  } catch (err) {

    console.warn(
      'Public products could not be loaded:',
      err.message
    );

    if (box) {
      box.innerHTML = `
        <div class="empty-products">
          <div>⚠️</div>
          <h3>Products unavailable</h3>
          <p>
            We could not load the marketplace products.
          </p>
        </div>
      `;
    }
  }
}

function renderPlans() {

  const box = document.getElementById('plans');
  if (!box) return;

  box.innerHTML = plans.map((p,i) => `

    <article class="plan ${i === 1 ? 'popular' : ''}">

      ${
        i === 1
          ? '<span class="tag">MOST POPULAR</span>'
          : ''
      }

      <h3>${p[0]}</h3>

      <div class="plan-price">
        $${p[1]}
        <small>/month</small>
      </div>

      <p>${p[3]}</p>

      <p>✓ ${p[2]} product listings</p>
      <p>✓ Seller dashboard</p>
      <p>✓ Product management</p>

      <button
        type="button"
        class="primary choose"
        data-plan="${p[0]}"
      >
        Choose ${p[0]}
      </button>

    </article>

  `).join('');
}

function save() {

  localStorage.setItem(
    'mh_cart',
    JSON.stringify(cart)
  );

  const count = cart.reduce(
    (total,item) => total + item.qty,
    0
  );

  const cartCount =
    document.getElementById('cartCount');

  const mobileCartCount =
    document.getElementById('mobileCartCount');

  if (cartCount)
    cartCount.textContent = count;

  if (mobileCartCount)
    mobileCartCount.textContent = count;
}

function add(id) {

  const p = getProduct(id);

  if (!p) return;

  const stock = Number(p.stock ?? 0);

  if (stock <= 0) {
    alert('This product is out of stock.');
    return;
  }

  const existing =
    cart.find(x => String(x.id) === String(p.id));

  if (existing) {

    if (existing.qty >= stock) {
      alert('You cannot add more than the available stock.');
      return;
    }

    existing.qty++;

  } else {

    cart.push({
      ...p,
      qty: 1
    });

  }

  save();
}

function openCart() {

  const items =
    document.getElementById('cartItems');

  const total =
    document.getElementById('cartTotal');

  if (!items || !total) return;

  if (!cart.length) {

    items.innerHTML = `
      <div class="empty">
        Your cart is empty.
      </div>
    `;

  } else {

    items.innerHTML = cart.map(x => `
      <div class="cart-row">

        <span>
          ${x.icon || '🛍️'}
          ${esc(x.name)}
          × ${x.qty}
        </span>

        <b>
          ${money(
            Number(x.price) * x.qty
          )}
        </b>

      </div>
    `).join('');
  }

  const cartTotal =
    cart.reduce(
      (sum,item) =>
        sum +
        Number(item.price || 0) * item.qty,
      0
    );

  total.textContent = money(cartTotal);

  const modal =
    document.getElementById('cartModal');

  if (modal)
    modal.classList.add('show');
}

function filter(cat) {

  selectedCategory = cat;

  document
    .querySelectorAll('.category')
    .forEach(x => {
      x.classList.toggle(
        'active',
        x.dataset.cat === cat
      );
    });

  const filtered =
    cat === 'all'
      ? products
      : products.filter(
          p => p.category === cat
        );

  renderProducts(filtered);

  const explore =
    document.getElementById('explore');

  if (explore) {
    explore.scrollIntoView({
      behavior: 'smooth'
    });
  }
}// ===============================
// PART 3: AUTH + SELLER PAYMENT
// + ADMIN
// ===============================

function auth(mode) {

  const title =
    document.getElementById('authTitle');

  const message =
    document.getElementById('authMessage');

  const modal =
    document.getElementById('authModal');

  const form =
    document.getElementById('authForm');

  if (title) {
    title.textContent =
      mode === 'login'
        ? 'Log In'
        : 'Create Account';
  }

  if (message)
    message.textContent = '';

  if (form)
    form.dataset.mode = mode;

  if (modal)
    modal.classList.add('show');
}

const ADMIN_EMAIL =
  'marketsaleofficial@gmail.com';

async function isAdminUser() {

  if (
    typeof supabaseClient === 'undefined' ||
    !supabaseClient
  ) {
    return false;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  return !!user &&
    user.email?.toLowerCase() ===
    ADMIN_EMAIL;
}

let selectedPlan = null;

const PLAN_PRICES = {
  Starter: 5,
  Business: 15,
  Pro: 30
};

const PAYMENT_ADDRESS =
  'TRzfCcrUmc212VLEYNYVRKtSuYQSnaiU6T';

function openPayment(plan) {

  if (!PLAN_PRICES[plan]) return;

  selectedPlan = plan;

  const modal =
    document.getElementById('paymentModal');

  const title =
    document.getElementById('paymentTitle');

  const description =
    document.getElementById('paymentDescription');

  const tx =
    document.getElementById('paymentTx');

  const message =
    document.getElementById('paymentMessage');

  if (title) {
    title.textContent =
      `${plan} Plan — $${PLAN_PRICES[plan]}/month`;
  }

  if (description) {
    description.textContent =
      `Send $${PLAN_PRICES[plan]} in USDT on TRC20 to the address below. Then enter your transaction hash for admin review.`;
  }

  if (tx)
    tx.value = '';

  if (message)
    message.textContent = '';

  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
  }
}

async function submitSubscriptionPayment() {

  const msg =
    document.getElementById('paymentMessage');

  const txInput =
    document.getElementById('paymentTx');

  const tx =
    txInput?.value.trim();

  if (!selectedPlan) return;

  if (!tx) {
    msg.textContent =
      'Enter your transaction hash first.';
    return;
  }

  if (
    typeof supabaseClient === 'undefined' ||
    !supabaseClient
  ) {
    msg.textContent =
      'Supabase is not connected.';
    return;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    msg.textContent =
      'Please log in before submitting a seller payment.';

    auth('login');
    return;
  }

  // Make sure profile exists.
  const {
    data: profile,
    error: profileReadError
  } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileReadError) {

    msg.textContent =
      'Could not check your account profile: ' +
      profileReadError.message;

    return;
  }

  if (!profile) {

    const {
      error: profileInsertError
    } = await supabaseClient
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        role: 'buyer'
      });

    if (
      profileInsertError &&
      profileInsertError.code !== '23505'
    ) {

      msg.textContent =
        'Could not create your seller profile: ' +
        profileInsertError.message;

      return;
    }
  }

  const { error } =
    await supabaseClient
      .from('subscriptions')
      .insert({
        seller_id: user.id,
        plan: selectedPlan,
        amount: PLAN_PRICES[selectedPlan],
        crypto: 'USDT',
        network: 'TRC20',
        tx_hash: tx,
        status: 'pending'
      });

  if (error) {

    msg.textContent =
      'Could not submit payment: ' +
      error.message;

    return;
  }

  msg.textContent =
    'Payment submitted successfully. The admin will review your transaction.';

  txInput.value = '';
}

async function openAdmin() {

  if (
    typeof supabaseClient === 'undefined' ||
    !supabaseClient
  ) {
    alert('Supabase is not connected.');
    return;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) {

    alert(
      'Please log in with the admin account first.'
    );

    auth('login');
    return;
  }

  if (
    user.email?.toLowerCase() !==
    ADMIN_EMAIL
  ) {
    alert(
      'Admin access is restricted to the MarketHub admin account.'
    );
    return;
  }

  const modal =
    document.getElementById('adminModal');

  if (modal)
    modal.classList.add('show');

  await loadPendingPosts();
}

async function loadPendingPosts() {

  const box =
    document.getElementById('pendingPosts');

  const status =
    document.getElementById('adminStatus');

  if (!box) return;

  box.innerHTML =
    '<p class="empty">Loading pending posts...</p>';

  if (status)
    status.textContent = '';

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        category,
        image_url,
        stock,
        approval_status,
        created_at,
        seller_id
      `)
      .eq('approval_status', 'pending')
      .order('created_at', {
        ascending: false
      });

    if (error) throw error;

    if (status)
      status.textContent =
        `${data.length} pending`;

    if (!data.length) {

      box.innerHTML =
        '<p class="empty">No pending posts.</p>';

      return;
    }

    box.innerHTML = data.map(p => `
      <article class="pending-post">

        <div class="pending-post-main">

          <div class="pending-post-image">
            ${
              p.image_url
                ? `<img src="${esc(p.image_url)}" alt="">`
                : '🛍️'
            }
          </div>

          <div>

            <h3>${esc(p.name)}</h3>

            <p>
              ${esc(
                p.description ||
                'No description provided.'
              )}
            </p>

            <small>
              Category:
              ${esc(p.category || 'Other')}
              · Price:
              ${money(Number(p.price) || 0)}
              · Stock:
              ${esc(p.stock ?? 0)}
            </small>

            <small>
              Seller:
              ${esc(p.seller_id || 'Unknown')}
            </small>

          </div>

        </div>

        <div class="pending-actions">

          <button
            class="primary approve-post"
            data-id="${p.id}"
          >
            ✓ Approve
          </button>

          <button
            class="secondary reject-post"
            data-id="${p.id}"
          >
            ✕ Reject
          </button>

        </div>

      </article>
    `).join('');

  } catch (err) {

    box.innerHTML = `
      <p class="empty">
        Could not load pending posts:
        ${esc(err.message)}
      </p>
    `;

    if (status)
      status.textContent = 'Error';
  }
}

async function moderatePost(id, statusValue) {

  if (!(await isAdminUser())) {

    alert('Admin access required.');
    return;
  }

  const patch =
    statusValue === 'approved'
      ? {
          approval_status: 'approved',
          active: true
        }
      : {
          approval_status: 'rejected',
          active: false
        };

  const { error } =
    await supabaseClient
      .from('products')
      .update(patch)
      .eq('id', id);

  if (error) {

    alert(
      'Could not update post: ' +
      error.message
    );

    return;
  }

  await loadPendingPosts();

  alert(
    statusValue === 'approved'
      ? 'Post approved.'
      : 'Post rejected.'
  );

  // Refresh public products after approval.
  await loadApprovedProducts();
}// ===============================
// PART 4: MODALS + SEARCH
// + MOBILE MENU + STARTUP
// ===============================

function closeModal(modal) {

  if (!modal) return;

  modal.classList.remove('show');
  modal.style.display = 'none';

  setTimeout(() => {

    if (!modal.classList.contains('show')) {
      modal.style.removeProperty('display');
    }

  }, 0);
}


// --------------------------------
// GLOBAL CLICK HANDLER
// --------------------------------

document.addEventListener('click', e => {

  // Close buttons
  const closeBtn =
    e.target.closest('.close');

  if (closeBtn) {

    e.preventDefault();
    e.stopPropagation();

    const modalId =
      closeBtn.dataset.close;

    closeModal(
      modalId
        ? document.getElementById(modalId)
        : closeBtn.closest('.modal')
    );

    return;
  }


  // Click outside modal
  if (
    e.target.classList.contains('modal')
  ) {

    closeModal(e.target);
    return;
  }


  // Cart
  if (
    e.target.closest('#cartOpen')
  ) {
    openCart();
    return;
  }


  // Product details
  const productButton =
    e.target.closest('[data-product]');

  if (productButton) {

    e.preventDefault();

    openProduct(
      productButton.dataset.product
    );

    return;
  }


  // Add from product page
  const addDetail =
    e.target.closest('.add-detail');

  if (addDetail) {

    add(addDetail.dataset.id);

    closeModal(
      document.getElementById('productModal')
    );

    return;
  }


  // Add to cart
  const addButton =
    e.target.closest('.add');

  if (addButton) {

    add(addButton.dataset.id);
    return;
  }


  // Categories
  const category =
    e.target.closest('.category');

  if (category) {

    filter(category.dataset.cat);
    return;
  }


  // Login
  if (
    e.target.closest('#accountOpen') ||
    e.target.closest('#login')
  ) {

    auth('login');
    return;
  }


  // Signup
  if (
    e.target.closest('#signup')
  ) {

    auth('signup');
    return;
  }


  // Copy crypto address
  if (
    e.target.closest('#copyAddress')
  ) {

    const address =
      document.getElementById(
        'cryptoAddress'
      )?.textContent.trim();

    if (address) {

      navigator.clipboard
        ?.writeText(address);

      e.target.textContent =
        'Copied!';

      setTimeout(() => {
        e.target.textContent =
          'Copy address';
      }, 1200);
    }
  }

});


// --------------------------------
// SEARCH
// --------------------------------

const searchForm =
  document.getElementById(
    'searchForm'
  );

if (searchForm) {

  searchForm.addEventListener(
    'submit',
    e => {

      e.preventDefault();

      const input =
        document.getElementById(
          'searchInput'
        );

      const q =
        input?.value
          .toLowerCase()
          .trim() || '';

      const results =
        q
          ? products.filter(p =>
              (
                `${p.name} ${p.category} ${p.description || ''}`
              )
                .toLowerCase()
                .includes(q)
            )
          : products;

      renderProducts(results);

      document
        .getElementById('explore')
        ?.scrollIntoView({
          behavior: 'smooth'
        });

    }
  );
}


// Top search button
const searchTop =
  document.getElementById(
    'searchTop'
  );

if (searchTop) {

  searchTop.onclick = () => {

    document
      .getElementById('searchInput')
      ?.focus();

  };
}


// --------------------------------
// MOBILE MENU
// --------------------------------

const menuOpen =
  document.getElementById(
    'menuOpen'
  );

const mobileMenu =
  document.getElementById(
    'mobileMenu'
  );

const menuClose =
  document.getElementById(
    'menuClose'
  );

function closeMobileMenu() {

  if (!mobileMenu) return;

  mobileMenu.classList.remove(
    'show'
  );

  mobileMenu.setAttribute(
    'aria-hidden',
    'true'
  );

  menuOpen?.setAttribute(
    'aria-expanded',
    'false'
  );
}

if (menuOpen) {

  menuOpen.onclick = () => {

    const open =
      !mobileMenu.classList.contains(
        'show'
      );

    mobileMenu.classList.toggle(
      'show',
      open
    );

    mobileMenu.setAttribute(
      'aria-hidden',
      String(!open)
    );

    menuOpen.setAttribute(
      'aria-expanded',
      String(open)
    );

  };
}

if (menuClose) {
  menuClose.onclick =
    closeMobileMenu;
}

document
  .querySelectorAll(
    '[data-menu-link]'
  )
  .forEach(link => {

    link.addEventListener(
      'click',
      closeMobileMenu
    );

  });

const mobileCart =
  document.getElementById(
    'mobileCart'
  );

if (mobileCart) {

  mobileCart.onclick = () => {

    closeMobileMenu();
    openCart();

  };
}

const mobileAdmin =
  document.getElementById(
    'mobileAdmin'
  );

if (mobileAdmin) {

  mobileAdmin.onclick =
    async () => {

      closeMobileMenu();
      await openAdmin();

    };
}

if (mobileMenu) {

  mobileMenu.addEventListener(
    'click',
    e => {

      if (
        e.target === mobileMenu
      ) {
        closeMobileMenu();
      }

    }
  );
}

window.addEventListener(
  'keydown',
  e => {

    if (e.key === 'Escape') {
      closeMobileMenu();
    }

  }
);


// --------------------------------
// AUTH FORM
// --------------------------------

const authForm =
  document.getElementById(
    'authForm'
  );

if (authForm) {

  authForm.addEventListener(
    'submit',
    async e => {

      e.preventDefault();

      const msg =
        document.getElementById(
          'authMessage'
        );

      const email =
        document.getElementById(
          'authEmail'
        )?.value.trim();

      const password =
        document.getElementById(
          'authPassword'
        )?.value;

      try {

        if (
          typeof supabaseClient ===
            'undefined' ||
          !supabaseClient
        ) {

          msg.textContent =
            typeof supabaseConfigError !==
              'undefined' &&
            supabaseConfigError
              ? 'Supabase connection error: ' +
                supabaseConfigError
              : 'Supabase is not configured.';

          return;
        }

        const mode =
          authForm.dataset.mode;

        const result =
          mode === 'login'
            ? await supabaseClient.auth
                .signInWithPassword({
                  email,
                  password
                })
            : await supabaseClient.auth
                .signUp({
                  email,
                  password
                });

        if (result.error)
          throw result.error;

        msg.textContent =
          'Success. Check your email if confirmation is enabled.';

      } catch (err) {

        msg.textContent =
          err.message;

      }

    }
  );
}


// --------------------------------
// CHECKOUT BUTTON
// --------------------------------

const checkout =
  document.getElementById(
    'checkout'
  );

if (checkout) {

  checkout.onclick = () => {
    openCart();
  };
}


// --------------------------------
// INITIAL LOAD
// --------------------------------

renderCategories();

renderProducts();

renderPlans();

save();

loadApprovedProducts();


// --------------------------------
// SELLER PLAN BUTTONS
// --------------------------------

document
  .querySelectorAll('.choose')
  .forEach(btn => {

    btn.addEventListener(
      'click',
      () => {

        openPayment(
          btn.dataset.plan
        );

      }
    );

  });


// --------------------------------
// ADMIN REFRESH
// --------------------------------

const refreshPending =
  document.getElementById(
    'refreshPending'
  );

if (refreshPending) {

  refreshPending.onclick =
    loadPendingPosts;
}


// --------------------------------
// PAYMENT SUBMIT
// --------------------------------

const submitPayment =
  document.getElementById(
    'submitPayment'
  );

if (submitPayment) {

  submitPayment.onclick =
    submitSubscriptionPayment;
}


// --------------------------------
// PAYMENT ADDRESS COPY
// --------------------------------

const paymentCopy =
  document.getElementById(
    'paymentCopy'
  );

if (paymentCopy) {

  paymentCopy.onclick =
    async () => {

      try {

        await navigator.clipboard
          .writeText(PAYMENT_ADDRESS);

        paymentCopy.textContent =
          'Copied!';

        setTimeout(() => {

          paymentCopy.textContent =
            'Copy address';

        }, 1200);

      } catch (e) {}

    };
}


// --------------------------------
// APPROVE / REJECT POSTS
// --------------------------------

document.addEventListener(
  'click',
  e => {

    const approve =
      e.target.closest(
        '.approve-post'
      );

    const reject =
      e.target.closest(
        '.reject-post'
      );

    if (approve) {

      moderatePost(
        approve.dataset.id,
        'approved'
      );

    }

    if (reject) {

      moderatePost(
        reject.dataset.id,
        'rejected'
      );

    }

  }
)// ===============================
// ACCOUNT STATE
// ===============================

async function getCurrentUser() {

  if (
    typeof supabaseClient === 'undefined' ||
    !supabaseClient
  ) {
    return null;
  }

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  return user || null;
}


async function ensureProfile(user) {

  if (!user || !supabaseClient) return;

  const {
    data,
    error
  } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.warn(
      'Profile check failed:',
      error.message
    );
    return;
  }

  if (!data) {

    const { error: insertError } =
      await supabaseClient
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          role: 'buyer'
        });

    if (
      insertError &&
      insertError.code !== '23505'
    ) {
      console.warn(
        'Profile creation failed:',
        insertError.message
      );
    }
  }
}


// ===============================
// UPDATE ACCOUNT UI
// ===============================

async function updateAccountUI() {

  currentUser =
    await getCurrentUser();

  const label =
    document.getElementById(
      'accountLabel'
    );

  const email =
    document.getElementById(
      'accountEmail'
    );

  const status =
    document.getElementById(
      'accountStatus'
    );

  const login =
    document.getElementById(
      'accountLogin'
    );

  const signup =
    document.getElementById(
      'accountSignup'
    );

  const logout =
    document.getElementById(
      'accountLogout'
    );

  const store =
    document.getElementById(
      'accountStore'
    );

  if (!currentUser) {

    if (label)
      label.textContent = 'Account';

    if (email)
      email.textContent = 'Not logged in';

    if (status)
      status.textContent =
        'Log in to manage your account';

    if (login)
      login.style.display = 'flex';

    if (signup)
      signup.style.display = 'flex';

    if (logout)
      logout.style.display = 'none';

    if (store)
      store.style.display = 'none';

    return;
  }


  await ensureProfile(currentUser);

  if (label)
    label.textContent = 'Account';

  if (email)
    email.textContent =
      currentUser.email || 'Account';

  if (status)
    status.textContent =
      'MarketHub account';

  if (login)
    login.style.display = 'none';

  if (signup)
    signup.style.display = 'none';

  if (logout)
    logout.style.display = 'flex';

  if (store)
    store.style.display = 'flex';

  await updateStorePreview();
}


// ===============================
// STORE PRODUCT COUNTS
// ===============================

async function getStoreStats() {

  if (!currentUser || !supabaseClient) {

    return {
      total: 0,
      approved: 0,
      pending: 0
    };

  }

  const {
    data,
    error
  } = await supabaseClient
    .from('products')
    .select(
      'id, approval_status',
      { count: 'exact' }
    )
    .eq(
      'seller_id',
      currentUser.id
    );

  if (error) {

    console.warn(
      'Could not load store:',
      error.message
    );

    return {
      total: 0,
      approved: 0,
      pending: 0,
      error: error.message
    };
  }

  const rows = data || [];

  return {
    total: rows.length,

    approved:
      rows.filter(
        p =>
          p.approval_status ===
          'approved'
      ).length,

    pending:
      rows.filter(
        p =>
          p.approval_status ===
          'pending'
      ).length
  };
}


async function updateStorePreview() {

  const preview =
    document.getElementById(
      'storeProductPreview'
    );

  if (!preview || !currentUser)
    return;

  const stats =
    await getStoreStats();

  preview.textContent =
    `${stats.total} product${
      stats.total === 1 ? '' : 's'
    } posted`;
}


// ===============================
// OPEN MY STORE
// ===============================

async function openMyStore() {

  if (!currentUser) {

    closeAccountDropdown();
    auth('login');

    return;
  }

  const modal =
    document.getElementById(
      'storeModal'
    );

  const email =
    document.getElementById(
      'storeEmail'
    );

  const total =
    document.getElementById(
      'storeProductCount'
    );

  const approved =
    document.getElementById(
      'storeApprovedCount'
    );

  const pending =
    document.getElementById(
      'storePendingCount'
    );

  const message =
    document.getElementById(
      'storeMessage'
    );

  if (email) {
    email.textContent =
      currentUser.email || '';
  }

  if (message) {
    message.textContent =
      'Loading your store...';
  }

  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
  }

  const stats =
    await getStoreStats();

  if (total)
    total.textContent =
      stats.total;

  if (approved)
    approved.textContent =
      stats.approved;

  if (pending)
    pending.textContent =
      stats.pending;

  if (message) {

    if (stats.error) {

      message.textContent =
        'Could not load your store: ' +
        stats.error;

    } else {

      message.textContent =
        'Your product statistics are up to date.';
    }
  }
};