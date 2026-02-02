document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get values and trim whitespace
    const collegeId = document.getElementById('collegeId').value.trim();
    const passwordInput = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMessage');

    // Reset error message state
    errorMsg.style.display = 'none';

    try {
        // Use api.js to send login request
        // Keys must be snake_case to match Backend routes/auth.js
        const responseData = await api.login({ 
            college_id: collegeId, 
            password: passwordInput 
        });

        // Save Auth Data
        localStorage.setItem('token', responseData.token);
        localStorage.setItem('user', JSON.stringify(responseData.user));

        // Redirect based on Role
        const userRole = responseData.user.role;
        
        if (userRole === 'admin') {
            window.location.href = '../html/admin.html';
        } else if (userRole === 'staff') {
            window.location.href = '../html/staff.html';
        } else {
            // Students and Professors/Teachers use the same ordering dashboard
            window.location.href = '../html/student.html';
        }
        
    } catch (err) {
        // Display error message from server or default
        errorMsg.style.display = 'block';
        errorMsg.innerText = err.response?.data?.message || "Login failed. Please check your credentials.";
    }
});