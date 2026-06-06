
// ============================================

// ========== GLOBAL VARIABLES ==========
let books = [];
let nextId = 1;
let currentUser = null;
let activityLog = [];
let payments = [];
let finePerDay = 100;
let freeDays = 7;
let trendChart = null;
let popularChart = null;

// ========== HELPER FUNCTIONS ==========
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function daysDifference(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateFine(borrowDate, dueDate, returnDate = null) {
    const endDate = returnDate || getTodayDate();
    const due = new Date(dueDate);
    const end = new Date(endDate);
    
    if (end <= due) return { daysLate: 0, fine: 0 };
    
    const daysLate = daysDifference(dueDate, endDate);
    const fine = daysLate * finePerDay;
    return { daysLate, fine };
}

function calculateDueDate(borrowDate, customDays = null) {
    const days = customDays || freeDays;
    const due = new Date(borrowDate);
    due.setDate(due.getDate() + days);
    return due.toISOString().split('T')[0];
}

function addActivity(action, details) {
    const activity = {
        id: Date.now(),
        action,
        details,
        user: currentUser,
        timestamp: new Date().toISOString()
    };
    activityLog.unshift(activity);
    if (activityLog.length > 100) activityLog.pop();
    saveToLocalStorage();
    renderRecentActivity();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `${icons[type]} ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== STORAGE ==========
function saveToLocalStorage() {
    const data = {
        books,
        nextId,
        activityLog,
        payments,
        finePerDay,
        freeDays
    };
    localStorage.setItem('librarySystem', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('librarySystem');
    if (stored) {
        const data = JSON.parse(stored);
        books = data.books || [];
        nextId = data.nextId || 1;
        activityLog = data.activityLog || [];
        payments = data.payments || [];
        finePerDay = data.finePerDay || 100;
        freeDays = data.freeDays || 7;
    }
    
    if (books.length === 0) {
        // Sample data
        const today = getTodayDate();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        
        books = [
            { id: nextId++, title: "Things Fall Apart", author: "Chinua Achebe", category: "Fiction", status: "available", borrowedBy: null, borrowDate: null, dueDate: null },
            { id: nextId++, title: "The Smart Money Method", author: "Stephen Clapham", category: "Business", status: "borrowed", borrowedBy: "John Doe", borrowDate: threeDaysAgo.toISOString().split('T')[0], dueDate: calculateDueDate(threeDaysAgo.toISOString().split('T')[0]) },
            { id: nextId++, title: "Telecom Networks Basics", author: "Sarah Johnson", category: "Telecom", status: "borrowed", borrowedBy: "Alice Musa", borrowDate: tenDaysAgo.toISOString().split('T')[0], dueDate: calculateDueDate(tenDaysAgo.toISOString().split('T')[0]) },
            { id: nextId++, title: "5G Technology Explained", author: "Dr. James Wilson", category: "Telecom", status: "available", borrowedBy: null, borrowDate: null, dueDate: null },
            { id: nextId++, title: "Data Analytics for Business", author: "Maria Garcia", category: "Technical", status: "available", borrowedBy: null, borrowDate: null, dueDate: null }
        ];
    }
    
    // Update finePerDay and freeDays display
    document.getElementById('finePerDay').value = finePerDay;
    document.getElementById('freeDays').value = freeDays;
}

// ========== RENDER FUNCTIONS ==========
function renderAll() {
    renderStats();
    renderAllBooksTable();
    renderBorrowDropdowns();
    renderReturnDropdowns();
    renderExtendDropdown();
    renderFinesTable();
    renderPaymentHistory();
    renderFinancialReport();
    renderPerformanceMetrics();
    renderRecentActivity();
    updateCharts();
}

function renderStats() {
    const totalBooks = books.length;
    const borrowedBooks = books.filter(b => b.status === 'borrowed').length;
    const lateBooks = books.filter(b => {
        if (b.status !== 'borrowed') return false;
        const { fine } = calculateFine(b.borrowDate, b.dueDate);
        return fine > 0;
    }).length;
    const totalFines = books.reduce((sum, book) => {
        if (book.status !== 'borrowed') return sum;
        const { fine } = calculateFine(book.borrowDate, book.dueDate);
        return sum + fine;
    }, 0);
    
    document.getElementById('totalBooksStat').textContent = totalBooks;
    document.getElementById('borrowedBooksStat').textContent = borrowedBooks;
    document.getElementById('lateBooksStat').textContent = lateBooks;
    document.getElementById('totalFinesStat').textContent = `₦${totalFines.toLocaleString()}`;
}

function renderAllBooksTable() {
    const tbody = document.getElementById('allBooksBody');
    const searchTerm = document.getElementById('searchBooks')?.value.toLowerCase() || '';
    const filterStatus = document.getElementById('filterStatus')?.value || 'all';
    
    let filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
                             book.author.toLowerCase().includes(searchTerm) ||
                             (book.borrowedBy && book.borrowedBy.toLowerCase().includes(searchTerm));
        const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
        return matchesSearch && matchesStatus;
    });
    
    if (filteredBooks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No books found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredBooks.map(book => {
        let fine = 0;
        if (book.status === 'borrowed') {
            fine = calculateFine(book.borrowDate, book.dueDate).fine;
        }
        return `
            <tr>
                <td>${escapeHtml(book.title)}</td>
                <td>${escapeHtml(book.author)}</td>
                <td>${book.category}</td>
                <td><span class="status-${book.status}">${book.status === 'borrowed' ? '📕 Borrowed' : '✅ Available'}</span></td>
                <td>${book.borrowedBy ? escapeHtml(book.borrowedBy) : '—'}</td>
                <td>${book.dueDate || '—'}</td>
                <td style="color:${fine > 0 ? '#dc2626' : '#6b7280'}">${fine > 0 ? `₦${fine.toLocaleString()}` : '—'}</td>
                <td>
                    ${book.status === 'available' ? `<button class="delete-btn" data-id="${book.id}"><i class="fas fa-trash"></i></button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            deleteBook(id);
        });
    });
}

function renderBorrowDropdowns() {
    const availableBooks = books.filter(b => b.status === 'available');
    const select = document.getElementById('borrowSelect');
    select.innerHTML = '<option value="">-- Select a book --</option>' +
        availableBooks.map(book => `<option value="${book.id}">${escapeHtml(book.title)} by ${escapeHtml(book.author)} (${book.category})</option>`).join('');
}

function renderReturnDropdowns() {
    const borrowedBooks = books.filter(b => b.status === 'borrowed');
    const select = document.getElementById('returnSelect');
    select.innerHTML = '<option value="">-- Select a book --</option>' +
        borrowedBooks.map(book => `<option value="${book.id}">${escapeHtml(book.title)} (borrowed by ${escapeHtml(book.borrowedBy)})</option>`).join('');
}

function renderExtendDropdown() {
    const borrowedBooks = books.filter(b => b.status === 'borrowed');
    const select = document.getElementById('extendSelect');
    if (select) {
        select.innerHTML = '<option value="">-- Select a book --</option>' +
            borrowedBooks.map(book => `<option value="${book.id}">${escapeHtml(book.title)} - ${escapeHtml(book.borrowedBy)} (due: ${book.dueDate})</option>`).join('');
    }
}

function renderFinesTable() {
    const tbody = document.getElementById('finesTableBody');
    const booksWithFines = books.filter(book => {
        if (book.status !== 'borrowed') return false;
        const { fine } = calculateFine(book.borrowDate, book.dueDate);
        return fine > 0;
    });
    
    if (booksWithFines.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No unpaid fines</td></tr>';
        return;
    }
    
    tbody.innerHTML = booksWithFines.map(book => {
        const { daysLate, fine } = calculateFine(book.borrowDate, book.dueDate);
        const isPaid = payments.some(p => p.bookId === book.id && p.amount === fine);
        return `
            <tr>
                <td>${escapeHtml(book.title)}</td>
                <td>${escapeHtml(book.borrowedBy)}</td>
                <td>₦${fine.toLocaleString()}</td>
                <td>${daysLate}</td>
                <td>${isPaid ? 'Paid' : 'Unpaid'}</td>
                <td>${!isPaid ? `<button class="pay-btn" data-id="${book.id}" data-fine="${fine}"><i class="fas fa-check"></i> Mark Paid</button>` : '—'}</td>
            </table>
        `;
    }).join('');
    
    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookId = parseInt(btn.getAttribute('data-id'));
            const fine = parseInt(btn.getAttribute('data-fine'));
            markFinePaid(bookId, fine);
        });
    });
}

function markFinePaid(bookId, amount) {
    payments.push({
        id: Date.now(),
        bookId,
        amount,
        date: getTodayDate(),
        paidBy: currentUser
    });
    addActivity('Fine Paid', `Paid ₦${amount} for book ID ${bookId}`);
    showToast(`₦${amount} fine marked as paid!`, 'success');
    saveToLocalStorage();
    renderAll();
}

function renderPaymentHistory() {
    const container = document.getElementById('paymentHistory');
    if (payments.length === 0) {
        container.innerHTML = '<p>No payment history</p>';
        return;
    }
    
    container.innerHTML = payments.slice(-10).reverse().map(p => `
        <div class="history-item">
            <span>💰 Paid ₦${p.amount.toLocaleString()}</span>
            <span class="activity-time">${p.date} by ${p.paidBy}</span>
        </div>
    `).join('');
}

function renderFinancialReport() {
    const totalFines = books.reduce((sum, book) => {
        if (book.status !== 'borrowed') return sum;
        const { fine } = calculateFine(book.borrowDate, book.dueDate);
        return sum + fine;
    }, 0);
    const paidFines = payments.reduce((sum, p) => sum + p.amount, 0);
    const unpaidFines = totalFines - paidFines;
    
    const container = document.getElementById('financialReport');
    container.innerHTML = `
        <div class="stats-grid" style="margin-bottom:0">
            <div class="stat-card"><div><h3>₦${totalFines.toLocaleString()}</h3><p>Total Fines Generated</p></div></div>
            <div class="stat-card"><div><h3>₦${paidFines.toLocaleString()}</h3><p>Total Collected</p></div></div>
            <div class="stat-card"><div><h3>₦${unpaidFines.toLocaleString()}</h3><p>Outstanding</p></div></div>
            <div class="stat-card"><div><h3>${books.length}</h3><p>Total Books</p></div></div>
        </div>
    `;
}

function renderPerformanceMetrics() {
    const borrowedBooks = books.filter(b => b.status === 'borrowed').length;
    const availableBooks = books.filter(b => b.status === 'available').length;
    const utilization = books.length > 0 ? ((borrowedBooks / books.length) * 100).toFixed(1) : 0;
    
    const container = document.getElementById('performanceMetrics');
    container.innerHTML = `
        <div class="stats-grid" style="margin-bottom:0">
            <div class="stat-card"><div><h3>${utilization}%</h3><p>Collection Utilization</p></div></div>
            <div class="stat-card"><div><h3>${activityLog.length}</h3><p>Total Transactions</p></div></div>
            <div class="stat-card"><div><h3>${freeDays}</h3><p>Free Borrow Days</p></div></div>
            <div class="stat-card"><div><h3>₦${finePerDay}</h3><p>Fine Rate / Day</p></div></div>
        </div>
    `;
}

function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (activityLog.length === 0) {
        container.innerHTML = '<p>No recent activity</p>';
        return;
    }
    
    container.innerHTML = activityLog.slice(0, 10).map(activity => `
        <div class="activity-item">
            <div>
                <strong>${activity.action}</strong><br>
                <small>${activity.details}</small>
            </div>
            <span class="activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
        </div>
    `).join('');
}

// ========== CHARTS ==========
function updateCharts() {
    // Borrowing trends (last 7 days simulation)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    
    const borrowCounts = last7Days.map(() => Math.floor(Math.random() * 10) + 1);
    
    if (trendChart) trendChart.destroy();
    const trendCtx = document.getElementById('trendChart')?.getContext('2d');
    if (trendCtx) {
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Books Borrowed',
                    data: borrowCounts,
                    borderColor: '#2563eb',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(37, 99, 235, 0.1)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
    
    // Popular books
    const bookCounts = {};
    books.forEach(book => {
        const category = book.category;
        bookCounts[category] = (bookCounts[category] || 0) + 1;
    });
    
    if (popularChart) popularChart.destroy();
    const popularCtx = document.getElementById('popularChart')?.getContext('2d');
    if (popularCtx) {
        popularChart = new Chart(popularCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(bookCounts),
                datasets: [{
                    data: Object.values(bookCounts),
                    backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                }]
            },
            options: { responsive: true }
        });
    }
}

// ========== CORE FUNCTIONS ==========
function addBook(title, author, category) {
    if (!title.trim() || !author.trim()) {
        showToast('Please enter title and author', 'error');
        return false;
    }
    
    const newBook = {
        id: nextId++,
        title: title.trim(),
        author: author.trim(),
        category: category,
        status: 'available',
        borrowedBy: null,
        borrowDate: null,
        dueDate: null
    };
    
    books.push(newBook);
    addActivity('Book Added', `Added "${title}" by ${author}`);
    showToast(`"${title}" added to library!`, 'success');
    saveToLocalStorage();
    renderAll();
    return true;
}

function borrowBook(bookId, borrowerName, customDueDate = null) {
    if (!borrowerName.trim()) {
        showToast('Please enter borrower name', 'error');
        return false;
    }
    
    const book = books.find(b => b.id === bookId);
    if (!book || book.status !== 'available') {
        showToast('Book not available', 'error');
        return false;
    }
    
    const borrowDate = getTodayDate();
    const dueDate = customDueDate || calculateDueDate(borrowDate);
    
    book.status = 'borrowed';
    book.borrowedBy = borrowerName.trim();
    book.borrowDate = borrowDate;
    book.dueDate = dueDate;
    
    addActivity('Book Borrowed', `"${book.title}" borrowed by ${borrowerName}, due ${dueDate}`);
    showToast(`"${book.title}" borrowed by ${borrowerName}. Due: ${dueDate}`, 'success');
    saveToLocalStorage();
    renderAll();
    return true;
}

function returnBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book || book.status !== 'borrowed') {
        showToast('Book not currently borrowed', 'error');
        return;
    }
    
    const returnDate = getTodayDate();
    const { daysLate, fine } = calculateFine(book.borrowDate, book.dueDate);
    
    let message = `"${book.title}" returned by ${book.borrowedBy}\n`;
    message += `Due date: ${book.dueDate}\nReturned: ${returnDate}\n`;
    
    if (fine > 0) {
        message += `⚠️ LATE by ${daysLate} day(s). Fine: ₦${fine.toLocaleString()}`;
        showToast(`⚠️ Late return! Fine: ₦${fine.toLocaleString()}`, 'warning');
    } else {
        message += `✅ Returned on time. No fine.`;
        showToast(`"${book.title}" returned on time!`, 'success');
    }
    
    alert(message);
    
    addActivity('Book Returned', `"${book.title}" returned by ${book.borrowedBy}${fine > 0 ? `, fine: ₦${fine}` : ''}`);
    
    book.status = 'available';
    book.borrowedBy = null;
    book.borrowDate = null;
    book.dueDate = null;
    
    saveToLocalStorage();
    renderAll();
}

function extendBorrowPeriod(bookId, extraDays) {
    const book = books.find(b => b.id === bookId);
    if (!book || book.status !== 'borrowed') {
        showToast('Book not currently borrowed', 'error');
        return;
    }
    
    const newDueDate = new Date(book.dueDate);
    newDueDate.setDate(newDueDate.getDate() + extraDays);
    book.dueDate = newDueDate.toISOString().split('T')[0];
    
    addActivity('Period Extended', `Extended "${book.title}" by ${extraDays} days, new due: ${book.dueDate}`);
    showToast(`Extended by ${extraDays} days! New due: ${book.dueDate}`, 'success');
    saveToLocalStorage();
    renderAll();
}

function deleteBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;
    
    if (confirm(`Delete "${book.title}"?`)) {
        books = books.filter(b => b.id !== id);
        addActivity('Book Deleted', `Deleted "${book.title}"`);
        showToast(`"${book.title}" deleted`, 'info');
        saveToLocalStorage();
        renderAll();
    }
}

// ========== EXPORT FUNCTIONS ==========
function exportToCSV() {
    let csvRows = [['ID', 'Title', 'Author', 'Category', 'Status', 'Borrower', 'Borrow Date', 'Due Date'].join(',')];
    
    books.forEach(book => {
        csvRows.push([
            book.id,
            `"${book.title.replace(/"/g, '""')}"`,
            `"${book.author.replace(/"/g, '""')}"`,
            book.category,
            book.status,
            book.borrowedBy ? `"${book.borrowedBy.replace(/"/g, '""')}"` : '',
            book.borrowDate || '',
            book.dueDate || ''
        ].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `library_export_${getTodayDate()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('CSV exported successfully!', 'success');
}

function exportToJSON() {
    const data = { books, payments, activityLog, finePerDay, freeDays };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `library_backup_${getTodayDate()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('JSON backup created!', 'success');
}

