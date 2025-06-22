// Глобальные переменные
let cart = [];
let currentUser = null;
let allOrders = [];
let currentProductId = null;
let selectedColor = null;
const adminEmail = "admin@globus.ru";

// Элементы страницы
const mainContent = document.getElementById('mainContent');
const profileBtn = document.getElementById('profileBtn');
const cartBtn = document.getElementById('cartBtn');
const cartCountElement = document.querySelector('.cart-count');
const authModal = document.getElementById('authModal');
const closeModalBtns = document.querySelectorAll('.close-modal');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем данные из localStorage
    loadData();
    
    // Инициализируем обработчики событий
    initEventHandlers();
});

// Функция загрузки данных
function loadData() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateProfileButton();
    }
    
    const savedOrders = localStorage.getItem('allOrders');
    if (savedOrders) {
        allOrders = JSON.parse(savedOrders);
    }
    
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Функция сохранения данных
function saveData() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    localStorage.setItem('allOrders', JSON.stringify(allOrders));
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Инициализация обработчиков событий
function initEventHandlers() {
    // Навигация
    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            showProfilePage();
        } else {
            showAuthModal();
        }
    });
    
    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showCartPage();
    });
    
    // Обработчики для модальных окон
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            document.body.style.overflow = 'auto';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Обработчики для товаров
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            e.preventDefault();
            const productId = e.target.closest('.product-card').getAttribute('data-id');
            addToCart(productId, 1);
        }
        
        if (e.target.closest('.product-card') && !e.target.classList.contains('add-to-cart')) {
            e.preventDefault();
            const productId = e.target.closest('.product-card').getAttribute('data-id');
            showProductModal(productId);
        }
    });
    
    // Обработчики для модального окна товара
    document.querySelector('.quantity-btn.minus')?.addEventListener('click', () => {
        const input = document.querySelector('.quantity-input');
        if (input.value > 1) {
            input.value--;
        }
    });
    
    document.querySelector('.quantity-btn.plus')?.addEventListener('click', () => {
        const input = document.querySelector('.quantity-input');
        input.value++;
    });
    
    document.getElementById('addToCartModal')?.addEventListener('click', () => {
        if (currentProductId) {
            const quantity = parseInt(document.querySelector('.quantity-input').value);
            addToCart(currentProductId, quantity, selectedColor);
            document.getElementById('productModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Обработчики для фильтрации по категориям
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.textContent;
            const productCards = document.querySelectorAll('.product-card');
            
            productCards.forEach(card => {
                if (category === 'Все товары' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // Обработчики для авторизации
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}Form`).classList.add('active');
        });
    });
    
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        login(email, password);
    });
    
    document.getElementById('registerForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const phone = document.getElementById('registerPhone').value;
        const address = document.getElementById('registerAddress').value;
        register(name, email, password, phone, address);
    });
}

// Функции для работы с корзиной
function addToCart(productId, quantity, color = null) {
    const product = productsData[productId];
    const existingItem = cart.find(item => item.id === productId && item.color === color);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            title: product.title,
            price: product.price,
            quantity: quantity,
            image: product.image,
            color: color
        });
    }
    
    updateCartCount();
    saveData();
    showNotification(`Добавлено "${product.title}"${color ? ` (${color.name})` : ''} в корзину`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    saveData();
}

function updateCartItemQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveData();
    }
}

function getSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getTotalItems() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function calculateDelivery() {
    return getSubtotal() > 2000 ? 0 : 300;
}

function getTotal() {
    return getSubtotal() + calculateDelivery();
}

function updateCartCount() {
    const totalItems = getTotalItems();
    cartCountElement.textContent = totalItems;
}

// Функции для работы с пользователем
function login(email, password) {
    // В реальном приложении здесь был бы запрос к серверу
    if (email === adminEmail && password === 'admin123') {
        currentUser = {
            id: 'admin',
            name: 'Администратор',
            email: adminEmail,
            isAdmin: true
        };
    } else {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            showNotification('Неверный email или пароль', 'error');
            return false;
        }
        
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            address: user.address,
            phone: user.phone,
            orders: user.orders || []
        };
    }
    
    saveData();
    updateProfileButton();
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (mainContent.querySelector('.cart-page')) {
        showCheckoutPage();
    }
    
    showNotification(`Добро пожаловать, ${currentUser.name}!`);
    return true;
}

function register(name, email, password, phone, address) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.email === email)) {
        showNotification('Пользователь с таким email уже зарегистрирован', 'error');
        return false;
    }
    
    const newUser = {
        id: generateUserId(),
        name,
        email,
        password,
        phone,
        address,
        orders: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        address: newUser.address,
        phone: newUser.phone,
        orders: newUser.orders
    };
    
    saveData();
    updateProfileButton();
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (mainContent.querySelector('.cart-page')) {
        showCheckoutPage();
    }
    
    showNotification(`Регистрация успешна, ${currentUser.name}!`);
    return true;
}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateProfileButton();
    showHomePage();
    showNotification('Вы вышли из системы');
}

function updateProfileButton() {
    if (currentUser) {
        profileBtn.textContent = currentUser.name.split(' ')[0];
    } else {
        profileBtn.textContent = 'Профиль';
    }
}

// Функции для работы с заказами
function placeOrder() {
    const name = document.getElementById('checkoutName').value;
    const email = document.getElementById('checkoutEmail').value;
    const phone = document.getElementById('checkoutPhone').value;
    const address = document.getElementById('checkoutAddress').value;
    const comment = document.getElementById('checkoutComment').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (!name || !email || !phone || !address) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    // Обновляем данные пользователя
    currentUser.name = name;
    currentUser.email = email;
    currentUser.address = address;
    currentUser.phone = phone;
    saveData();
    
    // Создаем заказ
    const order = {
        id: generateOrderId(),
        date: new Date().toISOString(),
        user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone,
            address: currentUser.address
        },
        items: [...cart],
        subtotal: getSubtotal(),
        delivery: calculateDelivery(),
        total: getTotal(),
        paymentMethod: paymentMethod,
        status: 'Новый',
        comment: comment
    };
    
    // Добавляем заказ в историю пользователя
    if (!currentUser.orders) {
        currentUser.orders = [];
    }
    currentUser.orders.push(order);
    saveData();
    
    // Добавляем заказ в общий список заказов
    allOrders.push(order);
    saveData();
    
    // Очищаем корзину
    cart = [];
    saveData();
    updateCartCount();
    
    // Отправляем уведомления (в реальном приложении здесь был бы запрос к серверу)
    sendOrderEmail(order);
    
    // Показываем страницу успешного оформления заказа
    showOrderSuccessPage(order);
}

function generateOrderId() {
    return Math.floor(100000 + Math.random() * 900000);
}

function updateOrderStatus(orderId, status) {
    // Обновляем в общих заказах
    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        allOrders[orderIndex].status = status;
        saveData();
    }
    
    // Обновляем в заказах пользователя (если он есть)
    if (currentUser && currentUser.orders) {
        const userOrderIndex = currentUser.orders.findIndex(o => o.id === orderId);
        if (userOrderIndex !== -1) {
            currentUser.orders[userOrderIndex].status = status;
            saveData();
        }
    }
    
    // Если мы на странице профиля, обновляем ее
    if (mainContent.querySelector('.profile-page')) {
        showProfilePage();
    }
    
    showNotification(`Статус заказа #${orderId} изменен на "${status}"`);
}

// Функция "отправки" email (в реальном приложении это делалось бы на сервере)
function sendOrderEmail(order) {
    console.log(`Отправлено уведомление на email ${order.user.email} о заказе #${order.id}`);
    if (adminEmail) {
        console.log(`Отправлено уведомление администратору на email ${adminEmail} о новом заказе #${order.id}`);
    }
}

// Функции для отображения страниц
function showHomePage() {
    mainContent.innerHTML = `
        <section class="hero">
            <h1>Магазин канцелярии ГЛОБУС</h1>
            <p>Широкий ассортимент качественных канцелярских товаров для офиса, школы и творчества</p>
            <a href="#products" class="btn">Перейти к товарам</a>
        </section>
        
        <section id="products" class="products">
            <div class="container">
                <h2 class="section-title">Наши товары</h2>
                
                <div class="categories">
                    <button class="category-btn active">Все товары</button>
                    <button class="category-btn">Ручки</button>
                    <button class="category-btn">Тетради</button>
                    <button class="category-btn">Бумага</button>
                    <button class="category-btn">Офис</button>
                    <button class="category-btn">Творчество</button>
                </div>
                
                <div class="products-grid">
                    ${generateProductCards()}
                </div>
            </div>
        </section>
        
        <section class="about">
            <div class="container">
                <h2 class="section-title">О нашем магазине</h2>
                <div class="about-content">
                    <div class="about-text">
                        <p>Магазин "ГЛОБУС" - это место, где вы найдете все необходимое для работы, учебы и творчества. Мы работаем на рынке канцелярских товаров более 10 лет и за это время заслужили доверие тысяч клиентов.</p>
                        <p>В нашем ассортименте представлены товары от ведущих мировых производителей: ручки, карандаши, тетради, блокноты, бумага, папки, скрепки и многое другое. Мы тщательно отбираем продукцию, чтобы предложить нашим клиентам только лучшее.</p>
                        <p>Наши цены приятно удивят вас, а качество обслуживания сделает покупки комфортными и приятными.</p>
                    </div>
                    <div class="about-image">
                        <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Канцелярские товары">
                    </div>
                </div>
            </div>
        </section>
        
        <section class="contacts">
            <div class="container">
                <h2 class="section-title">Контакты</h2>
                <div class="contact-info">
                    <div class="contact-card">
                        <h3>Адрес</h3>
                        <p>г. Москва, ул. Канцелярская, д. 15</p>
                        <p>ТЦ "Офисный", 2 этаж</p>
                    </div>
                    <div class="contact-card">
                        <h3>Телефон</h3>
                        <p>+7 (495) 123-45-67</p>
                        <p>+7 (800) 123-45-67</p>
                    </div>
                    <div class="contact-card">
                        <h3>Режим работы</h3>
                        <p>Пн-Пт: 9:00 - 21:00</p>
                        <p>Сб-Вс: 10:00 - 20:00</p>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    initEventHandlers();
}

function showCartPage() {
    if (cart.length === 0) {
        mainContent.innerHTML = `
            <div class="container cart-page">
                <h2 class="section-title">Корзина пуста</h2>
                <p>В вашей корзине пока нет товаров. Перейдите в каталог, чтобы добавить товары.</p>
                <a href="#" class="btn" id="continueShopping">Продолжить покупки</a>
            </div>
        `;
        
        document.getElementById('continueShopping').addEventListener('click', (e) => {
            e.preventDefault();
            showHomePage();
        });
        
        return;
    }
    
    mainContent.innerHTML = `
        <div class="container cart-page">
            <h2 class="section-title">Ваша корзина</h2>
            
            <div class="cart-items">
                ${generateCartItems()}
            </div>
            
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Товары (${getTotalItems()} шт.)</span>
                    <span>${getSubtotal()} ₽</span>
                </div>
                <div class="summary-row">
                    <span>Доставка</span>
                    <span>${calculateDelivery()} ₽</span>
                </div>
                <div class="summary-row total">
                    <span>Итого</span>
                    <span>${getTotal()} ₽</span>
                </div>
            </div>
            
            <button class="btn" id="checkoutBtn" style="width: 100%; margin-top: 30px;">Оформить заказ</button>
        </div>
    `;
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.closest('.cart-item').getAttribute('data-id');
            removeFromCart(productId);
            showCartPage();
        });
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const productId = e.target.closest('.cart-item').getAttribute('data-id');
            const newQuantity = parseInt(e.target.value);
            updateCartItemQuantity(productId, newQuantity);
            showCartPage();
        });
    });
    
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (currentUser) {
            showCheckoutPage();
        } else {
            showAuthModal();
        }
    });
}

function showCheckoutPage() {
    mainContent.innerHTML = `
        <div class="container">
            <h2 class="section-title">Оформление заказа</h2>
            
            <div class="checkout-form">
                <h3>Данные для доставки</h3>
                <div class="form-group">
                    <label for="checkoutName">ФИО</label>
                    <input type="text" id="checkoutName" value="${currentUser.name}" required>
                </div>
                <div class="form-group">
                    <label for="checkoutEmail">Email</label>
                    <input type="email" id="checkoutEmail" value="${currentUser.email}" required>
                </div>
                <div class="form-group">
                    <label for="checkoutPhone">Телефон</label>
                    <input type="tel" id="checkoutPhone" value="${currentUser.phone || ''}" required>
                </div>
                <div class="form-group">
                    <label for="checkoutAddress">Адрес доставки</label>
                    <textarea id="checkoutAddress" rows="3" required>${currentUser.address || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="checkoutComment">Комментарий к заказу</label>
                    <textarea id="checkoutComment" rows="3"></textarea>
                </div>
                
                <h3 style="margin-top: 30px;">Способ оплаты</h3>
                <div class="form-group">
                    <select id="paymentMethod">
                        <option value="cash">Наличными при получении</option>
                        <option value="card">Банковской картой онлайн</option>
                    </select>
                </div>
                
                <div class="cart-summary" style="margin-top: 30px;">
                    <div class="summary-row">
                        <span>Товары (${getTotalItems()} шт.)</span>
                        <span>${getSubtotal()} ₽</span>
                    </div>
                    <div class="summary-row">
                        <span>Доставка</span>
                        <span>${calculateDelivery()} ₽</span>
                    </div>
                    <div class="summary-row total">
                        <span>Итого</span>
                        <span>${getTotal()} ₽</span>
                    </div>
                </div>
                
                <button class="btn" id="placeOrderBtn" style="width: 100%; margin-top: 30px;">Подтвердить заказ</button>
            </div>
        </div>
    `;
    
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
}

function showProfilePage() {
    let ordersHtml = '';
    
    if (currentUser.orders && currentUser.orders.length > 0) {
        ordersHtml = `
            <h3 style="margin-top: 40px;">Ваши заказы</h3>
            <div class="profile-orders">
                ${generateUserOrders(currentUser.orders)}
            </div>
        `;
    } else {
        ordersHtml = '<p>У вас пока нет заказов.</p>';
    }
    
    let adminPanel = '';
    if (currentUser.email === adminEmail) {
        adminPanel = `
            <div class="admin-panel">
                <h3>Административная панель</h3>
                <p>Всего заказов: ${allOrders.length}</p>
                
                <div class="admin-orders">
                    <h4>Последние заказы:</h4>
                    ${generateAllOrders()}
                </div>
            </div>
        `;
    }
    
    mainContent.innerHTML = `
        <div class="container profile-page">
            <div class="profile-header">
                <div class="profile-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
                <div class="profile-info">
                    <h2>${currentUser.name}</h2>
                    <p>${currentUser.email}</p>
                    <p>${currentUser.phone || 'Телефон не указан'}</p>
                    <p>${currentUser.address || 'Адрес не указан'}</p>
                </div>
            </div>
            
            <button class="btn" id="logoutBtn" style="margin-top: 20px;">Выйти</button>
            
            ${ordersHtml}
            ${adminPanel}
        </div>
    `;
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Инициализация обработчиков для админских кнопок
    document.querySelectorAll('[data-order-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = parseInt(e.target.getAttribute('data-order-id'));
            const action = e.target.getAttribute('data-action'));
            
            let status;
            switch (action) {
                case 'process': status = 'В обработке'; break;
                case 'ship': status = 'Отправлен'; break;
                case 'complete': status = 'Завершен'; break;
            }
            
            if (status) {
                updateOrderStatus(orderId, status);
            }
        });
    });
}

function showOrderSuccessPage(order) {
    mainContent.innerHTML = `
        <div class="container" style="text-align: center; padding: 80px 0;">
            <h2 class="section-title">Заказ успешно оформлен!</h2>
            <p style="font-size: 18px; margin-bottom: 30px;">Номер вашего заказа: #${order.id}</p>
            <p style="font-size: 18px; margin-bottom: 30px;">Сумма заказа: ${order.total} ₽</p>
            <p style="font-size: 18px; margin-bottom: 40px;">Мы свяжемся с вами для подтверждения заказа.</p>
            <a href="#" class="btn" id="backToHome">Вернуться на главную</a>
        </div>
    `;
    
    document.getElementById('backToHome').addEventListener('click', (e) => {
        e.preventDefault();
        showHomePage();
    });
}

function showAuthModal() {
    authModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function showProductModal(productId) {
    const product = productsData[productId];
    currentProductId = productId;
    selectedColor = product.colors.length > 0 ? product.colors[0] : null;
    
    document.getElementById('modalProductImage').src = product.image;
    document.getElementById('modalProductTitle').textContent = product.title;
    document.getElementById('modalProductPrice').textContent = `${product.price} ₽`;
    document.getElementById('modalProductDescription').textContent = product.description;
    document.querySelector('.quantity-input').value = 1;
    
    // Очищаем и заполняем выбор цвета
    const colorOptions = document.querySelector('.color-options');
    colorOptions.innerHTML = '';
    
    if (product.colors.length > 0) {
        product.colors.forEach(color => {
            const colorOption = document.createElement('div');
            colorOption.className = `color-option ${color === selectedColor ? 'selected' : ''}`;
            colorOption.style.backgroundColor = color.code;
            colorOption.title = color.name;
            colorOption.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                colorOption.classList.add('selected');
                selectedColor = color;
            });
            colorOptions.appendChild(colorOption);
        });
        
        document.getElementById('colorSelector').style.display = 'block';
    } else {
        document.getElementById('colorSelector').style.display = 'none';
    }
    
    document.getElementById('productModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Генераторы HTML
function generateCartItems() {
    return cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.title}${item.color ? `<br><small>Цвет: ${item.color.name}</small>` : ''}</h4>
                <div class="cart-item-price">${item.price} ₽</div>
            </div>
            <div class="cart-item-actions">
                <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                <span class="remove-item">&times;</span>
            </div>
        </div>
    `).join('');
}

function generateUserOrders(orders) {
    return orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <strong>Заказ #${order.id}</strong>
                    <span style="margin-left: 15px; color: #7f8c8d;">${formatDate(order.date)}</span>
                </div>
                <div>
                    <strong>${order.total} ₽</strong>
                    <span style="margin-left: 15px; color: ${getStatusColor(order.status)}">${order.status}</span>
                </div>
            </div>
            <div class="order-products">
                ${order.items.map(item => `
                    <div class="order-product">
                        <img src="${item.image}" alt="${item.title}">
                        <div>
                            <div>${item.title}${item.color ? ` (${item.color.name})` : ''}</div>
                            <div>${item.price} ₽ × ${item.quantity} = ${item.price * item.quantity} ₽</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-details">
                <p><strong>Способ оплаты:</strong> ${order.paymentMethod === 'cash' ? 'Наличными при получении' : 'Банковской картой онлайн'}</p>
                <p><strong>Адрес доставки:</strong> ${order.user.address}</p>
                <p><strong>Телефон:</strong> ${order.user.phone}</p>
                ${order.comment ? `<p><strong>Комментарий:</strong> ${order.comment}</p>` : ''}
            </div>
        </div>
    `).join('');
}

function generateAllOrders() {
    return allOrders.slice().reverse().slice(0, 5).map(order => `
        <div class="user-order">
            <div class="user-info">
                ${order.user.name} (${order.user.email})
            </div>
            <div>
                <strong>Заказ #${order.id}</strong> - ${order.total} ₽ - ${formatDate(order.date)} - 
                <span style="color: ${getStatusColor(order.status)}">${order.status}</span>
            </div>
            <div class="admin-actions">
                <button class="btn" data-order-id="${order.id}" data-action="process">В обработке</button>
                <button class="btn" data-order-id="${order.id}" data-action="ship">Отправлен</button>
                <button class="btn" data-order-id="${order.id}" data-action="complete">Завершен</button>
            </div>
        </div>
    `).join('');
}

// Вспомогательные функции
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusColor(status) {
    switch (status) {
        case 'Новый': return '#3498db';
        case 'В обработке': return '#f39c12';
        case 'Отправлен': return '#9b59b6';
        case 'Завершен': return '#2ecc71';
        case 'Отменен': return '#e74c3c';
        default: return '#7f8c8d';
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}