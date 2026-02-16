document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phone').value,
        passwordHash: document.getElementById('password').value,
        role: 'CLIENT' // Enforce Client registration
    };

    const errorDiv = document.getElementById('errorMessage');

    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            // Smooth transition to login
            showToast('Account created successfully! Redirecting to sign in...', 'success');
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 1500);
        } else {
            // Try to parse error message
            const text = await response.text();
            try {
                const json = JSON.parse(text);
                errorDiv.textContent = json.message || 'Registration failed.';
            } catch (e) {
                errorDiv.textContent = text || 'Registration failed.';
            }
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        console.error('Registration error:', error);
    }
});
