const ADMIN_NAME = 'Lee🛠️';
const ADMIN_PIN = '2010';

const STORAGE_KEYS = {
    users: 'garage_users',
    vehicles: 'garage_vehicles',
    currentUser: 'garage_currentUser',
};

let state = {
    users: [],
    vehicles: [],
    currentUser: null,
    currentPin: '',
    selectedAccount: null,
    currentFilter: 'all',
    pendingAvatar: null,
    editUser: null,
    editPendingAvatar: null,
};

function lockPortrait() {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {});
    }
}

function init() {
    loadData();
    ensureAdminExists();
    saveData();
    showPage('login-page');
    renderAccounts();
    setupEventListeners();
    lockPortrait();
}

function loadData() {
    try {
        const users = localStorage.getItem(STORAGE_KEYS.users);
        const vehicles = localStorage.getItem(STORAGE_KEYS.vehicles);
        const currentUser = localStorage.getItem(STORAGE_KEYS.currentUser);

        state.users = users ? JSON.parse(users) : [];
        state.vehicles = vehicles ? JSON.parse(vehicles) : [];
        state.currentUser = currentUser ? JSON.parse(currentUser) : null;
    } catch (e) {
        console.error('Error loading data:', e);
        state.users = [];
        state.vehicles = [];
        state.currentUser = null;
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
    localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(state.vehicles));
    if (state.currentUser) {
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(state.currentUser));
    } else {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
}

function ensureAdminExists() {
    const adminExists = state.users.some(u => u.name === ADMIN_NAME);
    if (!adminExists) {
        state.users.push({
            id: generateId(),
            name: ADMIN_NAME,
            pin: ADMIN_PIN,
            isAdmin: true,
            createdAt: Date.now(),
        });
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function renderAccounts() {
    const list = document.getElementById('account-list');

    list.innerHTML = '';

    state.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'account-item';
        item.dataset.userId = user.id;

        const initial = user.name.charAt(0).toUpperCase();
        const avatarContent = user.avatar
            ? `<img src="${user.avatar}" alt="${escapeHtml(user.name)}">`
            : initial;

        item.innerHTML = `
            <div class="account-avatar">${avatarContent}</div>
            <div class="account-info">
                <div class="account-name">${escapeHtml(user.name)}</div>
                <div class="account-role">${user.isAdmin ? 'Admin' : 'User'}</div>
            </div>
        `;

        item.addEventListener('click', () => {
            selectAccount(user.id);
        });

        list.appendChild(item);
    });
}

function selectAccount(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    state.selectedAccount = user;
    state.currentPin = '';
    updatePinDisplay();
    showPage('pin-page');
    document.getElementById('pin-user-name').textContent = user.name;
    document.getElementById('pin-error').classList.add('hidden');
}

function deleteAccount(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user || user.isAdmin) return;

    if (!confirm(`Account "${user.name}" wirklich löschen?`)) return;

    state.users = state.users.filter(u => u.id !== userId);
    saveData();
    showToast('Account gelöscht');
}

function updatePinDisplay() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('filled', i < state.currentPin.length);
    });
}

function handlePinInput(num) {
    if (state.currentPin.length >= 4) return;

    state.currentPin += num;
    updatePinDisplay();

    if (state.currentPin.length === 4) {
        setTimeout(() => checkPin(), 200);
    }
}

function checkPin() {
    const user = state.selectedAccount;
    if (!user) return;

    if (user.pin === state.currentPin) {
        state.currentUser = user;
        saveData();
        state.currentPin = '';
        state.selectedAccount = null;
        updatePinDisplay();
        showDashboard();
    } else {
        document.getElementById('pin-error').classList.remove('hidden');
        state.currentPin = '';
        updatePinDisplay();

        setTimeout(() => {
            document.getElementById('pin-error').classList.add('hidden');
        }, 2000);
    }
}

function clearPin() {
    state.currentPin = '';
    updatePinDisplay();
}

function pinBackspace() {
    state.currentPin = state.currentPin.slice(0, -1);
    updatePinDisplay();
}

function showDashboard() {
    showPage('dashboard-page');
    document.getElementById('current-user-name').textContent = state.currentUser.name;

    const manageBtn = document.getElementById('manage-users-btn');
    if (state.currentUser.isAdmin) {
        manageBtn.classList.remove('hidden');
    } else {
        manageBtn.classList.add('hidden');
    }

    resetTabs();
    renderVehicles();
}

