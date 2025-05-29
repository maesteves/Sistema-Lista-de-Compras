// DOM Elements
const productInput = document.getElementById('productInput');
const quantityInput = document.getElementById('quantityInput');
const unitInput = document.getElementById('unitInput');
const addButton = document.getElementById('addButton');
const decreaseQuantity = document.getElementById('decreaseQuantity');
const increaseQuantity = document.getElementById('increaseQuantity');
const productList = document.getElementById('productList');
const filterAll = document.getElementById('filterAll');
const filterPending = document.getElementById('filterPending');
const filterCompleted = document.getElementById('filterCompleted');
const clearCompleted = document.getElementById('clearCompleted');
const undoButton = document.getElementById('undoButton');
const totalItems = document.getElementById('totalItems');
const completedItems = document.getElementById('completedItems');
const toast = document.getElementById('toast');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const closeModal = document.querySelector('.close-modal');

// State
let products = [];
let currentFilter = 'all';
let history = [];
const MAX_HISTORY = 50;

// Initialize the application
function init() {
    loadProducts();
    renderProductList();
    setupEventListeners();
    updateStats();
    
    // Add first history state
    saveHistoryState();
}

// Load products from localStorage
function loadProducts() {
    try {
        const savedProducts = localStorage.getItem('shoppingListProducts');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
            showToast('Lista carregada com sucesso', 'success');
        }
    } catch (error) {
        showToast('Erro ao carregar lista', 'error');
        console.error('Error loading products:', error);
    }
}

// Save products to localStorage
function saveProducts() {
    try {
        localStorage.setItem('shoppingListProducts', JSON.stringify(products));
    } catch (error) {
        showToast('Erro ao salvar lista', 'error');
        console.error('Error saving products:', error);
    }
}

// Save current state to history
function saveHistoryState() {
    history.push(JSON.stringify(products));
    if (history.length > MAX_HISTORY) {
        history.shift();
    }
    undoButton.disabled = history.length <= 1;
}

// Undo last action
function undoLastAction() {
    if (history.length > 1) {
        history.pop(); // Remove current state
        const previousState = history.pop(); // Get previous state
        products = JSON.parse(previousState);
        saveProducts();
        renderProductList();
        updateStats();
        showToast('Ação desfeita', 'success');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast';
    
    switch(type) {
        case 'success':
            toast.style.backgroundColor = 'var(--toast-success)';
            break;
        case 'error':
            toast.style.backgroundColor = 'var(--toast-error)';
            break;
        case 'warning':
            toast.style.backgroundColor = 'var(--toast-warning)';
            break;
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Add product
    addButton.addEventListener('click', addProduct);
    productInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addProduct();
    });

    // Quantity controls
    decreaseQuantity.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });

    increaseQuantity.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        quantityInput.value = currentValue + 1;
    });

    // Filter buttons
    filterAll.addEventListener('click', () => {
        currentFilter = 'all';
        updateActiveFilter();
        renderProductList();
    });

    filterPending.addEventListener('click', () => {
        currentFilter = 'pending';
        updateActiveFilter();
        renderProductList();
    });

    filterCompleted.addEventListener('click', () => {
        currentFilter = 'completed';
        updateActiveFilter();
        renderProductList();
    });

    // Clear completed
    clearCompleted.addEventListener('click', clearCompletedProducts);
    
    // Undo button
    undoButton.addEventListener('click', undoLastAction);
    
    // Help modal
    helpButton.addEventListener('click', () => {
        helpModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            helpModal.style.display = 'none';
        }
    });
}

// Update active filter button styles
function updateActiveFilter() {
    [filterAll, filterPending, filterCompleted].forEach(btn => {
        btn.classList.remove('active');
    });

    if (currentFilter === 'all') filterAll.classList.add('active');
    if (currentFilter === 'pending') filterPending.classList.add('active');
    if (currentFilter === 'completed') filterCompleted.classList.add('active');
}

// Add a new product to the list
function addProduct() {
    const name = productInput.value.trim();
    const quantity = parseInt(quantityInput.value);
    const unit = unitInput.value;

    // Validate input
    if (!name) {
        showToast('Por favor, digite o nome do produto', 'error');
        productInput.focus();
        return;
    }

    if (quantity < 1) {
        showToast('A quantidade deve ser pelo menos 1', 'error');
        quantityInput.focus();
        return;
    }

    // Check for duplicate
    if (isProductDuplicate(name, unit)) {
        showToast('Este produto já está na lista com a mesma unidade', 'warning');
        productInput.focus();
        return;
    }

    // Create new product
    const newProduct = {
        id: Date.now(),
        name,
        quantity,
        unit,
        completed: false
    };

    // Add to array and update UI
    products.push(newProduct);
    saveHistoryState();
    saveProducts();
    renderProductList();
    updateStats();
    showToast('Produto adicionado', 'success');

    // Reset input
    productInput.value = '';
    quantityInput.value = '1';
    productInput.focus();
}

// Check if product with same name and unit already exists
function isProductDuplicate(name, unit) {
    return products.some(product => 
        product.name.toLowerCase() === name.toLowerCase() && 
        product.unit === unit
    );
}

// Get filtered products based on current filter
function getFilteredProducts() {
    switch(currentFilter) {
        case 'pending': 
            return products.filter(product => !product.completed);
        case 'completed': 
            return products.filter(product => product.completed);
        default: 
            return [...products];
    }
}

