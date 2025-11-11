const DATA_URL = 'data/products.json';
const STORAGE_KEYS = {
  cart: 'integrated-it-cart',
  cookieConsent: 'integrated-it-cookie-consent',
  newsletterClosed: 'integrated-it-newsletter-dismissed'
};

const state = {
  categories: [],
  products: [],
  cart: []
};

const formatCurrency = (value, currency = 'INR') => {
  if (!value || value === 0) {
    return 'Request Quote';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
};

const loadData = async () => {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error('Failed to load product data');
  }
  return response.json();
};

const loadCart = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.cart);
    if (stored) {
      state.cart = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Unable to load cart from storage', error);
  }
};

const persistCart = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state.cart));
  } catch (error) {
    console.error('Unable to persist cart', error);
  }
};

const createBadge = (badge) => {
  if (!badge) return '';
  const normalized = badge.toLowerCase();
  const className = normalized === 'refurbished'
    ? 'badge-refurbished'
    : normalized === 'open box'
      ? 'badge-open-box'
      : 'badge-new';
  return `<span class="badge ${className}">${badge}</span>`;
};

const toastQueue = [];
let toastVisible = false;

const showToast = (message) => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  toastQueue.push(message);

  if (!toastVisible) {
    displayNextToast(container);
  }
};

const displayNextToast = (container) => {
  if (toastQueue.length === 0) {
    toastVisible = false;
    return;
  }

  toastVisible = true;
  const message = toastQueue.shift();
  const toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.className = 'toast toast-enter text-sm font-medium text-white bg-slate-900/90 rounded-lg px-4 py-3 shadow-lg';
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-enter-active');
  });

  setTimeout(() => {
    toast.classList.remove('toast-enter-active');
    toast.classList.add('toast-leave');
    toast.classList.add('toast-leave-active');
    setTimeout(() => {
      toast.remove();
      displayNextToast(container);
    }, 300);
  }, 2400);
};

const addToCart = (productId) => {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const existing = state.cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ id: productId, quantity: 1 });
  }

  persistCart();
  updateMiniCart();
  showToast(`${product.name} added to cart.`);
};

const removeFromCart = (productId) => {
  state.cart = state.cart.filter((item) => item.id !== productId);
  persistCart();
  updateMiniCart();
  showToast('Item removed from cart.');
};

const updateQuantity = (productId, quantity) => {
  const item = state.cart.find((entry) => entry.id === productId);
  if (!item) return;
  item.quantity = Math.max(1, quantity);
  persistCart();
  updateMiniCart();
};

const calculateCartItems = () => state.cart.reduce((sum, item) => sum + item.quantity, 0);

const calculateCartValue = () => state.cart.reduce((total, item) => {
  const product = state.products.find((p) => p.id === item.id);
  if (!product || !product.price) return total;
  return total + product.price * item.quantity;
}, 0);

const toggleDrawer = (isOpen) => {
  const drawer = document.getElementById('mini-cart-drawer');
  const overlay = document.getElementById('mini-cart-overlay');
  if (!drawer || !overlay) return;

  if (isOpen) {
    drawer.classList.remove('drawer-closed');
    drawer.classList.add('drawer-open');
    overlay.classList.remove('hidden');
    overlay.classList.add('bg-slate-900/60');
    document.body.classList.add('overflow-hidden');
  } else {
    drawer.classList.remove('drawer-open');
    drawer.classList.add('drawer-closed');
    overlay.classList.add('hidden');
    overlay.classList.remove('bg-slate-900/60');
    document.body.classList.remove('overflow-hidden');
  }
};

const updateMiniCart = () => {
  const badge = document.querySelector('[data-cart-count]');
  const list = document.querySelector('[data-cart-items]');
  const totalEl = document.querySelector('[data-cart-total]');

  if (badge) {
    badge.textContent = calculateCartItems();
  }

  if (!list || !totalEl) return;

  list.innerHTML = '';

  if (state.cart.length === 0) {
    list.innerHTML = '<li class="text-sm text-slate-500">Your cart is empty. Add products to review them here.</li>';
    totalEl.textContent = '₹0';
    return;
  }

  state.cart.forEach((entry) => {
    const product = state.products.find((item) => item.id === entry.id);
    if (!product) return;

    const item = document.createElement('li');
    item.className = 'flex items-start justify-between gap-3 border-b border-slate-200 pb-3';
    item.innerHTML = `
      <div>
        <p class="text-sm font-semibold text-slate-900">${product.name}</p>
        <p class="text-xs text-slate-500">${product.condition} • ${product.brand}</p>
        <div class="mt-2 flex items-center gap-2">
          <label class="text-xs text-slate-500" for="qty-${product.id}">Qty</label>
          <input id="qty-${product.id}" type="number" min="1" value="${entry.quantity}" class="w-16 rounded border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm" data-qty-input="${product.id}" />
        </div>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-slate-900">${formatCurrency(product.price)}</p>
        <button type="button" class="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700" data-remove="${product.id}">Remove</button>
      </div>
    `;

    list.appendChild(item);
  });

  const totalValue = calculateCartValue();
  totalEl.textContent = state.cart.length === 0 ? "₹0" : (totalValue === 0 ? "Request Quote" : formatCurrency(totalValue));
};