function printReport() {
    window.print();
}

function backupData() {
    exportToJSON();
}

function restoreFromBackup(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            books = data.books || [];
            nextId = data.nextId || Math.max(...books.map(b => b.id), 0) + 1;
            payments = data.payments || [];
            activityLog = data.activityLog || [];
            finePerDay = data.finePerDay || 100;
            freeDays = data.freeDays || 7;
            saveToLocalStorage();
            renderAll();
            showToast('Backup restored successfully!', 'success');
        } catch (err) {
            showToast('Invalid backup file', 'error');
        }
    };
    reader.readAsText(file);
}

function clearOldData() {
    const retentionDays = parseInt(document.getElementById('retentionDays').value) || 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const oldActivities = activityLog.filter(a => new Date(a.timestamp) > cutoffDate);
    activityLog = oldActivities;
    
    showToast(`Cleared activities older than ${retentionDays} days`, 'success');
    saveToLocalStorage();
    renderAll();
}

// ========== AUTHENTICATION ==========
const users = {
    admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
    librarian: { password: 'lib123', role: 'staff', name: 'Librarian' },
    viewer: { password: 'view123', role: 'viewer', name: 'Viewer' }
};

function login(username, password) {
    const user = users[username];
    if (user && user.password === password) {
        currentUser = username;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('currentUserDisplay').textContent = user.name;
        
        // Restrict features based on role
        const isAdmin = user.role === 'admin';
        const isStaff = user.role === 'staff';
        const isViewer = user.role === 'viewer';
        
        document.getElementById('extendSection').style.display = isAdmin || isStaff ? 'block' : 'none';
        document.getElementById('settingsTab').style.display = isAdmin ? 'block' : 'none';
        
        addActivity('Login', `User ${username} logged in`);
        renderAll();
        showToast(`Welcome back, ${user.name}!`, 'success');
    } else {
        showToast('Invalid username or password', 'error');
    }
}