// Render the product list based on current filter
function renderProductList() {
    // Filter products
    const filteredProducts = getFilteredProducts();

    // Clear the list
    productList.innerHTML = '';

    // Add products to the list
    if (filteredProducts.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = currentFilter === 'all' 
            ? 'Sua lista está vazia' 
            : currentFilter === 'pending' 
                ? 'Nenhum item pendente' 
                : 'Nenhum item concluído';
        emptyMessage.classList.add('empty-message');
        productList.appendChild(emptyMessage);
    } else {
        filteredProducts.forEach(product => {
            const productItem = createProductElement(product);
            productList.appendChild(productItem);
        });
    }
}

// Create DOM element for a product
function createProductElement(product) {
    const li = document.createElement('li');
    li.className = `product-item ${product.completed ? 'completed' : ''}`;
    li.dataset.id = product.id;
    
    // Make item editable
    li.addEventListener('dblclick', () => {
        editProductItem(li, product);
    });

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'product-checkbox';
    checkbox.checked = product.completed;
    checkbox.addEventListener('change', () => toggleProductCompleted(product.id));

    // Product name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'product-name';
    nameSpan.textContent = product.name;

    // Product quantity
    const quantitySpan = document.createElement('span');
    quantitySpan.className = 'product-quantity';
    quantitySpan.textContent = `${product.quantity} ${product.unit}`;

    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'product-actions';
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editProductItem(li, product);
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteProduct(product.id);
    });

    // Assemble the element
    li.appendChild(checkbox);
    li.appendChild(nameSpan);
    li.appendChild(quantitySpan);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    li.appendChild(actionsDiv);

    return li;
}

// Edit product item
function editProductItem(listItem, product) {
    const nameSpan = listItem.querySelector('.product-name');
    const quantitySpan = listItem.querySelector('.product-quantity');
    const actionsDiv = listItem.querySelector('.product-actions');
    
    // Create input fields
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = product.name;
    nameInput.className = 'edit-input';
    
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.value = product.quantity;
    quantityInput.min = '1';
    quantityInput.className = 'edit-input';
    
    const unitSelect = document.createElement('select');
    unitSelect.className = 'edit-input';
    ['Unid', 'Kg', 'g', 'ml', 'L'].forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        if (unit === product.unit) option.selected = true;
        unitSelect.appendChild(option);
    });
    
    // Create save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = 'Salvar';
    
    // Create cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'Cancelar';
    
    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'edit-form';
    editForm.appendChild(nameInput);
    editForm.appendChild(quantityInput);
    editForm.appendChild(unitSelect);
    editForm.appendChild(saveBtn);
    editForm.appendChild(cancelBtn);
    
    // Replace content with edit form
    nameSpan.replaceWith(editForm);
    quantitySpan.style.visibility = 'hidden';
    actionsDiv.style.visibility = 'hidden';
    
    // Focus on name input
    nameInput.focus();
    
    // Save handler
    const saveHandler = () => {
        const newName = nameInput.value.trim();
        const newQuantity = parseInt(quantityInput.value);
        const newUnit = unitSelect.value;
        
        if (!newName) {
            showToast('O nome do produto não pode estar vazio', 'error');
            nameInput.focus();
            return;
        }
        
        if (newQuantity < 1) {
            showToast('A quantidade deve ser pelo menos 1', 'error');
            quantityInput.focus();
            return;
        }
        
        // Check for duplicate (excluding current product)
        const isDuplicate = products.some(p => 
            p.id !== product.id && 
            p.name.toLowerCase() === newName.toLowerCase() && 
            p.unit === newUnit
        );
        
        if (isDuplicate) {
            showToast('Já existe um produto com este nome e unidade', 'warning');
            return;
        }
        
        // Update product
        const productIndex = products.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
            products[productIndex].name = newName;
            products[productIndex].quantity = newQuantity;
            products[productIndex].unit = newUnit;
            
            saveHistoryState();
            saveProducts();
            renderProductList();
            updateStats();
            showToast('Produto atualizado', 'success');
        }
    };
    
    // Cancel handler
    const cancelHandler = () => {
        renderProductList();
    };
    
    // Event listeners
    saveBtn.addEventListener('click', saveHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    
    // Keyboard support
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveHandler();
    });
    
    quantityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveHandler();
    });
    
    unitSelect.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveHandler();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cancelHandler();
    }, { once: true });
}

// Toggle product completed status
function toggleProductCompleted(productId) {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        products[productIndex].completed = !products[productIndex].completed;
        saveHistoryState();
        saveProducts();
        updateStats();
        showToast(`Produto ${products[productIndex].completed ? 'marcado' : 'desmarcado'} como concluído`, 'success');
    }
}

// Delete a product
function deleteProduct(productId) {
    if (confirm('Tem certeza que deseja remover este produto da lista?')) {
        products = products.filter(p => p.id !== productId);
        saveHistoryState();
        saveProducts();
        renderProductList();
        updateStats();
        showToast('Produto removido', 'success');
    }
}

// Clear all completed products
function clearCompletedProducts() {
    if (confirm('Tem certeza que deseja remover todos os produtos concluídos?')) {
        products = products.filter(p => !p.completed);
        saveHistoryState();
        saveProducts();
        renderProductList();
        updateStats();
        showToast('Produtos concluídos removidos', 'success');
    }
}

// Update statistics
function updateStats() {
    const total = products.length;
    const completed = products.filter(p => p.completed).length;

    totalItems.textContent = `${total} ${total === 1 ? 'item' : 'itens'} na lista`;
    completedItems.textContent = `${completed} concluído${completed !== 1 ? 's' : ''}`;

    // Enable/disable clear completed button
    clearCompleted.disabled = completed === 0;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);