const registerCartEvents = () => {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('[data-add-to-cart]')) {
      const { productId } = target.dataset;
      addToCart(productId);
    }

    if (target.matches('[data-remove]')) {
      const productId = target.getAttribute('data-remove');
      removeFromCart(productId);
    }

    if (target.matches('[data-open-cart]')) {
      toggleDrawer(true);
    }

    if (target.matches('[data-close-cart]')) {
      toggleDrawer(false);
    }

    if (target.matches('#mini-cart-overlay')) {
      toggleDrawer(false);
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.matches('[data-qty-input]')) {
      const productId = target.getAttribute('data-qty-input');
      updateQuantity(productId, Number(target.value));
    }
  });
};

const renderProductCard = (product) => {
  const image = product.images?.[0];
  const priceDisplay = product.price && product.price > 0
    ? formatCurrency(product.price, product.currency)
    : (product.priceLabel || 'Request Quote');
  return `
    <article class="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl focus-within:ring-2 focus-within:ring-blue-500">
      <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img src="${image?.src ?? ''}" alt="${image?.alt ?? product.name}" loading="lazy" width="${image?.width ?? 640}" height="${image?.height ?? 480}" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div class="absolute left-3 top-3 flex gap-2">${createBadge(product.badge)}</div>
      </div>
      <div class="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">${product.name}</h3>
          <p class="mt-1 text-sm text-slate-500">${product.shortDescription}</p>
        </div>
        <ul class="flex flex-wrap gap-2 text-xs text-slate-600">
          ${product.specs.slice(0, 4).map((spec) => `<li class="rounded-full bg-slate-100 px-3 py-1">${spec}</li>`).join('')}
        </ul>
        <div class="mt-auto flex items-center justify-between">
          <p class="text-base font-semibold text-slate-900">${priceDisplay}</p>
          <div class="flex gap-2">
            <a href="product.html?slug=${product.slug}" class="text-sm font-semibold text-blue-600 hover:text-blue-700">View</a>
            <button type="button" class="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full px-4 py-2" data-add-to-cart data-product-id="${product.id}">Add to Cart</button>
          </div>
        </div>
      </div>
    </article>
  `;
};

const renderSkeletonCards = (count = 6) => {
  return Array.from({ length: count })
    .map(() => `
      <div class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div class="skeleton aspect-[4/3]"></div>
        <div class="flex flex-col gap-3 p-6">
          <div class="skeleton h-5 w-3/4 rounded"></div>
          <div class="skeleton h-4 w-full rounded"></div>
          <div class="skeleton h-4 w-2/3 rounded"></div>
          <div class="skeleton h-10 w-full rounded"></div>
        </div>
      </div>
    `)
    .join('');
};

const populateHeroCategories = () => {
  const container = document.querySelector('[data-category-cards]');
  if (!container) return;
  container.innerHTML = state.categories
    .slice(0, 4)
    .map((category) => `
      <a href="category.html?slug=${category.id}" class="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
        <div>
          <p class="text-sm font-medium text-blue-600">${category.name}</p>
          <h3 class="mt-2 text-xl font-semibold text-slate-900">${category.description}</h3>
        </div>
        <p class="mt-4 text-sm text-slate-500">${category.heroCopy}</p>
        <span class="mt-6 inline-flex items-center text-sm font-semibold text-blue-600">Explore ${category.name}</span>
      </a>
    `)
    .join('');
};

const populateFeaturedProducts = () => {
  const container = document.querySelector('[data-featured-products]');
  if (!container) return;
  const featured = state.products.slice(0, 6);
  container.innerHTML = featured.map(renderProductCard).join('');
};

const buildItemListSchema = (products, categoryName) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryName} | Integrated IT Solution`,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${window.location.origin}/product/${product.slug}`,
      name: product.name
    }))
  };
};

const injectJsonLd = (schema) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
};

