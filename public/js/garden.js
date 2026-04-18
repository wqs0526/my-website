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
            userPoints.innerText = responseData.points;
            return;
        }

        else if (responseStatus == 401) {
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
            currentStreak.innerText = responseData;
            return;
        }

        else if (responseStatus === 401) {
            showToast("Session expired. Please login again.", "warning");
            localStorage.removeItem("token");
            setTimeout(() => (window.location.href = "login.html"), 1200);
            return;
        }
        showToast(responseData?.message || "Unable to load streak.", "error");
    };

    fetchMethod(currentUrl + "/api/completion/streak", callbackForStreakInfo, "GET", null, token);

    // DISPLAY PLANT  
    //Image path
    const flowerImages = {
        'Sunflower': 'gameImage/sunflower.png',
        'Daisy': 'gameImage/daisy.png',
        'Tulip': 'gameImage/tulips.png',
        'Lavender': 'gameImage/lavender.png',
        'Blue Poppy': 'gameImage/blue poppy.png',
        'Lily': 'gameImage/lily.png',
        'Rose': 'gameImage/rose.png',
        'Bird of Paradise': 'gameImage/bird of paradise.png',
        'Orchid': 'gameImage/orchid.png',
        'Lotus': 'gameImage/lotus.png'
    };
    const shopList = document.getElementById("shopList");
    const callbackForShop = (responseStatus, responseData) => {
        if (responseStatus === 200) {
            if (responseData.length === 0) {
                document.getElementById("shopEmpty").style.display = "block";
                return;
            }
            else if (responseStatus === 401) {
                showToast("Session expired. Please login again.", "warning");
                localStorage.removeItem("token");
                setTimeout(() => (window.location.href = "login.html"), 1200);
                return;
            }
            let allShopCards = "";
            shopList.innerHTML = "";
            responseData.forEach((plant) => {
                const nameFromDB = plant.plant_type ? plant.plant_type.trim() : "Unknown Plant";
                const imageName = flowerImages[plant.plant_type] || 'default-flower.png';
                // Map rarity to Bootstrap-style colors
                const rarityBadge = {
                    'Common': 'badge-common',
                    'Rare': 'badge-rare',
                    'Epic': 'badge-epic',
                    'Legendary': 'badge-legendary'
                };

                allShopCards += `
            <div class="col-12 col-sm-6 col-lg-4">
                <div class="card h-100 plant-card border-0 shadow-sm rounded-4 p-2">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge ${rarityBadge[plant.rarity] || 'bg-secondary'} rounded-pill px-3 py-2">
                                <i class="fa-solid fa-star small me-1"></i>${plant.rarity}
                            </span>
                            <div class="text-success fw-bold">
                                <i class="fa-solid fa-coins me-1"></i>${plant.price}
                            </div>
                        </div>

                        <div class="img-container p-4 text-center position-relative overflow-hidden">
                            <img src="${imageName}" alt="${nameFromDB}" 
                                 class="img-fluid d-block mx-auto plant-img-hover" 
                                 style="height: 140px; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));">
                        </div>

                        <div class="text-center mt-auto">
                            <h5 class="fw-bold text-dark mb-1">${nameFromDB}</h5>
                            <p class="text-muted small mb-3">A beautiful addition to your sanctuary.</p>
                            <button class="btn btn-outline-success btn-sm rounded-pill w-100 py-2" 
                                    onclick="openBuyModal(${plant.plant_id}, '${nameFromDB}', ${plant.price})">
                                <i class="fa-solid fa-cart-shopping me-2"></i>Buy Plant
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
                shopList.innerHTML = allShopCards;
            });
        } else {
            showToast("Failed to load shop.", "error");
        }
    };

    fetchMethod(currentUrl + "/api/plants", callbackForShop, "GET", null, token);

    // Buy plant 
    window.openBuyModal = (plantId, name, price) => {
        // Fill the modal text
        document.getElementById("buyPlantName").innerText = name;
        document.getElementById("buyPlantPrice").innerText = price;

        // Get current points from the UI to show the "After Purchase" preview
        const currentPointsText = document.getElementById("pointsText").innerText;
        const currentPoints = parseInt(currentPointsText) || 0;
        const remaining = currentPoints - price;

        const afterPointsEl = document.getElementById("afterPoints");
        afterPointsEl.innerText = remaining + " pts";

        // Handle the Confirm Button
        const confirmBtn = document.getElementById("confirmBuyBtn");

        if (remaining < 0) {
            afterPointsEl.classList.add("text-danger");
            confirmBtn.disabled = true;
            confirmBtn.innerText = "Not Enough Points";
        } else {
            afterPointsEl.classList.remove("text-danger");
            confirmBtn.disabled = false;
            confirmBtn.innerText = "Confirm Purchase";

            // Attach the API call to the confirm button
            confirmBtn.onclick = () => {
                executePurchase(plantId);
            };
        }

        const buyModal = new bootstrap.Modal(document.getElementById('buyModal'));
        buyModal.show();
    };

    function executePurchase(plantId) {
        const token = localStorage.getItem("token");
        const confirmBtn = document.getElementById("confirmBuyBtn");

        // Disable button to prevent double-clicking
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

        const callbackForPurchase = (responseStatus, responseData) => {
            // Hide the modal first
            const modalEl = document.getElementById('buyModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            if (responseStatus === 201 || responseStatus === 200) {
                // Show celebration animation
                showCelebration("Success! Plant added to inventory.");
                fetchMethod(currentUrl + `/api/users/info`, callbackForPointsInfo, "GET", null, token);

                // Refresh Inventory 
                fetchMethod(currentUrl + "/api/userPlant/inventory", callbackForInventory, "GET", null, token);
            }
            else if (responseStatus === 401) {
                showToast("Session expired. Please login again.", "warning");
                localStorage.removeItem("token");
                setTimeout(() => (window.location.href = "login.html"), 1200);
                return;
            }
            else {
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Confirm Purchase";
            }
        };

        // Body data for the POST request
        const data = {
            plantId: plantId
        };

        fetchMethod(currentUrl + "/api/userPlant/purchase", callbackForPurchase, "POST", data, token);
    }
    // Get Inventory
    const inventoryList = document.getElementById("inventoryList");
    const ownedCountLabel = document.getElementById("ownedCount");

    const callbackForInventory = (responseStatus, responseData) => {
        if (responseStatus === 200) {
            // Update the badge
            ownedCountLabel.innerText = `${responseData.length} owned`;
            if (responseData.length === 0) {
                document.getElementById("inventoryEmpty").style.display = "block";
                inventoryList.innerHTML = "";
                return;
            }
            else if (responseStatus === 401) {
                showToast("Session expired. Please login again.", "warning");
                localStorage.removeItem("token");
                setTimeout(() => (window.location.href = "login.html"), 1200);
                return;
            }

            document.getElementById("inventoryEmpty").style.display = "none";
            inventoryList.innerHTML = "";
            let allInventoryCards = "";

            responseData.forEach((item) => {
                const nameFromDB = item.plant_type ? item.plant_type.trim() : "Unknown Plant";
                const imagePath = flowerImages[nameFromDB] || 'gameImage/sunflower.png';
                const price = item.price;



                const rarityBadgeMapping = {
                    'Common': 'badge-common',
                    'Rare': 'badge-rare',
                    'Epic': 'badge-epic',
                    'Legendary': 'badge-legendary'
                };

                allInventoryCards += `
            <div class="col-12 col-sm-6 col-lg-4">
                <div class="card h-100 plant-card border-0 shadow-sm rounded-4 p-2">
                    <div class="card-body d-flex flex-column text-center">
                        <div class="mb-3">
                            <span class="badge ${rarityBadgeMapping[item.rarity] || 'bg-secondary'} rounded-pill px-3 py-2">
                                <i class="fa-solid fa-star small me-1"></i>${item.rarity}
                            </span>
                        </div>

                        <div class="img-container p-3 mb-2">
                            <img src="${imagePath}" alt="${nameFromDB}" 
                                 class="img-fluid plant-img-hover" 
                                 style="height: 120px; object-fit: contain;">
                        </div>

                        <h5 class="fw-bold text-dark mb-1">${nameFromDB}</h5>
                        <p class="text-muted small mb-3">Value: <span class="text-success fw-bold">${price} pts</span></p>
                        
                        <button class="btn btn-outline-danger btn-sm rounded-pill w-100 py-2 mt-auto sell-btn" 
                                data-id="${item.inventory_id}" 
                                data-name="${nameFromDB}" 
                                data-price="${price}">
                            <i class="fa-solid fa-hand-holding-dollar me-2"></i>Sell (Full Refund)
                        </button>
                    </div>
                </div>
            </div>`;
            });
            inventoryList.innerHTML = allInventoryCards;

        } else {
            showToast("Could not load your inventory.", "error");
        }
    };

    fetchMethod(currentUrl + "/api/userPlant/inventory", callbackForInventory, "GET", null, token);
    inventoryList.addEventListener("click", function (event) {
        const btn = event.target.closest(".sell-btn");
        if (!btn) return;

        // Get data from the button
        const inventoryId = btn.getAttribute("data-id");
        const name = btn.getAttribute("data-name");
        const price = btn.getAttribute("data-price");

        // Fill the Modal Text
        document.getElementById("sellPlantName").innerText = name;
        document.getElementById("sellPlantPrice").innerText = price;

        // Setup the Confirm Button inside the Modal
        const confirmSellBtn = document.getElementById("confirmSellBtn");
        confirmSellBtn.onclick = function () {
            // Disable button to prevent double clicks
            confirmSellBtn.disabled = true;
            confirmSellBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

            executeSell(inventoryId, price);
        };

        // Show the Modal
        const sellModal = new bootstrap.Modal(document.getElementById('sellModal'));
        sellModal.show();
    });

    // Helper function to handle the actual API call
    function executeSell(inventoryId, price) {
        const callbackForSell = (responseStatus, responseData) => {
            // Hide modal
            const modalEl = document.getElementById('sellModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            // Reset button for next time
            const confirmSellBtn = document.getElementById("confirmSellBtn");
            confirmSellBtn.disabled = false;
            confirmSellBtn.innerText = "Confirm Sale";

            if (responseStatus === 200) {
                showToast(`Success! Refunded ${price} points.`, "success");
                // Refresh UI
                fetchMethod(currentUrl + `/api/users/info`, callbackForPointsInfo, "GET", null, token);
                fetchMethod(currentUrl + "/api/userPlant/inventory", callbackForInventory, "GET", null, token);
            } 
            else if (responseStatus === 401) {
                showToast("Session expired. Please login again.", "warning");
                localStorage.removeItem("token");
                setTimeout(() => (window.location.href = "login.html"), 1200);
                return;
            }
            else {
                showToast(responseData?.message || "Failed to sell plant.", "error");
            }
        };

        const data = { price: parseInt(price) };

        fetchMethod(currentUrl + `/api/userPlant/sellPlant/${inventoryId}`, callbackForSell, "POST", data, token);
    }
    // logout 
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