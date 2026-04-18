document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registerForm"); // form 
    const username = document.getElementById("username"); // username
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const toastBody = document.getElementById("toastBody");
    const appToast = document.getElementById("appToast");
    const toast = new bootstrap.Toast(appToast);

    // DEFAULT BOOLEAN 
    let usernameIsValid = false;
    let emailIsValid = false;
    let passwordIsValid = false;
    let confirmPasswordIsValid = false;

    // Show Invalid Message 
    function showInvalid(input, message) {
        input.classList.add("is-invalid");
        const feedback = input.parentElement.querySelector(".invalid-feedback");
        feedback.textContent = message;
    }
    // Show Valid Messsage 
    function showValid(input) {
        input.classList.remove("is-invalid");
    }

    // Validate username 
    function validateUsername() {
        const usernameInput = username.value.trim();
        usernameIsValid = false;

        if (!usernameInput) {
            showInvalid(username, "Username is required.");
        } else if (!/^[a-zA-Z0-9_]+$/.test(usernameInput)) {
            showInvalid(username, "Only letters, numbers and underscore (_) allowed.");
        } else if (usernameInput.length < 3) {
            showInvalid(username, "Username must be at least 3 characters.");
        } else {
            showValid(username);
            usernameIsValid = true;
        }
        return usernameIsValid;
    }

    // Validate email 
    function validateEmail() {
        const emailInput = email.value.trim()
        emailIsValid = false
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

        if (!emailInput) {
            showInvalid(email, "Email is required.");
        } else if (!regex.test(emailInput)) {
            showInvalid(email, "Please enter a valid email.")
        } else {
            showValid(email)
            emailIsValid = true
        }
        return emailIsValid;
    }

    // Validate password 
    function validatePassword() {
        const passwordInput = password.value
        passwordIsValid = false

        if (!passwordInput) {
            showInvalid(password, "Password is required.");
        }
        else if (passwordInput.length < 6) {
            showInvalid(password, "Password must be at least 6 characters.");
        }
        else if (!/(?=.*[A-Za-z])(?=.*[0-9])/.test(passwordInput)) {
            showInvalid(password, "Password must contain at least one letter and one number.");
        }
        else {
            showValid(password);
            passwordIsValid = true;
        }
        return passwordIsValid;
    }

    function validateConfirmPassword() {
        const passwordInput = password.value
        const confirmPasswordInput = confirmPassword.value
        confirmPasswordIsValid = false

        if (!confirmPasswordInput) {
            showInvalid(confirmPassword, "Please confirm your password");
        } else if (passwordInput !== confirmPasswordInput) {
            showInvalid(confirmPassword, "Password do not match.");
        } else {
            showValid(confirmPassword)
            confirmPasswordIsValid = true
        }
        return confirmPasswordIsValid;
    }
    // Live validation
    username.addEventListener("input", validateUsername);
    email.addEventListener("input", validateEmail);
    password.addEventListener("input", validatePassword);
    confirmPassword.addEventListener("input", validateConfirmPassword);

    // Submit if everything valid
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validateUsername() || !validateEmail() || !validatePassword() || !validateConfirmPassword())
            return
        //User information
        const data = {
            username: username.value.trim(),
            email: email.value.trim(),
            password: password.value,
        }
        const callback = (responseStatus, responseData) => {
            console.log("responseStatus:", responseStatus);
            if (responseStatus === 200 || responseStatus === 201) {
                // Set Toast to Success style
                toastBody.innerText = "Registration Successful! Redirecting...";
                appToast.classList.remove("text-bg-danger");
                appToast.classList.add("text-bg-success");
                // Show the Toast
                toast.show();
                if (responseData.token) {
                    localStorage.setItem("token", responseData.token);
                    setTimeout(() => {
                                    window.location.href = "dashboard.html";
                                }, 2000);
                }
            }
            else {
                    toastBody.innerText = responseData.message || "Registration failed!";
                    appToast.classList.remove("text-bg-success");
                    appToast.classList.add("text-bg-danger");
                    // Trigger Bootstrap Toast
                    const toast = new bootstrap.Toast(appToast);
                    toast.show();
            }
        };
        fetchMethod(currentUrl + "/api/users/register", callback, "POST", data);
        console.log("Valid. Proceed next.");
    });
});