const setBreadcrumb = (items = []) => {
  const container = document.querySelector('[data-breadcrumb]');
  if (!container) return;
  container.innerHTML = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      const aria = isLast ? 'aria-current="page"' : '';
      const classes = isLast ? 'text-sm font-medium text-slate-900' : 'text-sm text-slate-500 hover:text-slate-700';
      return `<li class="flex items-center gap-2"><a href="${item.href}" class="${classes}" ${aria}>${item.label}</a>${!isLast ? '<span class="text-slate-400">/</span>' : ''}</li>`;
    })
    .join('');
};

const initializeCategoryPage = () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || 'laptops';
  const category = state.categories.find((cat) => cat.id === slug);
  const heading = document.querySelector('[data-category-name]');
  const description = document.querySelector('[data-category-description]');
  const grid = document.querySelector('[data-category-grid]');
  const filterForm = document.querySelector('[data-filter-form]');
  const pagination = document.querySelector('[data-pagination]');

  if (!category || !heading || !description || !grid || !filterForm) return;

  heading.textContent = category.name;
  description.textContent = category.heroCopy;

  const heroImage = document.querySelector('[data-category-hero-image]');
  if (heroImage) {
    heroImage.src = category.image.src;
    heroImage.alt = category.image.alt;
    heroImage.width = category.image.width;
    heroImage.height = category.image.height;
  }

  const categoryProducts = state.products.filter((product) => product.categoryId === slug);
  const brands = [...new Set(categoryProducts.map((product) => product.brand))];
  const cpus = [...new Set(categoryProducts.map((product) => product.specs.find((spec) => spec.toLowerCase().includes('intel') || spec.toLowerCase().includes('ryzen'))))].filter(Boolean);
  const rams = [...new Set(categoryProducts.map((product) => product.specs.find((spec) => spec.toLowerCase().includes('gb'))))].filter(Boolean);

  const brandSelect = filterForm.querySelector('[name="brand"]');
  const cpuSelect = filterForm.querySelector('[name="cpu"]');
  const ramSelect = filterForm.querySelector('[name="ram"]');
  const sortSelect = filterForm.querySelector('[name="sort"]');

  const populateSelect = (select, options) => {
    if (!select) return;
    select.innerHTML = '<option value="">All</option>' + options.map((value) => `<option value="${value}">${value}</option>`).join('');
  };

  populateSelect(brandSelect, brands);
  populateSelect(cpuSelect, cpus);
  populateSelect(ramSelect, rams);

  const PAGE_SIZE = 6;
  let currentPage = 1;

  const applyFilters = () => {
    const formData = new FormData(filterForm);
    const brand = formData.get('brand');
    const cpu = formData.get('cpu');
    const ram = formData.get('ram');
    const sort = formData.get('sort');

    let filtered = [...categoryProducts];

    if (brand) {
      filtered = filtered.filter((product) => product.brand === brand);
    }

    if (cpu) {
      filtered = filtered.filter((product) => product.specs.some((spec) => spec === cpu));
    }

    if (ram) {
      filtered = filtered.filter((product) => product.specs.some((spec) => spec === ram));
    }

    if (sort === 'price-asc') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'price-desc') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const paginated = filtered.slice(start, start + PAGE_SIZE);
    grid.innerHTML = paginated.map(renderProductCard).join('');

    pagination.innerHTML = `
      <div class="flex items-center justify-between text-sm text-slate-500">
        <span>Showing ${paginated.length} of ${filtered.length} products</span>
        <div class="flex items-center gap-2">
          <button type="button" class="px-3 py-1 rounded border border-slate-200 text-slate-600 disabled:opacity-50" ${currentPage === 1 ? 'disabled' : ''} data-page="prev">Prev</button>
          <span>Page ${currentPage} / ${totalPages}</span>
          <button type="button" class="px-3 py-1 rounded border border-slate-200 text-slate-600 disabled:opacity-50" ${currentPage === totalPages ? 'disabled' : ''} data-page="next">Next</button>
        </div>
      </div>
    `;

    injectJsonLd(buildItemListSchema(filtered, category.name));
  };

  filterForm.addEventListener('change', () => {
    currentPage = 1;
    applyFilters();
  });

  pagination.addEventListener('click', (event) => {
    const target = event.target;
    if (target.matches('[data-page="prev"]')) {
      currentPage = Math.max(1, currentPage - 1);
      applyFilters();
    }
    if (target.matches('[data-page="next"]')) {
      currentPage += 1;
      applyFilters();
    }
  });

  setBreadcrumb([
    { label: 'Home', href: 'index.html' },
    { label: 'Products', href: 'category.html?slug=' + slug },
    { label: category.name, href: '#' }
  ]);

  applyFilters();
};