function logout() {
    state.currentUser = null;
    saveData();
    state.selectedAccount = null;
    state.currentPin = '';
    updatePinDisplay();
    showPage('login-page');
    renderAccounts();
}

function resetTabs() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab[data-tab="vehicles"]').classList.add('active');
    document.getElementById('tab-vehicles').classList.add('active');
    document.getElementById('vehicle-form').reset();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === `tab-${tabName}`);
    });

    if (tabName === 'vehicles') {
        renderVehicles();
    }
}

function renderVehicles() {
    const list = document.getElementById('vehicle-list');
    const empty = document.getElementById('no-vehicles');

    let vehicles = state.vehicles.filter(v => v.ownerId === state.currentUser.id);

    if (state.currentFilter !== 'all') {
        vehicles = vehicles.filter(v => v.type === state.currentFilter);
    }

    list.innerHTML = '';

    if (vehicles.length === 0) {
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');

        vehicles.sort((a, b) => b.createdAt - a.createdAt).forEach(vehicle => {
            const card = createVehicleCard(vehicle);
            list.appendChild(card);
        });
    }
}

function createVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'vehicle-card';

    const typeLabel = getTypeLabel(vehicle.type);
    const isOwner = vehicle.ownerId === state.currentUser.id;
    const detailItems = [
        { label: 'Marke', value: vehicle.brand },
        { label: 'Modell', value: vehicle.model },
        { label: 'Baujahr', value: vehicle.year },
        { label: 'Kontrollschild', value: vehicle.plate },
        { label: 'Farbe', value: vehicle.color },
    ].filter(d => d.value);

    card.innerHTML = `
        <div class="vehicle-header">
            <span class="vehicle-type-badge ${vehicle.type}">${typeLabel}</span>
            <span class="vehicle-name">${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}</span>
        </div>
        <div class="vehicle-details">
            ${detailItems.map(d => `
                <div class="vehicle-detail">
                    <span class="vehicle-detail-label">${d.label}</span>
                    <span class="vehicle-detail-value">${escapeHtml(d.value)}</span>
                </div>
            `).join('')}
        </div>
        ${vehicle.notes ? `<div class="vehicle-notes">${escapeHtml(vehicle.notes)}</div>` : ''}
        ${isOwner ? '<button class="vehicle-delete" data-vehicle-id="' + vehicle.id + '">&times;</button>' : ''}
    `;

    const deleteBtn = card.querySelector('.vehicle-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteVehicle(vehicle.id);
        });
    }

    return card;
}

function getTypeLabel(type) {
    const labels = { auto: 'Auto', toff: 'Töff', toffli: 'Töffli' };
    return labels[type] || type;
}

function deleteVehicle(vehicleId) {
    if (!confirm('Fahrzeug wirklich löschen?')) return;

    state.vehicles = state.vehicles.filter(v => v.id !== vehicleId);
    saveData();
    renderVehicles();
    showToast('Fahrzeug gelöscht');
}

function addVehicle(data) {
    const vehicle = {
        id: generateId(),
        type: data.type,
        brand: data.brand.trim(),
        model: data.model.trim(),
        year: data.year || '',
        plate: data.plate.trim(),
        color: data.color.trim(),
        notes: data.notes.trim(),
        ownerId: state.currentUser.id,
        createdAt: Date.now(),
    };

    state.vehicles.push(vehicle);
    saveData();
    showToast('Fahrzeug gespeichert');
    switchTab('vehicles');
}

function filterVehicles(filter) {
    state.currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    renderVehicles();
}

function showManageUsers() {
    showPage('manage-users-page');
    renderUserList();
    document.getElementById('add-user-form').classList.add('hidden');
    document.getElementById('open-add-user').classList.remove('hidden');
}

function renderUserList() {
    const list = document.getElementById('user-list');
    list.innerHTML = '';

    state.users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'account-item';

        const initial = user.name.charAt(0).toUpperCase();
        const avatarContent = user.avatar
            ? `<img src="${user.avatar}" alt="${escapeHtml(user.name)}">`
            : initial;

        item.innerHTML = `
            <div class="account-avatar">${avatarContent}</div>
            <div class="account-info">
                <div class="account-name">${escapeHtml(user.name)}</div>
                <div class="account-role">${user.isAdmin ? 'Admin' : 'User'}</div>
            </div>
            <button class="btn-edit-user" data-edit-id="${user.id}">Bearbeiten</button>
            ${!user.isAdmin ? '<button class="account-delete visible" data-manage-delete="' + user.id + '">&times;</button>' : ''}
        `;

        list.appendChild(item);
    });

    list.querySelectorAll('[data-manage-delete]').forEach(btn => {
        btn.classList.add('account-delete');
        btn.style.opacity = '1';
        btn.addEventListener('click', () => {
            deleteAccountFromManage(btn.dataset.manageDelete);
        });
    });

    list.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', () => {
            openEditUser(btn.dataset.editId);
        });
    });
}

