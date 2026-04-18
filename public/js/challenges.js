function showCelebration(message) {
  const div = document.createElement('div');
  div.className = 'celebration';
  div.textContent = message;
  document.body.appendChild(div);
  document.body.appendChild(div);
  // Remove from DOM after animation finishes (1s)
  setTimeout(() => {
    div.remove();
  }, 1000);
}

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  const attemptsModal = new bootstrap.Modal(document.getElementById("attemptsModal"));
  if (!token) {
    showToast("Session expired. Please login again.", "warning");
    localStorage.removeItem("token");
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return;
  }

  let allChallenges = []; // Global cache for search/sort
  let pendingChallengeId = null;
  let pendingPoints = 0;
  let pendingDeleteId = null;
  let pendingEditId = null;

  const editModal = new bootstrap.Modal(document.getElementById('editModal'));
  const completeModal = new bootstrap.Modal(document.getElementById('completeModal'));
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

  // Toast
  function showToast(message, type = "success") {
    const toastEl = document.getElementById("appToast");
    const toastBody = document.getElementById("toastBody");
    if (!toastEl || !toastBody) return;

    toastEl.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning");
    if (type === "success") toastEl.classList.add("text-bg-success");
    if (type === "error") toastEl.classList.add("text-bg-danger");
    if (type === "warning") toastEl.classList.add("text-bg-warning");

    toastBody.innerText = message;
    bootstrap.Toast.getOrCreateInstance(toastEl).show();
  }

  // Get challenge
  function getChallenges(challengesToDisplay) {
    const listArea = document.getElementById("listArea");
    const emptyHint = document.getElementById("emptyHint");
    

    listArea.innerHTML = "";
    if (challengesToDisplay.length === 0) {
      emptyHint.style.display = "block";
      return;
    }
    emptyHint.style.display = "none";

    challengesToDisplay.forEach((challenge) => {
      const challengePoints = Number(challenge.challenge_points ?? challenge.points ?? 0);
      listArea.innerHTML +=`
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div class="card-body d-flex flex-column p-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="fw-bold text-dark mb-0 flex-grow-1 pe-3" style="line-height: 1.4;">
                            ${challenge.description}
                        </h6>
                        <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 border-0">
                            +${challengePoints} pts
                        </span>
                    </div>

                    <div class="mb-4">
                        <div class="text-muted d-flex align-items-center mb-1" style="font-size: 0.75rem;">
                            <i class="fa-solid fa-user-pen me-1 text-success"></i>
                            <span>By <span class="fw-bold">${challenge.username || "Community"}</span></span>
                        </div>
                        <span class="badge rounded-pill bg-light text-secondary fw-normal border" style="font-size: 0.7rem;">
                            Available Quest
                        </span>
                    </div>

                    <div class="mt-auto d-flex align-items-center justify-content-between pt-3 border-top">
                        <div class="dropdown">
                            <button class="btn btn-light btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center" 
                                    type="button" data-bs-toggle="dropdown" style="width: 35px; height: 35px;">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                                <li>
                                    <button class="dropdown-item edit-btn py-2" data-id="${challenge.challenge_id}" data-desc="${challenge.description}" data-points="${challengePoints}">
                                        <i class="fa-solid fa-pen me-2 text-primary"></i> Edit
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item attempts-btn py-2" data-id="${challenge.challenge_id}">
                                        <i class="fa-solid fa-users me-2 text-dark"></i> View Attempts
                                    </button>
                                </li>
                                <li><hr class="dropdown-divider"></li>
                                <li>
                                    <button class="dropdown-item delete-btn py-2 text-danger" data-id="${challenge.challenge_id}">
                                        <i class="fa-solid fa-trash-can me-2"></i> Delete
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <button class="btn btn-success btn-sm rounded-pill px-4 py-2 complete-btn-circle d-flex align-items-center gap-2 shadow-sm"
                            data-challenge-id="${challenge.challenge_id}" data-points="${challengePoints}">
                            <i class="fa-solid fa-check"></i>
                            <span class="fw-bold">Complete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    });
    attachActionListeners();
  }

  // Complete Edit Delete button 
  function attachActionListeners() {
    document.querySelectorAll(".complete-btn-circle").forEach(btn => {
      btn.addEventListener("click", function () {
        pendingChallengeId = this.dataset.challengeId;
        pendingButtonEl = null;
        pendingPoints = this.dataset.points;
        document.getElementById("completionComment").value = "";
        completeModal.show();
      });
    });
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        pendingDeleteId = this.dataset.id;
        deleteModal.show();
      });
    });
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        pendingEditId = this.dataset.id;
        document.getElementById("editDesc").value = this.dataset.desc;
        document.getElementById("editPoints").value = this.dataset.points;
        editModal.show();
      });
    });
    document.querySelectorAll(".attempts-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    const challengeId = this.dataset.id;
    openAttemptsModal(challengeId);
  });
});

  }

  // Search & sort
  document.getElementById("searchInput").addEventListener("input", function (e) {
    const term = e.target.value.toLowerCase();
    const filtered = allChallenges.filter(c =>
      c.description.toLowerCase().includes(term) ||
      (c.username && c.username.toLowerCase().includes(term))
    );
    getChallenges(filtered);
  });

  document.getElementById("sortSelect").addEventListener("change", function (e) {
  const val = e.target.value;
  let sorted = [...allChallenges];

  if (val === "pointsHigh" || val === "pointsLow") {
    sorted.sort((a, b) => {
      // Handle both possible naming conventions and force Number type
      const pointsA = Number(a.challenge_points ?? a.points ?? 0);
      const pointsB = Number(b.challenge_points ?? b.points ?? 0);
      
      return val === "pointsHigh" ? pointsB - pointsA : pointsA - pointsB;
    });
  } else if (val === "newest") {
    sorted.sort((a, b) => b.challenge_id - a.challenge_id);
  }

  getChallenges(sorted);
});
  // Challenge callback 
  const callbackForAllWellnessChallenge = (responseStatus, responseData) => {
    if (responseStatus === 200) {
      allChallenges = responseData;
      getChallenges(allChallenges);
    } else if (responseStatus === 401) {
      showToast("Session expired. Please login again.", "warning");
      localStorage.removeItem("token");
      setTimeout(() => (window.location.href = "login.html"), 1200);
      return;
    } else {
      showToast("Failed to load challenges.", "error");
    }
  };

  // Confirm Completion
  document.getElementById("confirmCompleteBtn").addEventListener("click", function () {
    const comment = document.getElementById("completionComment").value.trim();
    if (!comment) {
      showToast("Please enter a comment to complete the challenge!", "warning");
      return;
    }

    completeModal.hide();

    const data = {
      challengeId: Number(pendingChallengeId),
      details: comment
    };

    // Callback for the Completion action
    const callbackAfterComplete = (responseStatus, responseData) => {
      if (responseStatus === 200 || responseStatus === 201) {
        showToast("Challenge completed! Points updated ✅", "success");
        showCelebration(`+${pendingPoints} Points! 🎉`);

        // Re-fetch the list using the standard format you requested
        fetchMethod(currentUrl + "/api/challenges", callbackForAllWellnessChallenge, "GET", null, token);
      } else if (responseStatus === 409) {
        showToast(responseData?.message || "Already completed today!", "warning");
      } else if (responseStatus === 401) {
        showToast("Session expired. Please login again.", "warning");
        localStorage.removeItem("token");
        setTimeout(() => (window.location.href = "login.html"), 1200);
        return;
      } else {
        showToast(responseData?.message || "Failed to complete challenge.", "error");
      }
    };

    fetchMethod(currentUrl + "/api/completion/challenge", callbackAfterComplete, "POST", data, token);
  });

  // Confirm Delete
  document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
    deleteModal.hide();

    const data = { challengeId: pendingDeleteId };

    // Define the specific callback for the Delete action
    const callbackAfterDelete = (responseStatus, responseData) => {
      console.log(responseStatus)
      if (responseStatus === 200 || responseStatus === 204) {
        showToast("Challenge deleted successfully.", "success");

        // Re-fetch the list using the standard format you requested
        fetchMethod(currentUrl + "/api/challenges", callbackForAllWellnessChallenge, "GET", null, token);
      } else if (responseStatus === 401) {
        showToast("Session expired. Please login again.", "warning");
        localStorage.removeItem("token");
        setTimeout(() => (window.location.href = "login.html"), 1200);
        return;
      }
    };

    fetchMethod(currentUrl + "/api/challenges/delete", callbackAfterDelete, "DELETE", data, token);
  });

  // Create Challenge
  document.getElementById("createChallengeForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
      description: document.getElementById("newDesc").value,
      points: parseInt(document.getElementById("newPoints").value)
    };

    // Define the specific callback for the Create action
    const callbackAfterCreate = (responseStatus, responseData) => {
      if (responseStatus === 201 || responseStatus === 200) {

        showToast("Challenge created successfully!", "success");

        // Clear the form
        document.getElementById("createChallengeForm").reset();

        // Re-fetch the list using the standard format you requested
        fetchMethod(currentUrl + "/api/challenges", callbackForAllWellnessChallenge, "GET", null, token);
      } else if (responseStatus === 401) {
        showToast("Session expired. Please login again.", "warning");
        localStorage.removeItem("token");
        setTimeout(() => (window.location.href = "login.html"), 1200);
        return;
      }
      else {
        showToast(responseData?.message || "Failed to create challenge.", "error");
      }
    };

    fetchMethod(currentUrl + "/api/challenges/createChallenge", callbackAfterCreate, "POST", data, token);
  });

  // Edit Submission
  document.getElementById("editChallengeForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
      challengeId: pendingEditId,
      description: document.getElementById("editDesc").value,
      points: parseInt(document.getElementById("editPoints").value)
    };

    // Define the specific callback for the Update action
    const callbackAfterUpdate = (responseStatus, responseData) => {
      if (responseStatus === 200) {
        showToast("Challenge updated!", "success");
        editModal.hide();

        // Re-fetch the list using the standard format you requested
        fetchMethod(currentUrl + "/api/challenges", callbackForAllWellnessChallenge, "GET", null, token);
      } else if (responseStatus === 401) {
        showToast("Session expired. Please login again.", "warning");
        localStorage.removeItem("token");
        setTimeout(() => (window.location.href = "login.html"), 1200);
        return;
      }
      else {
        showToast(responseData?.message || "Update failed", "error");
      }
    };

    fetchMethod(currentUrl + "/api/challenges/update", callbackAfterUpdate, "PUT", data, token);
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Clear the security token
      localStorage.removeItem("token");

      // Optional: Show a quick message before redirecting
      showToast("Logged out successfully. See you soon!", "success");

      // Redirect to login or landing page
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    });
  }
  // Initial Load
  fetchMethod(currentUrl + "/api/challenges", callbackForAllWellnessChallenge, "GET", null, token);
  function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openAttemptsModal(challengeId) {
  const attemptsList = document.getElementById("attemptsList");
  const attemptsMeta = document.getElementById("attemptsMeta");

  attemptsMeta.textContent = `Loading attempts for Challenge #${challengeId}...`;
  attemptsList.innerHTML = `<li class="list-group-item text-muted small">Loading...</li>`;

  // make sure attemptsModal is defined OUTSIDE (global)
  attemptsModal.show();

  const callbackForAttempts = (responseStatus, responseData) => {
    if (responseStatus === 200) {
      const attempts = Array.isArray(responseData) ? responseData : [];

      attemptsMeta.textContent = `Challenge #${challengeId} • ${attempts.length} completion(s)`;

      if (attempts.length === 0) {
        attemptsList.innerHTML = `
          <li class="list-group-item text-muted small">
            No one has completed this challenge yet.
          </li>
        `;
        return;
      }

      attemptsList.innerHTML = attempts.map((a) => {
  const userId = escapeHtml(a.user_id);
  const username = escapeHtml(a.username || "Unknown");
  const email = escapeHtml(a.email || "-");
  const completedOn = escapeHtml(a.completed_on || "—");
  const details = escapeHtml(a.details || "No reflection shared.");

  return `
    <li class="attempt-card">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="fw-bold text-dark d-flex align-items-center">
          <i class="fa-solid fa-circle-user me-2 text-success"></i> ${username}
        </span>
        <span class="attempt-user-badge">ID: ${userId}</span>
      </div>
      
      <div class="small text-muted mb-3">
        <div class="d-flex align-items-center mb-1">
          <i class="fa-regular fa-envelope me-2"></i> ${email}
        </div>
        <div class="d-flex align-items-center">
          <i class="fa-regular fa-calendar-check me-2"></i> ${completedOn}
        </div>
      </div>

      <div class="attempt-details-box p-3 rounded-3 shadow-sm">
        <small class="text-success fw-bold d-block mb-1">Reflection:</small>
        <span class="text-dark small">"${details}"</span>
      </div>
    </li>
  `;
}).join("");

      return;
    }

    if (responseStatus === 401) {
      showToast("Session expired. Please login again.", "warning");
      localStorage.removeItem("token");
      setTimeout(() => (window.location.href = "login.html"), 1200);
      return;
    }

    attemptsMeta.textContent = `Failed to load attempts (status ${responseStatus})`;
    attemptsList.innerHTML = `
      <li class="list-group-item text-danger small">
        ${escapeHtml(responseData?.message || "Unable to load attempts.")}
      </li>
    `;
  };

  // ✅ use your endpoint
  // If your route is GET /challenges/:challenge_id/
  fetchMethod(currentUrl + `/api/completion/${challengeId}/`, callbackForAttempts, "GET", null, token);
}

});