const renderSpecTable = (product) => {
  const rows = product.specs.map((spec) => {
    const [label, value] = spec.includes(':') ? spec.split(':') : [spec.split(' ')[0], spec];
    return `<tr><th class="p-3 text-left text-sm text-slate-500">${label}</th><td class="p-3 text-sm text-slate-700">${value}</td></tr>`;
  }).join('');
  return `
    <table class="table-specs w-full text-left">
      <tbody>
        ${rows}
        <tr><th class="p-3 text-left text-sm text-slate-500">Warranty</th><td class="p-3 text-sm text-slate-700">${product.warranty}</td></tr>
        <tr><th class="p-3 text-left text-sm text-slate-500">Delivery</th><td class="p-3 text-sm text-slate-700">${product.shipping}</td></tr>
        <tr><th class="p-3 text-left text-sm text-slate-500">Returns</th><td class="p-3 text-sm text-slate-700">${product.returnPolicy}</td></tr>
      </tbody>
    </table>
  `;
};

const initializeProductPage = () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const product = state.products.find((item) => item.slug === slug) || state.products[0];
  if (!product) return;

  document.title = `${product.name} | Integrated IT Solution`;

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map((image) => image.src) ?? [],
    description: product.shortDescription,
    brand: product.brand,
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency || 'INR',
      price: product.price || 0,
      availability: 'https://schema.org/InStock'
    }
  };
  injectJsonLd(schema);

  const gallery = document.querySelector('[data-product-gallery]');
  const nameEl = document.querySelector('[data-product-name]');
  const description = document.querySelector('[data-product-description]');
  const price = document.querySelector('[data-product-price]');
  const specTable = document.querySelector('[data-product-specs]');
  const relatedContainer = document.querySelector('[data-related-products]');
  const stickyCta = document.querySelector('[data-sticky-cta]');

  if (gallery) {
    gallery.innerHTML = product.images.map((image) => `
      <img src="${image.src}" alt="${image.alt}" loading="lazy" width="${image.width}" height="${image.height}" class="h-full w-full rounded-3xl object-cover" />
    `).join('');
  }

  if (nameEl) {
    nameEl.textContent = product.name;
  }

  if (description) {
    description.textContent = product.shortDescription;
  }

  const priceDisplay = product.price && product.price > 0
    ? formatCurrency(product.price, product.currency)
    : (product.priceLabel || 'Request Quote');

  if (price) {
    price.textContent = priceDisplay;
  }

  if (specTable) {
    specTable.innerHTML = renderSpecTable(product);
  }

  const related = state.products.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 4);
  if (relatedContainer) {
    relatedContainer.innerHTML = related.map(renderProductCard).join('');
  }

  if (stickyCta) {
    stickyCta.querySelector('[data-sticky-price]').textContent = priceDisplay;
    stickyCta.querySelector('[data-add-to-cart]').setAttribute('data-product-id', product.id);
  }

  setBreadcrumb([
    { label: 'Home', href: 'index.html' },
    { label: 'Products', href: 'category.html?slug=' + product.categoryId },
    { label: product.name, href: '#' }
  ]);
};

const initializeNavigation = () => {
  const trigger = document.querySelector('[data-products-toggle]');
  const dropdown = document.querySelector('[data-products-dropdown]');
  if (!trigger || !dropdown) return;

  trigger.addEventListener('click', () => {
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target) && !trigger.contains(event.target)) {
      dropdown.classList.add('hidden');
    }
  });

  const list = dropdown.querySelector('ul');
  if (list) {
    list.innerHTML = state.categories
      .map((category) => `<li><a href="category.html?slug=${category.id}" class="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">${category.name}</a></li>`)
      .join('');
  }
};

const initializeNewsletterModal = () => {
  const modal = document.querySelector('[data-newsletter-modal]');
  const closeBtn = document.querySelector('[data-newsletter-close]');
  const form = document.querySelector('[data-newsletter-form]');
  if (!modal || !closeBtn || !form) return;

  const showModal = () => {
    if (localStorage.getItem(STORAGE_KEYS.newsletterClosed)) return;
    modal.setAttribute('aria-hidden', 'false');
  };

  setTimeout(showModal, 5000);

  const closeModal = () => {
    modal.setAttribute('aria-hidden', 'true');
    localStorage.setItem(STORAGE_KEYS.newsletterClosed, 'true');
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = form.querySelector('input[type="email"]').value;
    if (!email) {
      showToast('Enter a valid email to subscribe.');
      return;
    }
    showToast('Thanks for subscribing to Integrated IT Solution updates.');
    closeModal();
    form.reset();
  });
};