function deleteAccountFromManage(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user || user.isAdmin) return;

    if (!confirm(`User "${user.name}" wirklich löschen?`)) return;

    state.users = state.users.filter(u => u.id !== userId);
    saveData();
    renderUserList();
    showToast('User gelöscht');
}

function showAddUserForm() {
    document.getElementById('add-user-form').classList.remove('hidden');
    document.getElementById('open-add-user').classList.add('hidden');
    document.getElementById('add-user-name').value = '';
    document.getElementById('add-user-pin').value = '';
    document.getElementById('add-user-pin-confirm').value = '';
    document.getElementById('add-user-error').classList.add('hidden');
    state.pendingAvatar = null;
    document.getElementById('avatar-file').value = '';
    resetAvatarPreview();
}

function resetAvatarPreview() {
    const preview = document.getElementById('avatar-preview');
    const initial = document.getElementById('avatar-initial');
    const removeBtn = document.getElementById('remove-avatar');
    const existingImg = preview.querySelector('img');
    if (existingImg) existingImg.remove();
    initial.classList.remove('hidden');
    initial.textContent = '?';
    removeBtn.classList.add('hidden');
}

function setAvatarPreview(dataUrl, name) {
    const preview = document.getElementById('avatar-preview');
    const initial = document.getElementById('avatar-initial');
    const removeBtn = document.getElementById('remove-avatar');
    let img = preview.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        preview.appendChild(img);
    }
    img.src = dataUrl;
    initial.classList.add('hidden');
    removeBtn.classList.remove('hidden');
}

function updateAvatarInitial() {
    const name = document.getElementById('add-user-name').value.trim();
    const initial = document.getElementById('avatar-initial');
    if (initial && !state.pendingAvatar) {
        initial.textContent = name ? name.charAt(0).toUpperCase() : '?';
    }
    document.getElementById('add-user-error').classList.add('hidden');
}

function hideAddUserForm() {
    document.getElementById('add-user-form').classList.add('hidden');
    document.getElementById('open-add-user').classList.remove('hidden');
    state.pendingAvatar = null;
}

function openEditUser(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    state.editUser = user;
    state.editPendingAvatar = user.avatar || null;

    document.getElementById('add-user-form').classList.add('hidden');
    document.getElementById('open-add-user').classList.add('hidden');
    document.getElementById('edit-user-form').classList.remove('hidden');
    document.getElementById('edit-user-error').classList.add('hidden');
    document.getElementById('edit-avatar-file').value = '';

    updateEditAvatarPreview();
}

function closeEditUser() {
    document.getElementById('edit-user-form').classList.add('hidden');
    document.getElementById('open-add-user').classList.remove('hidden');
    state.editUser = null;
    state.editPendingAvatar = null;
}

function updateEditAvatarPreview() {
    const preview = document.getElementById('edit-avatar-preview');
    const initial = document.getElementById('edit-avatar-initial');
    const removeBtn = document.getElementById('edit-remove-avatar');

    let img = preview.querySelector('img');

    if (state.editPendingAvatar) {
        if (!img) {
            img = document.createElement('img');
            preview.appendChild(img);
        }
        img.src = state.editPendingAvatar;
        initial.classList.add('hidden');
        removeBtn.classList.remove('hidden');
    } else {
        if (img) img.remove();
        initial.classList.remove('hidden');
        const user = state.editUser;
        initial.textContent = user ? user.name.charAt(0).toUpperCase() : '?';
        removeBtn.classList.add('hidden');
    }
}

function addUser(name, pin, pinConfirm) {
    if (!name.trim()) {
        showAddUserError('Name eingeben');
        return;
    }

    if (!/^\d{4}$/.test(pin)) {
        showAddUserError('Code muss 4 Ziffern haben');
        return;
    }

    if (pin !== pinConfirm) {
        showAddUserError('Codes stimmen nicht überein');
        return;
    }

    if (state.users.some(u => u.name.toLowerCase() === name.trim().toLowerCase())) {
        showAddUserError('Name existiert bereits');
        return;
    }

    state.users.push({
        id: generateId(),
        name: name.trim(),
        pin: pin,
        isAdmin: false,
        avatar: state.pendingAvatar,
        createdAt: Date.now(),
    });

    saveData();
    hideAddUserForm();
    renderUserList();
    showToast('User erstellt');
}

