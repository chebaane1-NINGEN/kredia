document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('status', data.status);

            // Redirect based on role
            const userRole = data.role.toUpperCase();
            switch (userRole) {
                case 'CLIENT':
                    window.location.href = '/dashboard/client';
                    break;
                case 'ADMIN':
                    window.location.href = '/dashboard/admin';
                    break;
                case 'AGENT':
                case 'AUDITOR':
                case 'EMPLOYEE':
                    window.location.href = '/dashboard/employee';
                    break;
                default:
                    errorDiv.textContent = 'Role not supported: ' + data.role;
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            errorDiv.textContent = errorData.message || 'Login failed. Invalid email or password.';
        }
    } catch (error) {
        errorDiv.textContent = 'Service unavailable. Please try again later.';
        console.error('Login error:', error);
    }
});