const initializeCookieNotice = () => {
  const banner = document.querySelector('[data-cookie-banner]');
  const acceptBtn = document.querySelector('[data-cookie-accept]');
  if (!banner || !acceptBtn) return;

  if (localStorage.getItem(STORAGE_KEYS.cookieConsent)) {
    banner.classList.add('hidden');
    return;
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEYS.cookieConsent, 'true');
    banner.classList.add('hidden');
  });
};

const initializeForms = () => {
  const forms = document.querySelectorAll('form[data-validate]');
  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      const inputs = Array.from(form.querySelectorAll('[required]'));
      const invalid = inputs.some((input) => !input.value || (input.type === 'email' && !input.value.includes('@')));
      if (invalid) {
        event.preventDefault();
        showToast('Please fill in all required fields.');
        return;
      }

      event.preventDefault();
      showToast('Thanks for reaching out. Our team will contact you soon.');
      form.reset();
    });
  });
};

const initializeContactPage = () => {
  setBreadcrumb([
    { label: 'Home', href: 'index.html' },
    { label: 'Contact', href: 'contact.html' }
  ]);
};

const initializeAboutPage = () => {
  setBreadcrumb([
    { label: 'Home', href: 'index.html' },
    { label: 'About', href: 'about.html' }
  ]);
};

const initializePoliciesPage = (type) => {
  setBreadcrumb([
    { label: 'Home', href: 'index.html' },
    { label: 'Policies', href: type === 'terms' ? 'terms.html' : 'returns.html' }
  ]);
};

const initializeHomePage = () => {
  populateHeroCategories();
  populateFeaturedProducts();
};

const initializeSolutionsHighlights = () => {
  const container = document.querySelector('[data-solutions-grid]');
  if (!container) return;
  const solutions = [
    {
      title: 'Hardware Solutions',
      copy: 'From laptops to enterprise servers, every system is QC checked and deployment ready.',
      link: 'category.html?slug=laptops'
    },
    {
      title: 'Software & Licensing',
      copy: 'Windows, Microsoft 365, security suites, and business apps with compliance support.',
      link: '#software'
    },
    {
      title: 'Networking & Infrastructure',
      copy: 'Design, cabling, and secure network build-outs tailored to your sites.',
      link: '#networking'
    },
    {
      title: 'Cloud & Data Services',
      copy: 'Migration, backup, and managed cloud operations handled by certified engineers.',
      link: '#cloud'
    },
    {
      title: 'Maintenance & AMC',
      copy: 'Onsite and remote support to keep your IT running without downtime.',
      link: '#maintenance'
    },
    {
      title: 'Consulting & Custom Solutions',
      copy: 'Workspace rollouts and transformation roadmaps crafted for business outcomes.',
      link: '#consulting'
    }
  ];

  container.innerHTML = solutions
    .map((solution) => `
      <article class="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
        <h3 class="text-lg font-semibold text-slate-900">${solution.title}</h3>
        <p class="mt-3 text-sm text-slate-600">${solution.copy}</p>
        <a href="${solution.link}" class="mt-4 text-sm font-semibold text-blue-600">Learn More</a>
      </article>
    `)
    .join('');
};

const initPage = () => {
  const page = document.body.dataset.page;

  loadCart();
  updateMiniCart();
  registerCartEvents();
  initializeNavigation();
  initializeNewsletterModal();
  initializeCookieNotice();
  initializeForms();

  switch (page) {
    case 'home':
      initializeHomePage();
      initializeSolutionsHighlights();
      break;
    case 'category':
      initializeCategoryPage();
      break;
    case 'product':
      initializeProductPage();
      break;
    case 'about':
      initializeAboutPage();
      initializeSolutionsHighlights();
      break;
    case 'contact':
      initializeContactPage();
      break;
    case 'terms':
      initializePoliciesPage('terms');
      break;
    case 'returns':
      initializePoliciesPage('returns');
      break;
    default:
      break;
  }
};

const bootstrap = async () => {
  const productGrids = document.querySelectorAll('[data-grid-skeleton]');
  productGrids.forEach((grid) => {
    grid.innerHTML = renderSkeletonCards();
  });

  try {
    const data = await loadData();
    state.categories = data.categories;
    state.products = data.products;
    initPage();
  } catch (error) {
    console.error(error);
    showToast('Unable to load product listings. Please try again.');
  }
};

document.addEventListener('DOMContentLoaded', bootstrap);