function showAddUserError(msg) {
    const error = document.getElementById('add-user-error');
    error.textContent = msg;
    error.classList.remove('hidden');
}

function showEditUserError(msg) {
    const error = document.getElementById('edit-user-error');
    error.textContent = msg;
    error.classList.remove('hidden');
}

function hapticFeedback(type) {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(type === 'success' ? [30] : [15]);
    }
}

function showToast(message) {
    hapticFeedback('success');
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupEventListeners() {
    document.querySelectorAll('.pin-btn[data-num]').forEach(btn => {
        btn.addEventListener('click', () => handlePinInput(btn.dataset.num));
    });

    document.getElementById('pin-clear').addEventListener('click', clearPin);
    document.getElementById('pin-back').addEventListener('click', pinBackspace);

    document.getElementById('logout-btn').addEventListener('click', logout);

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterVehicles(btn.dataset.filter));
    });

    document.getElementById('vehicle-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const data = {
            type: document.getElementById('vehicle-type').value,
            brand: document.getElementById('vehicle-brand').value,
            model: document.getElementById('vehicle-model').value,
            year: document.getElementById('vehicle-year').value,
            plate: document.getElementById('vehicle-plate').value,
            color: document.getElementById('vehicle-color').value,
            notes: document.getElementById('vehicle-notes').value,
        };

        addVehicle(data);
        e.target.reset();
    });

    document.getElementById('manage-users-btn').addEventListener('click', showManageUsers);
    document.getElementById('back-to-dashboard').addEventListener('click', showDashboard);
    document.getElementById('open-add-user').addEventListener('click', showAddUserForm);
    document.getElementById('cancel-add-user').addEventListener('click', hideAddUserForm);
    document.getElementById('save-add-user').addEventListener('click', () => {
        const name = document.getElementById('add-user-name').value;
        const pin = document.getElementById('add-user-pin').value;
        const pinConfirm = document.getElementById('add-user-pin-confirm').value;

        addUser(name, pin, pinConfirm);
    });

    document.getElementById('cancel-edit-user').addEventListener('click', closeEditUser);
    document.getElementById('save-edit-user').addEventListener('click', () => {
        if (!state.editUser) return;

        state.editUser.avatar = state.editPendingAvatar;
        saveData();
        closeEditUser();
        renderUserList();
        showToast('Profilbild aktualisiert');
    });

    document.getElementById('avatar-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        document.getElementById('add-user-error').classList.add('hidden');

        if (file.size > 2 * 1024 * 1024) {
            showAddUserError('Bild darf maximal 2MB gross sein');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            compressImage(ev.target.result, 200, (compressed) => {
                state.pendingAvatar = compressed;
                setAvatarPreview(compressed, document.getElementById('add-user-name').value);
            });
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('remove-avatar').addEventListener('click', () => {
        state.pendingAvatar = null;
        document.getElementById('avatar-file').value = '';
        resetAvatarPreview();
    });

    document.getElementById('edit-avatar-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        document.getElementById('edit-user-error').classList.add('hidden');

        if (file.size > 2 * 1024 * 1024) {
            showEditUserError('Bild darf maximal 2MB gross sein');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            compressImage(ev.target.result, 200, (compressed) => {
                state.editPendingAvatar = compressed;
                updateEditAvatarPreview();
            });
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('edit-remove-avatar').addEventListener('click', () => {
        state.editPendingAvatar = null;
        document.getElementById('edit-avatar-file').value = '';
        updateEditAvatarPreview();
    });

    document.getElementById('edit-avatar-preview').addEventListener('click', () => {
        document.getElementById('edit-avatar-file').click();
    });

    document.getElementById('add-user-name').addEventListener('input', updateAvatarInitial);
    document.getElementById('add-user-pin-confirm').addEventListener('input', () => {
        document.getElementById('add-user-error').classList.add('hidden');
    });

    document.getElementById('avatar-preview').addEventListener('click', () => {
        document.getElementById('avatar-file').click();
    });
}

function compressImage(dataUrl, maxSize, callback) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > h) {
            if (w > maxSize) { h *= maxSize / w; w = maxSize; }
        } else {
            if (h > maxSize) { w *= maxSize / h; h = maxSize; }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
}

document.addEventListener('DOMContentLoaded', init);
