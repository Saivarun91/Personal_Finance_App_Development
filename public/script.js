const API_URL = 'http://localhost:3000/api/users';
const userForm = document.getElementById('userForm');
const usersList = document.getElementById('usersList');
const submitBtn = document.getElementById('submitBtn');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const totalUsersElement = document.getElementById('totalUsers');
const avgAgeElement = document.getElementById('avgAge');

// Modal elements
const editModal = document.getElementById('editModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModalBtn = document.querySelector('.close-modal');
const editForm = document.getElementById('editForm');
const cancelBtn = document.getElementById('cancelBtn');
const updateBtn = document.getElementById('updateBtn');

// Store all users for filtering
let allUsers = [];

// Check for saved theme preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to DOM
    document.querySelector('.container').appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Open modal
function openModal() {
    editModal.classList.add('active');
    modalBackdrop.classList.add('active');
    document.body.classList.add('modal-open');
}

// Close modal
function closeModal() {
    editModal.classList.remove('active');
    modalBackdrop.classList.remove('active');
    document.body.classList.remove('modal-open');
    editForm.reset();
}

// Update stats
function updateStats(users) {
    // Update total users count
    totalUsersElement.textContent = users.length;
    
    // Calculate average age
    const usersWithAge = users.filter(user => user.age);
    if (usersWithAge.length > 0) {
        const totalAge = usersWithAge.reduce((sum, user) => sum + parseInt(user.age), 0);
        const avgAge = Math.round(totalAge / usersWithAge.length);
        avgAgeElement.textContent = avgAge;
    } else {
        avgAgeElement.textContent = 'N/A';
    }
}

// Filter users based on search input
function filterUsers(searchTerm) {
    if (!searchTerm) {
        displayUsers(allUsers);
        return;
    }
    
    const filteredUsers = allUsers.filter(user => {
        const nameMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || emailMatch;
    });
    
    displayUsers(filteredUsers);
    
    // Show message if no results
    if (filteredUsers.length === 0) {
        usersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No users found</h3>
                <p>No users match your search criteria. Try a different search term.</p>
            </div>
        `;
    }
}

// Fetch and display users
async function fetchUsers() {
    try {
        // Show loading state
        usersList.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading users...</p>
            </div>
        `;
        
        const response = await fetch(API_URL);
        const users = await response.json();
        
        // Store all users for filtering
        allUsers = users;
        
        // Update stats
        updateStats(users);
        
        if (users.length === 0) {
            usersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No users found</h3>
                    <p>Add a new user to get started.</p>
                    <button id="addFirstUserBtn" class="add-first-user-btn">
                        <i class="fas fa-user-plus"></i> Add Your First User
                    </button>
                </div>
            `;
            
            // Add event listener to the "Add Your First User" button
            document.getElementById('addFirstUserBtn').addEventListener('click', () => {
                document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
                document.getElementById('name').focus();
            });
            
            return;
        }
        
        displayUsers(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        usersList.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load users</h3>
                <p>There was an error loading the users. Please try again.</p>
                <button id="retryBtn" class="retry-btn">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
        
        // Add event listener to the retry button
        document.getElementById('retryBtn').addEventListener('click', fetchUsers);
    }
}

// Display users in the list
function displayUsers(users) {
    usersList.innerHTML = '';
    
    users.forEach((user, index) => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-info">
                <h3><i class="fas fa-user-circle"></i> ${user.name}</h3>
                <p><i class="fas fa-envelope"></i> ${user.email}</p>
                <p><i class="fas fa-birthday-cake"></i> Age: ${user.age || 'N/A'}</p>
            </div>
            <div class="user-actions">
                <button class="edit-btn" data-id="${user.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-btn" data-id="${user.id}">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;
        usersList.appendChild(userCard);
        
        // Add animation with delay based on index
        setTimeout(() => {
            userCard.classList.add('visible');
        }, 50 * index);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editUser(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(btn.getAttribute('data-id')));
    });
}

// Handle form submission for adding a new user
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Processing...</span>';
    submitBtn.disabled = true;
    
    const userData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        age: document.getElementById('age').value || null
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        showNotification('User added successfully!');
        userForm.reset();
        fetchUsers();
        
        // Clear search if any
        searchInput.value = '';
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Error saving user. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> <span>Save User</span>';
    }
});

// Edit user - open modal with user data
async function editUser(id) {
    try {
        // Show loading state
        const editBtn = document.querySelector(`.edit-btn[data-id="${id}"]`);
        if (editBtn) {
            const originalText = editBtn.innerHTML;
            editBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            editBtn.disabled = true;
        }
        
        const response = await fetch(`${API_URL}/${id}`);
        const user = await response.json();
        
        // Populate edit form
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editName').value = user.name;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editAge').value = user.age || '';
        
        // Open modal
        openModal();
        
        // Focus on first field
        document.getElementById('editName').focus();
        
    } catch (error) {
        console.error('Error fetching user:', error);
        showNotification('Error loading user data. Please try again.', 'error');
    } finally {
        // Reset edit button
        const editBtn = document.querySelector(`.edit-btn[data-id="${id}"]`);
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.disabled = false;
        }
    }
}

// Handle edit form submission
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    updateBtn.disabled = true;
    
    const userId = document.getElementById('editUserId').value;
    const userData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        age: document.getElementById('editAge').value || null
    };

    try {
        await fetch(`${API_URL}/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        showNotification('User updated successfully!');
        closeModal();
        fetchUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        showNotification('Error updating user. Please try again.', 'error');
    } finally {
        updateBtn.disabled = false;
        updateBtn.innerHTML = '<i class="fas fa-save"></i> Update User';
    }
});

// Delete user
async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            // Show loading state
            const deleteBtn = document.querySelector(`.delete-btn[data-id="${id}"]`);
            if (deleteBtn) {
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                deleteBtn.disabled = true;
            }
            
            const userCard = deleteBtn.closest('.user-card');
            if (userCard) {
                userCard.classList.add('deleting');
            }
            
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            showNotification('User deleted successfully!');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Error deleting user. Please try again.', 'error');
        }
    }
}

