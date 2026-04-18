document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  // Redirect if not logged in
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  // --- TOAST HELPER ---
  function showToast(message, type = "success") {
    const toastEl = document.getElementById("appToast");
    const toastBody = document.getElementById("toastBody");
    if (!toastEl) return;

    toastEl.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning");
    if (type === "success") toastEl.classList.add("text-bg-success");
    if (type === "error") toastEl.classList.add("text-bg-danger");
    if (type === "warning") toastEl.classList.add("text-bg-warning");

    toastBody.innerText = message;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
    toast.show();
  }

  // Get point 
  const callbackForUserInfo = (responseStatus, responseData) => {
    console.log("responseStatus:", responseStatus);
    console.log("responseData:", responseData);
    if (responseStatus === 200) {
      const { username, email, points } = responseData;
      document.getElementById("username").value = username || "";
      document.getElementById("email").value = email || "";
      const userPoints = document.getElementById("pointsText");
      userPoints.innerHTML = `
            <div class="d-flex align-items-baseline">
                <span class="display-5 fw-bold text-success me-2">${responseData.points}</span>
                <span class="text-muted fw-medium">points</span>
            </div>`;
      return;
    }

    if (responseStatus == 401) {
      showToast("Session expired. Please login again.", "warning");
      localStorage.removeItem("token");
      setTimeout(() => (window.location.href = "login.html"), 1200);
      return;
    }
    showToast(responseData?.message || "Unable to load points.", "error");
  };
  fetchMethod(currentUrl + `/api/users/info`, callbackForUserInfo, "GET", null, token);

  // Get streak 
  const callbackForStreakInfo = (responseStatus, responseData) => {
    const currentStreak = document.getElementById("streakText");

    if (responseStatus === 200) {
      currentStreak.innerHTML = `
                <div class="d-flex align-items-baseline">
                    <span class="display-5 fw-bold text-warning me-2">${responseData}</span>
                    <span class="text-muted fw-medium">days</span>
                </div>`;
      return;
    }

    if (responseStatus === 401) {
      showToast("Session expired. Please login again.", "warning");
      localStorage.removeItem("token");
      setTimeout(() => (window.location.href = "login.html"), 1200);
      return;
    }
    showToast(responseData?.message || "Unable to load streak.", "error");
  };

  fetchMethod(currentUrl + "/api/completion/streak", callbackForStreakInfo, "GET", null, token);

  // Update username  
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.addEventListener("click", () => {
    const newUsername = document.getElementById("username").value;

    // Unable save empty name 
    if (!newUsername.trim()) {
      showToast("Username cannot be empty!", "error");
      return;
    }

    const data = {
      username: newUsername
    };

    // Change the button state to show it's working
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;

    // Update username 
    const callbackForUpdateUsername = (responseStatus, responseData) => {
      // Reset button state
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalBtnText;

      if (responseStatus === 200 || responseStatus === 204) {
        showToast("Username updated successfully!");
      } else if (responseStatus === 401) {
        showToast("Session expired. Please login again.", "warning");
        localStorage.removeItem("token");
        setTimeout(() => (window.location.href = "login.html"), 1200);
        return;
      } else {
        showToast(responseData?.message || "Failed to update username.", "error");
      }
    };

    fetchMethod(currentUrl + "/api/users/updateUsername", callbackForUpdateUsername, "PUT", data, token);
  });


  // Delete user  
  document.getElementById('deleteModal')?.addEventListener('shown.bs.modal', (e) => {
    e.target.querySelector('.btn-light')?.focus();
  });
  document.getElementById('deleteModal')?.addEventListener('hidden.bs.modal', () => {
    document.activeElement.blur();
  });
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", () => {
      const originalBtnText = confirmDeleteBtn.innerHTML;
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Deleting...`;

      const callbackForDeleteUser = (responseStatus, responseData) => {
        if (responseStatus === 200 || responseStatus === 204) {
          localStorage.removeItem("token");
          window.location.href = "register.html";
        } else {
          // Reset button if it fails
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.innerHTML = originalBtnText;
          showToast(responseData?.message || "Failed to delete account.", "error");
        }
      };

      // Perform the DELETE request
      fetchMethod(currentUrl + "/api/users/delete", callbackForDeleteUser, "DELETE", null, token);
    });
  }
  // Get plant count 
  const callbackForInventory = (responseStatus, responseData) => {
    const inventoryCountEl = document.getElementById("summaryInventoryCount");

    if (responseStatus === 200) {
      // responseData is an array of owned plants
      const count = responseData.length;

      // Update the text in your standardized card
      inventoryCountEl.innerText = count;

      // Optional: Log it for debugging
      console.log(`User owns ${count} plants.`);
    } else {
      console.error("Failed to fetch inventory count");
      inventoryCountEl.innerText = "!"; // Show error state
    }
  };

  // Execute the fetch
  fetchMethod(currentUrl + "/api/userPlant/inventory", callbackForInventory, "GET", null, token);
  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Clear the security token
      localStorage.removeItem("token");

      showToast("Logged out successfully. See you soon!", "success");

      // Redirect to login or landing page
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    });
  }
});


