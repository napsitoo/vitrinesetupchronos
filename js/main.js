// --- ÉTAT GLOBAL ---
let cart = JSON.parse(localStorage.getItem('apex_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('apex_user')) || null;

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Loader
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    }, 1200);

    // 2. Navbar Scroll & Mobile
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    const burger = document.getElementById('navBurger');
    const navMobile = document.getElementById('navMobile');
    if (burger) {
        burger.addEventListener('click', () => {
            navMobile.classList.toggle('open');
        });
    }

    // 3. Maj globale
    updateCartBadge();
    updateNavLoginState();

    // 4. Routage rudimentaire selon la page
    if (document.getElementById('featuredSetups')) renderFeatured();
    if (document.getElementById('shopGrid')) initShop();
    if (document.getElementById('cartItems')) initCart();
    if (document.getElementById('accountDashboard')) initAccount();
});

// --- PANIER ---
function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    // Évite les doublons
    if (!cart.some(item => item.id === productId)) {
        cart.push(product);
        localStorage.setItem('apex_cart', JSON.stringify(cart));
        updateCartBadge();
        showToast(`Ajouté : ${product.car}`, 'success');
    } else {
        showToast('Ce setup est déjà dans ton panier.', 'error');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('apex_cart', JSON.stringify(cart));
    updateCartBadge();
    if (document.getElementById('cartItems')) initCart();
}

function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-count');
    badges.forEach(b => {
        b.textContent = cart.length;
        if (cart.length > 0) b.classList.add('show');
        else b.classList.remove('show');
    });
}

function clearCart() {
    cart = [];
    localStorage.removeItem('apex_cart');
    updateCartBadge();
}

// --- RENDU PRODUITS (COMPOSANT HTML) ---
function createProductCard(product) {
    return `
    <div class="setup-card ${product.game}">
        <div class="setup-card-img">
            <span class="setup-badge ${product.game === 'acc' ? 'badge-acc' : 'badge-lmu'}">${product.game.toUpperCase()}</span>
            ${product.hot ? `<span class="badge-hot">HOT</span>` : ''}
            <img src="${product.image}" alt="${product.car}">
        </div>
        <div class="setup-card-body">
            <div class="setup-circuit">${product.circuit}</div>
            <div class="setup-car">${product.car}</div>
            <div class="setup-meta">
                <span>MoTeC</span><span>Qualif & Course</span>
            </div>
            <div class="setup-footer">
                <div class="setup-price">€${product.price}</div>
                <button class="add-cart-btn" onclick="addToCart('${product.id}')">AJOUTER</button>
            </div>
        </div>
    </div>`;
}

// --- PAGE INDEX ---
function renderFeatured() {
    const container = document.getElementById('featuredSetups');
    const featured = productsData.filter(p => p.featured).slice(0, 3);
    container.innerHTML = featured.map(createProductCard).join('');
}

// --- PAGE SHOP ---
function initShop() {
    const grid = document.getElementById('shopGrid');
    const buttons = document.querySelectorAll('.filter-btn');
    
    // Récupérer paramètre URL (ex: shop.html?game=acc)
    const urlParams = new URLSearchParams(window.location.search);
    let currentGameFilter = urlParams.get('game') || 'all';

    const render = (filter) => {
        let filtered = filter === 'all' ? productsData : productsData.filter(p => p.game === filter);
        grid.innerHTML = filtered.map(createProductCard).join('');
        document.getElementById('shopCount').textContent = `${filtered.length} setups trouvés`;
        
        buttons.forEach(b => {
            if (b.dataset.filter === filter) b.classList.add('active');
            else b.classList.remove('active');
        });
    };

    render(currentGameFilter);

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            render(e.currentTarget.dataset.filter);
        });
    });
}

// --- PAGE CART / CHECKOUT ---
function initCart() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const payBtn = document.getElementById('payBtn');
    
    if (cart.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">Ton panier est vide.</p>`;
        totalEl.textContent = '€0.00';
        payBtn.style.opacity = '0.5';
        payBtn.style.pointerEvents = 'none';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price;
        return `
        <div class="os-item">
            <div class="os-item-name">${item.car} <span style="color: var(--text-muted); font-size: 10px; margin-left: 5px;">[${item.game.toUpperCase()}]</span></div>
            <div style="display:flex; gap: 15px; align-items:center;">
                <div class="os-item-price">€${item.price}</div>
                <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color: #ff3366; cursor:pointer; font-weight:bold;">X</button>
            </div>
        </div>`;
    }).join('');

    totalEl.textContent = `€${total.toFixed(2)}`;
    payBtn.style.opacity = '1';
    payBtn.style.pointerEvents = 'all';

    // Formulaire de paiement
    payBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Simulation Loading
        payBtn.textContent = 'TRAITEMENT...';
        setTimeout(() => {
            document.getElementById('successModal').classList.add('show');
            clearCart();
        }, 1500);
    });
}

// --- PAGE ACCOUNT / AUTH ---
function updateNavLoginState() {
    const loginBtn = document.getElementById('navLoginBtn');
    if (!loginBtn) return;
    if (currentUser) {
        loginBtn.textContent = 'MON COMPTE';
        loginBtn.style.background = 'var(--acc-cyan)';
        loginBtn.style.color = 'var(--bg-dark)';
    } else {
        loginBtn.textContent = 'CONNEXION';
        loginBtn.style.background = 'transparent';
        loginBtn.style.color = 'var(--acc-cyan)';
    }
}

function initAccount() {
    if (!currentUser) {
        // Redirige ou ouvre la modale si non connecté (Ici on affiche direct la modale)
        document.getElementById('authOverlay').classList.add('show');
    } else {
        document.getElementById('userNameDisplay').textContent = currentUser.email;
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const pwd = document.getElementById('pwd').value;
            
            if (email === 'admin@apex.com' && pwd === '1234') {
                currentUser = { email: email };
                localStorage.setItem('apex_user', JSON.stringify(currentUser));
                document.getElementById('authError').style.display = 'none';
                document.getElementById('authSuccess').style.display = 'block';
                setTimeout(() => { window.location.reload(); }, 1000);
            } else {
                document.getElementById('authError').style.display = 'block';
            }
        });
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('apex_user');
    window.location.reload();
}

// --- UTILITAIRES ---
function showToast(msg, type = 'success') {
    const existing = document.getElementById('apexToast');
    if(existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'apexToast';
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = type === 'error' ? `⚠ ${msg}` : `✓ ${msg}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}