// Common logic for checking auth
function checkAuth(requiredRole) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
        window.location.href = '/auth/login';
        return null;
    }

    if (requiredRole && role !== requiredRole) {
        // Allow multi-role check for employee dashboard
        if (Array.isArray(requiredRole)) {
            if (!requiredRole.includes(role)) {
                alert('Access Denied: You do not have permission to view this page.');
                window.location.href = '/';
                return null;
            }
        } else {
            alert('Access Denied: You do not have permission to view this page.');
            window.location.href = '/';
            return null;
        }
    }

    return token;
}

function logout() {
    localStorage.clear();
    window.location.href = '/auth/login';
}

// Fetch helper with auth header
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        throw new Error('No token');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    // Only set Content-Type to JSON if not uploading files
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    // Only logout on 401 (token expired/invalid), NOT on 403 (access denied)
    if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please login again.');
    }

    return response;
}

// Helper to show toast messages
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Helper to format currency
function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2) + ' TND';
}

// Helper to format date
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
}
