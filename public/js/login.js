document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm"); // form 
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const toastBody = document.getElementById("toastBody");
    const appToast = document.getElementById("appToast");
    const toast = new bootstrap.Toast(appToast);
    // DEFAULT BOOLEAN 
    let emailIsValid = false; 

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

    // Validate email 
    function validateEmail () {
        const emailInput = email.value.trim()
        emailIsValid = false
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

        if (!emailInput){
            showInvalid(email, "Email is required.");
        } else if (!regex.test(emailInput)) {
            showInvalid (email, "Please enter a valid email.")
        } else {
            showValid (email)
            emailIsValid = true
        }
        return emailIsValid;
    }
    email.addEventListener("input", validateEmail);
    // Submit if everything valid
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validateEmail())
            return
        //User information
        const data = {
            email: email.value.trim(),
            password: password.value,
        }
        const callback = (responseStatus, responseData) => {
            console.log("responseStatus:", responseStatus);
            if (responseStatus === 200 || responseStatus === 201) {
                // Set Toast to Success style
                toastBody.innerText = "Login Successful! Redirecting...";
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
                    toastBody.innerText = responseData.message || "Login failed!";
                    appToast.classList.remove("text-bg-success");
                    appToast.classList.add("text-bg-danger");
                    // Trigger Bootstrap Toast
                    const toast = new bootstrap.Toast(appToast);
                    toast.show();
            }
        };
        fetchMethod(currentUrl + "/api/users/login", callback, "POST", data);

        console.log("Valid. Proceed next.");
    });
});


