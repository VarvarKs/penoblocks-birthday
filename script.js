(function () {
    const PRICE_PER_BLOCK = 400;
    const MAX_BLOCKS = 60;
    const MIN_BLOCKS = 1;
    const TOTAL_BLOCKS = 180;
  
    const wallEl = document.getElementById("wall");
    const countEl = document.getElementById("blockCount");
    const blockPriceEl = document.getElementById("blockPrice");
    const totalPriceEl = document.getElementById("totalPrice");
    const minusBtn = document.getElementById("minusBtn");
    const plusBtn = document.getElementById("plusBtn");
    const slider = document.getElementById("blockSlider");
    const giftBtn = document.getElementById("giftBtn");
    const thankYouEl = document.getElementById("thankYou");
    const paymentLinkEl = document.getElementById("paymentLink");
  
    let currentBlocks = MIN_BLOCKS;
    let BUILT_BLOCKS = 0;
  
    const wallSection = document.querySelector(".wall-section");
    const progressEl = document.createElement("p");
    progressEl.className = "progress-text";
    progressEl.setAttribute("aria-live", "polite");
    if (wallSection) {
      const wrapper = wallSection.querySelector(".wall-visual-wrapper");
      wallSection.insertBefore(progressEl, wrapper);
    }
  
    const confirmPaidBtn = document.createElement("button");
    confirmPaidBtn.className = "btn payment-btn";
    confirmPaidBtn.type = "button";
    confirmPaidBtn.textContent = "Я перевёл";
    confirmPaidBtn.id = "confirmPaidBtn";
    paymentLinkEl.parentNode.insertBefore(confirmPaidBtn, paymentLinkEl.nextSibling);
  
    function formatPrice(value) {
      return value.toLocaleString("ru-RU") + " ₽";
    }
  
    function updatePriceDisplay() {
      blockPriceEl.textContent = formatPrice(PRICE_PER_BLOCK);
      totalPriceEl.textContent = formatPrice(currentBlocks * PRICE_PER_BLOCK);
    }
  
    function updateControls() {
      countEl.textContent = String(currentBlocks);
      slider.value = String(currentBlocks);
  
      minusBtn.disabled = currentBlocks <= MIN_BLOCKS;
      plusBtn.disabled = currentBlocks >= MAX_BLOCKS;
    }
  
    function updateProgressDisplay() {
      if (progressEl) {
        progressEl.textContent = `Уже построено ${BUILT_BLOCKS} из ${TOTAL_BLOCKS} блоков`;
      }
    }

    function updateWall() {
      wallEl.innerHTML = "";

      if (BUILT_BLOCKS > 0) {
        wallEl.classList.add("has-blocks");
      } else {
        wallEl.classList.remove("has-blocks");
      }

      for (let i = 0; i < BUILT_BLOCKS; i++) {
        const block = document.createElement("div");
        block.className = "block";

        if ((i + 3) % 7 === 0 || (i + 1) % 11 === 0) {
          block.classList.add("accent");
        }

        wallEl.appendChild(block);
      }
    }
  
    function setBlocks(newValue) {
      const clamped = Math.max(MIN_BLOCKS, Math.min(MAX_BLOCKS, newValue));
      currentBlocks = clamped;
      updateControls();
      updatePriceDisplay();
    }
  
    minusBtn.addEventListener("click", function () {
      setBlocks(currentBlocks - 1);
    });
  
    plusBtn.addEventListener("click", function () {
      setBlocks(currentBlocks + 1);
    });
  
    slider.addEventListener("input", function (event) {
      const value = parseInt(event.target.value, 10);
      if (!Number.isNaN(value)) {
        setBlocks(value);
      }
    });
  
    giftBtn.addEventListener("click", function () {
      thankYouEl.classList.remove("hidden");

      const text = `Перевести за ${currentBlocks} блок(а/ов) ≈ ${formatPrice(
        currentBlocks * PRICE_PER_BLOCK
      )}`;
      paymentLinkEl.textContent = text;
      const paymentUrl =
        typeof window.PAYMENT_URL === "string" && window.PAYMENT_URL.trim()
          ? window.PAYMENT_URL.trim()
          : "#";
      paymentLinkEl.href = paymentUrl;

      confirmPaidBtn.disabled = false;
    });

    confirmPaidBtn.addEventListener("click", function () {
      const toAdd = Math.min(currentBlocks, TOTAL_BLOCKS - BUILT_BLOCKS);
      if (toAdd <= 0) return;
      BUILT_BLOCKS += toAdd;
      confirmPaidBtn.disabled = true;
      updateProgressDisplay();
      updateWall();
    });
  
    // Инициализация
    setBlocks(MIN_BLOCKS);
    updateProgressDisplay();
    updateWall();
  })();