function logout() {
    addActivity('Logout', `User ${currentUser} logged out`);
    currentUser = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

// ========== DARK MODE ==========
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('#darkModeToggle i');
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('darkMode', 'enabled');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('darkMode', 'disabled');
    }
}

// ========== SETTINGS ==========
function updateFineRate() {
    const newRate = parseInt(document.getElementById('finePerDay').value);
    if (newRate >= 0) {
        finePerDay = newRate;
        saveToLocalStorage();
        renderAll();
        showToast(`Fine rate updated to ₦${finePerDay}/day`, 'success');
    }
}

function updateFreeDays() {
    const newDays = parseInt(document.getElementById('freeDays').value);
    if (newDays >= 0) {
        freeDays = newDays;
        saveToLocalStorage();
        renderAll();
        showToast(`Free period updated to ${freeDays} days`, 'success');
    }
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    
    // Check dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
    
    // Login
    document.getElementById('loginBtn').addEventListener('click', () => {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        login(username, password);
    });
    
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login(document.getElementById('loginUsername').value, e.target.value);
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Dark mode
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Tab switching
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(`${tab}Tab`).classList.add('active');
        });
    });
    
    // Book management
    document.getElementById('addBookBtn').addEventListener('click', () => {
        const title = document.getElementById('bookTitle').value;
        const author = document.getElementById('bookAuthor').value;
        const category = document.getElementById('bookCategory').value;
        if (addBook(title, author, category)) {
            document.getElementById('bookTitle').value = '';
            document.getElementById('bookAuthor').value = '';
        }
    });
    
    // Borrow
    document.getElementById('borrowBtn').addEventListener('click', () => {
        const bookId = parseInt(document.getElementById('borrowSelect').value);
        const borrower = document.getElementById('borrowerName').value;
        const customDue = document.getElementById('customDueDate').value;
        if (borrowBook(bookId, borrower, customDue || null)) {
            document.getElementById('borrowerName').value = '';
            document.getElementById('customDueDate').value = '';
        }
    });
    
    // Return
    document.getElementById('returnBtn').addEventListener('click', () => {
        const bookId = parseInt(document.getElementById('returnSelect').value);
        if (bookId) returnBook(bookId);
        else showToast('Select a book to return', 'error');
    });
    
    // Extend
    document.getElementById('extendBtn').addEventListener('click', () => {
        const bookId = parseInt(document.getElementById('extendSelect').value);
        const days = parseInt(document.getElementById('extendDays').value);
        if (bookId && days > 0) extendBorrowPeriod(bookId, days);
        else showToast('Select a book and enter valid days', 'error');
    });
    
    // Search and filter
    document.getElementById('searchBooks').addEventListener('input', () => renderAllBooksTable());
    document.getElementById('filterStatus').addEventListener('change', () => renderAllBooksTable());
    
    // Reports
    document.getElementById('exportCSVBtn').addEventListener('click', exportToCSV);
    document.getElementById('exportJSONBtn').addEventListener('click', exportToJSON);
    document.getElementById('printReportBtn').addEventListener('click', printReport);
    
    // Settings
    document.getElementById('updateFineBtn').addEventListener('click', updateFineRate);
    document.getElementById('updateFreeDaysBtn').addEventListener('click', updateFreeDays);
    document.getElementById('backupDataBtn').addEventListener('click', backupData);
    document.getElementById('restoreDataBtn').addEventListener('click', () => {
        const file = document.getElementById('restoreFile').files[0];
        if (file) restoreFromBackup(file);
        else showToast('Select a backup file first', 'error');
    });
    document.getElementById('clearOldDataBtn').addEventListener('click', clearOldData);
    
    // Enter key handlers
    document.getElementById('bookTitle').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('addBookBtn').click();
    });
});