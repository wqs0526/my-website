
function showCelebration(message) {
  const div = document.createElement('div');
  div.className = 'celebration';
  div.textContent = message;
  document.body.appendChild(div);

  // Remove from DOM after animation finishes (1s)
  setTimeout(() => {
    div.remove();
  }, 1000);
}


document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("Session expired. Please login again.", "warning");
    localStorage.removeItem("token");
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return;
  }
  function showToast(message, type = "success") {
    const toastEl = document.getElementById("appToast");
    const toastBody = document.getElementById("toastBody");
    console.log("toastEl:", toastEl);
    console.log("toastBody:", toastBody);
    console.log("bootstrap:", window.bootstrap);
    if (!toastEl || !toastBody) {
      console.error("Toast elements not found in DOM");
      return;
    }

    // reset classes
    toastEl.classList.remove("text-bg-success", "text-bg-danger", "text-bg-warning");

    // set color
    if (type === "success") toastEl.classList.add("text-bg-success");
    if (type === "error") toastEl.classList.add("text-bg-danger");
    if (type === "warning") toastEl.classList.add("text-bg-warning");

    toastBody.innerText = message;

    const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
    toast.show();
  }


  // Get points 
  const callbackForPointsInfo = (responseStatus, responseData) => {
    console.log("responseStatus:", responseStatus);
    console.log("responseData:", responseData);

    const userPoints = document.getElementById("pointsText");

    if (responseStatus === 200) {
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
  fetchMethod(currentUrl + `/api/users/info`, callbackForPointsInfo, "GET", null, token);

  // Get streak 
  const callbackForStreakInfo = (responseStatus, responseData) => {
    const currentStreak = document.getElementById("streakText");

    if (responseStatus === 200) {
      currentStreak.innerHTML = `
            <div class="d-flex align-items-baseline">
                <span class="display-5 fw-bold text-dark me-2">${responseData}</span>
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

  // Get recent activity 
  const callbackForRecentActivity = (responseStatus, responseData) => {
    const activityList = document.getElementById("activityList");

    if (responseStatus === 200) {
      if (!responseData || responseData.length === 0) {
        activityList.innerHTML = `<li class="list-group-item small-hint text-muted">No activity yet.</li>`;
        return;
      }

      activityList.innerHTML = ""

      responseData.forEach((activity) => {
        activityList.innerHTML += `
        <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-bottom py-3 px-0">
          <div class="me-auto">
            <div class="fw-bold text-dark mb-1">${activity.description}</div>
            
            
            ${activity.details ? `
              <div class="bg-light p-2 rounded-3 mb-2 border-start border-success border-3">
                <p class="text-muted small mb-0 italic">
                  <i class="fa-solid fa-quote-left me-1 opacity-50"></i>
                  ${activity.details}
                </p>
              </div>
            ` : ''}

            <div class="text-muted" style="font-size: 0.75rem;">
              <i class="fa-regular fa-clock me-1"></i>${activity.completed_on || 'Just now'}
            </div>
          </div>
          <span class="badge bg-success-subtle text-success rounded-pill px-3">+${activity.points}</span>
        </li>
      `;
      });
      return;
    }
    if (responseStatus == 401) {
      showToast("Session expired. Please login again.", "warning");
      localStorage.removeItem("token");
      setTimeout(() => (window.location.href = "login.html"), 1200);
      return;
    }
    showToast(responseData?.message || "Unable to load recent activity.", "error");
  };
  fetchMethod(currentUrl + "/api/completion/recent", callbackForRecentActivity, "GET", null, token);

  // Leaderboard
  const callbackForLeaderboard = (responseStatus, responseData) => {
    const leaderboardBody = document.getElementById("leaderboardBody");

    if (responseStatus === 200) {
      leaderboardBody.innerHTML = "";

      responseData.forEach((user, index) => {
        const rank = index + 1;
        let rankDisplay = rank;

        // Add icons for top 3
        if (rank === 1) {
          rankDisplay = '🥇';
        } else if (rank === 2) {
          rankDisplay = '🥈';
        } else if (rank === 3) {
          rankDisplay = '🥉';
        } else {
          rankDisplay = `<div class="fw-bold text-dark ms-2" style="width: 24px;">${rank}</div>`;
        }

        const displayName = user.username ? String(user.username) : "Anonymous";
        const initial = displayName.charAt(0).toUpperCase();
        leaderboardBody.innerHTML += `
                <tr>
                    <td><span class="fw-bold">${rankDisplay}</span></td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center me-2" 
                                 style="width: 30px; height: 30px; font-size: 0.7rem; font-weight: bold;">
                                ${initial}
                            </div>
                            <span>${displayName}</span>
                        </div>
                    </td>
                    <td class="text-end fw-bold text-success">${user.points}</td>
                </tr>
            `;
      });
    } else {
      leaderboardBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Failed to load rankings.</td></tr>`;
    }
  };
  fetchMethod(currentUrl + "/api/users/leaderboard", callbackForLeaderboard, "GET", null, token);


  // Complete challenge 
  function completeChallenge(challengeId, buttonEl, points) {
    console.log("Complete clicked for:", challengeId, "Points:", points);
    const callbackAfterComplete = (status, data) => {
      console.log("[COMPLETE] status:", status);
      console.log("[COMPLETE] data:", data);

      if (status === 200 || status === 201) {
        showToast("Challenge completed! Points updated ✅", "success");
        showCelebration(`+${points} Points! 🎉`);

        if (buttonEl) {
          buttonEl.disabled = true; // Disable so they can't click again
          buttonEl.classList.remove("btn-outline-success");
          buttonEl.classList.add("btn-success");
          buttonEl.innerHTML = `<i class="fa-solid fa-check"></i>`;
          buttonEl.title = "Completed";
        }

        // Refresh points + streak after completion
        fetchMethod(currentUrl + "/api/users/info", callbackForPointsInfo, "GET", null, token);
        fetchMethod(currentUrl + "/api/completion/streak", callbackForStreakInfo, "GET", null, token);
        fetchMethod(currentUrl + "/api/completion/recent", callbackForRecentActivity, "GET", null, token);
        fetchMethod(currentUrl + "/api/users/leaderboard", callbackForLeaderboard, "GET", null, token);
        return;
      }

      if (status === 401) {
        showToast("Session expired. Please login again.", "warning");
        localStorage.removeItem("token");
        setTimeout(() => (window.location.href = "login.html"), 1200);
        return;
      }
      if (status === 409) {
        showToast(data?.message || "Already completed today!", "warning");
        if (buttonEl) {
          buttonEl.disabled = true; // Stay disabled
          buttonEl.classList.remove("btn-success", "btn-outline-success");
          buttonEl.classList.add("btn-warning"); 
          buttonEl.innerHTML = `<i class="fa-solid fa-calendar-check"></i>`; // Change icon
          buttonEl.title = "Completed today";
        }
        return;
      }
      // If failed, revert button back
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.classList.remove("btn-success");
        buttonEl.classList.add("btn-outline-success");
        buttonEl.innerHTML = `<i class="fa-solid fa-check"></i>`;
        buttonEl.title = "Complete Challenge";
      }

      showToast(data?.message || "Failed to complete challenge.", "error");
    };

    fetchMethod(currentUrl + "/api/completion/challenge", callbackAfterComplete, "POST", { challengeId: Number(challengeId) }, token);
  }

  // Random challenges 
  function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  // Get Wellness Challenge 
  const callbackForWellnessChallenge = (responseStatus, responseData) => {
    const challengeList = document.getElementById("todayChallenges");

    if (responseStatus === 200) {
      challengeList.innerHTML = ""
      // pick random 5 activity
      const randomChallenges = getRandomItems(responseData, 5);

      randomChallenges.forEach((challenge) => {
        const challengePoints = Number(challenge.challenge_points)
        challengeList.innerHTML += `
    <li class="list-group-item border-0 mb-3 p-3 shadow-sm rounded-4 position-relative overflow-hidden">
    <div class="d-flex align-items-center">
      <div class="me-3 d-flex align-items-center justify-content-center bg-white shadow-sm rounded-3"
           style="min-width: 50px; height: 50px;">
        <i class="fa-solid fa-seedling text-success fs-4"></i>
      </div>

      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="fw-bold text-dark mb-1">
              ${challenge.description}
            </h6>
            <div class="text-muted" style="font-size: 0.7rem;">
              <i class="fa-solid fa-user-pen me-1"></i>By 
              <span class="text-success fw-bold">${challenge.username || "Community"}</span>
            </div>
          </div>
          <span class="badge bg-light text-success border border-success-subtle rounded-pill px-2">
            +${challengePoints} pts
          </span>
        </div>
        <p class="text-muted small mb-0 mt-1">Daily Quest</p>
      </div>

      <div class="ms-3">
        <button
          class="btn btn-outline-success btn-sm rounded-circle complete-btn-circle d-flex align-items-center justify-content-center"
          data-challenge-id="${challenge.challenge_id}"
          data-points="${challengePoints}"
          type="button"
          style="width: 40px; height: 40px;"
          title="Complete Challenge"
        >
          <i class="fa-solid fa-check"></i>
        </button>
      </div>
    </div>
  </li>
`;

      });

      // attach listeners after rendering
      document.querySelectorAll(".complete-btn-circle").forEach((btn) => {
        btn.addEventListener("click", function () {
          const challengeId = this.dataset.challengeId;
          const points = this.dataset.points;
          completeChallenge(challengeId, this, points);
        });
      });
      return;
    }
    if (responseStatus === 401) {
      showToast("Session expired. Please login again.", "warning");
      localStorage.removeItem("token");
      setTimeout(() => (window.location.href = "login.html"), 1200);
      return;
    }

    showToast(responseData?.message || "Failed to load challenges.", "error");
  }
  fetchMethod(currentUrl + "/api/challenges", callbackForWellnessChallenge, "GET", null, token);




  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      showToast("Logged out successfully. See you soon!", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    });
  }
});