// Toggle dark/light theme
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    // Update icon
    if (document.body.classList.contains('dark-mode')) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('darkMode', 'true');
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', 'false');
    }
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    filterUsers(e.target.value);
});

// Event listeners for modal
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('active')) {
        closeModal();
    }
});

// Add dark mode styles
const darkModeStyles = document.createElement('style');
darkModeStyles.textContent = `
    body.dark-mode {
        background-color: #1e293b;
        color: #f1f5f9;
    }
    
    body.dark-mode::before {
        background-image: 
            radial-gradient(#ffffff08 1px, transparent 1px),
            radial-gradient(#ffffff08 1px, transparent 1px);
    }
    
    body.dark-mode .app-header,
    body.dark-mode .app-footer {
        background-color: #0f172a;
        border-color: #334155;
    }
    
    body.dark-mode .form-container,
    body.dark-mode .users-container,
    body.dark-mode .stat-card,
    body.dark-mode .user-card,
    body.dark-mode .modal-content,
    body.dark-mode .notification {
        background-color: #1e293b;
        border-color: #334155;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
    }
    
    body.dark-mode h1,
    body.dark-mode h2,
    body.dark-mode h3,
    body.dark-mode label {
        color: #f1f5f9;
    }
    
    body.dark-mode .user-info p,
    body.dark-mode .stat-label,
    body.dark-mode .app-footer p {
        color: #94a3b8;
    }
    
    body.dark-mode input,
    body.dark-mode .search-input {
        background-color: #334155;
        border-color: #475569;
        color: #f1f5f9;
    }
    
    body.dark-mode input:focus {
        border-color: var(--primary-color);
        background-color: #2c3e50;
    }
    
    body.dark-mode .theme-toggle {
        color: #f1f5f9;
    }
    
    body.dark-mode .theme-toggle:hover {
        background-color: #334155;
    }
    
    body.dark-mode .cancel-btn {
        background-color: #475569;
        color: #f1f5f9;
    }
    
    body.dark-mode .cancel-btn:hover {
        background-color: #64748b;
    }
    
    body.dark-mode .no-users,
    body.dark-mode .error {
        background-color: #334155;
    }
    
    body.dark-mode .search-icon {
        color: #94a3b8;
    }
    
    body.dark-mode .empty-state {
        color: #94a3b8;
    }
`;
document.head.appendChild(darkModeStyles);

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        background: white;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 350px;
        border-left: 4px solid;
    }
    
    .notification.success {
        border-color: var(--success-color);
    }
    
    .notification.error {
        border-color: var(--danger-color);
    }
    
    .notification.warning {
        border-color: var(--warning-color);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .notification.success i {
        color: var(--success-color);
    }
    
    .notification.error i {
        color: var(--danger-color);
    }
    
    .notification.warning i {
        color: var(--warning-color);
    }
    
    .notification.fade-out {
        animation: slideOut 0.5s ease forwards;
    }
    
    .user-card {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .user-card.visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    .user-card.deleting {
        opacity: 0.5;
        pointer-events: none;
    }
    
    .loading {
        text-align: center;
        padding: 20px;
        color: var(--text-light);
    }
    
    .no-users, .error {
        text-align: center;
        padding: 30px;
        color: var(--text-light);
        background: #f8fafc;
        border-radius: var(--border-radius);
    }
    
    .error {
        color: var(--danger-color);
        background: rgba(239, 68, 68, 0.1);
    }
    
    .retry-btn, .add-first-user-btn {
        margin-top: 1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background-color: var(--primary-color);
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initial load
fetchUsers(); 