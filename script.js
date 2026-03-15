(function () {
    const PRICE_PER_BLOCK = 400;
    const MAX_BLOCKS = 60;
    const MIN_BLOCKS = 1;
    const TOTAL_BLOCKS = 180;

    const ROOMS = [
      { name: "санузел", threshold: 20 },
      { name: "спальня", threshold: 60 },
      { name: "кабинет", threshold: 100 },
      { name: "кухня", threshold: 140 },
      { name: "гостиная", threshold: 180 },
    ];

    const STORAGE_KEYS = {
      builtBlocks: "builtBlocks",
      builders: "builders",
      pendingTransfers: "pendingTransfers",
    };

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
    let builtBlocks =
      parseInt(localStorage.getItem(STORAGE_KEYS.builtBlocks), 10) || 0;

    function getBuilders() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.builders) || "[]");
      } catch {
        return [];
      }
    }

    function setBuilders(arr) {
      localStorage.setItem(STORAGE_KEYS.builders, JSON.stringify(arr));
    }

    function getPendingTransfers() {
      try {
        return JSON.parse(
          localStorage.getItem(STORAGE_KEYS.pendingTransfers) || "[]"
        );
      } catch {
        return [];
      }
    }

    function setPendingTransfers(arr) {
      localStorage.setItem(
        STORAGE_KEYS.pendingTransfers,
        JSON.stringify(arr)
      );
    }

    // ——— Прогресс (над стеной) ———
    const wallSection = document.querySelector(".wall-section");
    const progressEl = document.createElement("div");
    progressEl.className = "progress-text";
    progressEl.setAttribute("aria-live", "polite");
    if (wallSection) {
      const wrapper = wallSection.querySelector(".wall-visual-wrapper");
      wallSection.insertBefore(progressEl, wrapper);
    }

    // ——— Поле имени (один раз) и кнопка "Я перевёл" ———
    let nameInputEl = null;

    function getNameInput() {
      if (nameInputEl) return nameInputEl;
      nameInputEl = document.createElement("input");
      nameInputEl.type = "text";
      nameInputEl.placeholder = "Ваше имя";
      nameInputEl.className = "name-input";
      nameInputEl.id = "guestName";
      return nameInputEl;
    }

    const confirmPaidBtn = document.createElement("button");
    confirmPaidBtn.className = "btn payment-btn";
    confirmPaidBtn.type = "button";
    confirmPaidBtn.textContent = "Я перевёл";
    confirmPaidBtn.id = "confirmPaidBtn";
    paymentLinkEl.parentNode.insertBefore(
      confirmPaidBtn,
      paymentLinkEl.nextSibling
    );

    // ——— Секция "Этапы строительства" ———
    const contentEl = document.querySelector(".content");
    const stagesSection = document.createElement("section");
    stagesSection.className = "control-section";
    stagesSection.setAttribute("aria-label", "Этапы строительства");
    const stagesTitle = document.createElement("h2");
    stagesTitle.className = "section-title";
    stagesTitle.textContent = "Этапы строительства";
    const stagesIntro = document.createElement("p");
    stagesIntro.className = "section-text";
    stagesIntro.textContent =
      "Чем больше блоков — тем больше комнат. По завершении помещения открывается следующее.";
    const stagesList = document.createElement("ul");
    stagesList.className = "stages-list";
    ROOMS.forEach(function (room, index) {
      const prevThreshold = index === 0 ? 0 : ROOMS[index - 1].threshold;
      const rangeText =
        index === 0
          ? `0–${room.threshold} блоков`
          : `${prevThreshold}–${room.threshold}`;
      const li = document.createElement("li");
      li.className = "stage-item";
      li.dataset.roomThreshold = String(room.threshold);
      li.dataset.roomPrev = String(prevThreshold);
      li.innerHTML =
        `<span class="stage-label">${rangeText} → ${room.name}</span>` +
        `<div class="stage-progress-wrap" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">` +
        `<div class="stage-progress-fill"></div>` +
        `</div>` +
        `<span class="stage-status"></span>`;
      stagesList.appendChild(li);
    });
    stagesSection.appendChild(stagesTitle);
    stagesSection.appendChild(stagesIntro);
    stagesSection.appendChild(stagesList);
    if (contentEl) contentEl.appendChild(stagesSection);

    // ——— Секция "Ожидают подтверждения" ———
    const pendingSection = document.createElement("section");
    pendingSection.className = "control-section";
    pendingSection.setAttribute("aria-label", "Ожидают подтверждения");
    const pendingTitle = document.createElement("h2");
    pendingTitle.className = "section-title";
    pendingTitle.textContent = "Ожидают подтверждения";
    const pendingList = document.createElement("ul");
    pendingList.className = "pending-list";
    pendingSection.appendChild(pendingTitle);
    pendingSection.appendChild(pendingList);
    pendingSection.classList.add("hidden");
    if (contentEl) contentEl.appendChild(pendingSection);

    // ——— Секция "Строители стены" ———
    const buildersSection = document.createElement("section");
    buildersSection.className = "control-section";
    buildersSection.setAttribute("aria-label", "Строители стены");
    const buildersTitle = document.createElement("h2");
    buildersTitle.className = "section-title";
    buildersTitle.textContent = "Строители стены";
    const buildersList = document.createElement("ul");
    buildersList.className = "builders-list";
    buildersSection.appendChild(buildersTitle);
    buildersSection.appendChild(buildersList);
    if (contentEl) contentEl.appendChild(buildersSection);

    function formatPrice(value) {
      return value.toLocaleString("ru-RU") + " ₽";
    }

    function updatePriceDisplay() {
      blockPriceEl.textContent = formatPrice(PRICE_PER_BLOCK);
      totalPriceEl.textContent = formatPrice(
        currentBlocks * PRICE_PER_BLOCK
      );
    }

    function updateControls() {
      countEl.textContent = String(currentBlocks);
      slider.value = String(currentBlocks);
      minusBtn.disabled = currentBlocks <= MIN_BLOCKS;
      plusBtn.disabled = currentBlocks >= MAX_BLOCKS;
    }

    function getNextRoom() {
      for (let i = 0; i < ROOMS.length; i++) {
        if (builtBlocks < ROOMS[i].threshold) {
          return {
            name: ROOMS[i].name,
            remaining: ROOMS[i].threshold - builtBlocks,
          };
        }
      }
      return null;
    }

    function updateProgressDisplay() {
      if (!progressEl) return;
      const next = getNextRoom();
      progressEl.innerHTML = "";
      const line1 = document.createElement("span");
      line1.textContent = `Построено ${builtBlocks} / ${TOTAL_BLOCKS} блоков`;
      progressEl.appendChild(line1);
      if (next && next.remaining > 0) {
        const br = document.createElement("br");
        progressEl.appendChild(br);
        const line2 = document.createElement("span");
        line2.className = "progress-next";
        line2.textContent = `Достроим ${next.name} через ${next.remaining} блоков`;
        progressEl.appendChild(line2);
      }
    }

    function getRoomProgress(prevThreshold, threshold) {
      if (builtBlocks < prevThreshold) return { pct: 0, locked: true };
      if (builtBlocks >= threshold) return { pct: 100, locked: false };
      const size = threshold - prevThreshold;
      const done = builtBlocks - prevThreshold;
      return { pct: Math.round((done / size) * 100), locked: false };
    }

    function updateStagesDisplay() {
      stagesList.querySelectorAll(".stage-item").forEach(function (li) {
        const threshold = parseInt(li.dataset.roomThreshold, 10);
        const prevThreshold = parseInt(li.dataset.roomPrev, 10);
        const progressWrap = li.querySelector(".stage-progress-wrap");
        const progressFill = li.querySelector(".stage-progress-fill");
        const statusEl = li.querySelector(".stage-status");
        const progress = getRoomProgress(prevThreshold, threshold);

        li.classList.toggle("stage-locked", progress.locked);
        li.classList.toggle("stage-done", progress.pct >= 100);

        if (progressFill) progressFill.style.width = progress.pct + "%";
        if (progressWrap) {
          progressWrap.setAttribute("aria-valuenow", progress.pct);
          progressWrap.setAttribute(
            "aria-label",
            progress.locked
              ? "Ещё не начато"
              : progress.pct >= 100
                ? "Построено"
                : "В процессе"
          );
        }
        if (statusEl) {
          statusEl.textContent = progress.pct >= 100 ? " ✔" : "";
          statusEl.setAttribute(
            "title",
            progress.locked ? "откроется после предыдущего" : progress.pct >= 100 ? "построено" : "строится"
          );
        }
      });
    }

    function updatePendingList() {
      const pending = getPendingTransfers();
      pendingList.innerHTML = "";
      if (pending.length === 0) {
        pendingSection.classList.add("hidden");
        return;
      }
      pendingSection.classList.remove("hidden");
      pending.forEach(function (item) {
        const li = document.createElement("li");
        li.className = "pending-item";
        const label = document.createElement("span");
        label.textContent = `🧱 ${item.name} — ${item.blocks} блоков`;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn payment-btn";
        btn.textContent = "Подтвердить";
        btn.addEventListener("click", function () {
          confirmTransfer(item.id);
        });
        li.appendChild(label);
        li.appendChild(btn);
        pendingList.appendChild(li);
      });
    }

    function confirmTransfer(id) {
      const pending = getPendingTransfers();
      const index = pending.findIndex(function (p) {
        return p.id === id;
      });
      if (index === -1) return;
      const item = pending[index];
      const toAdd = Math.min(
        item.blocks,
        TOTAL_BLOCKS - builtBlocks
      );
      if (toAdd <= 0) return;

      builtBlocks += toAdd;
      localStorage.setItem(
        STORAGE_KEYS.builtBlocks,
        String(builtBlocks)
      );

      const builders = getBuilders();
      builders.push({
        id: item.id,
        name: item.name,
        blocks: toAdd,
      });
      setBuilders(builders);

      pending.splice(index, 1);
      setPendingTransfers(pending);

      updateProgressDisplay();
      updateWall();
      updateStagesDisplay();
      updatePendingList();
      updateBuildersList();
    }

    function updateBuildersList() {
      const builders = getBuilders();
      buildersList.innerHTML = "";
      builders.forEach(function (b) {
        const li = document.createElement("li");
        li.className = "builder-item";
        li.textContent = `🧱 ${b.name} — ${b.blocks} блоков`;
        buildersList.appendChild(li);
      });
    }

    function updateWall() {
      wallEl.innerHTML = "";
      if (builtBlocks > 0) {
        wallEl.classList.add("has-blocks");
      } else {
        wallEl.classList.remove("has-blocks");
      }
      for (let i = 0; i < builtBlocks; i++) {
        const block = document.createElement("div");
        block.className = "block";
        if ((i + 3) % 7 === 0 || (i + 1) % 11 === 0) {
          block.classList.add("accent");
        }
        wallEl.appendChild(block);
      }
    }

    function setBlocks(newValue) {
      const clamped = Math.max(
        MIN_BLOCKS,
        Math.min(MAX_BLOCKS, newValue)
      );
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
      if (!Number.isNaN(value)) setBlocks(value);
    });

    giftBtn.addEventListener("click", function () {
      thankYouEl.classList.remove("hidden");

      const input = getNameInput();
      if (!thankYouEl.contains(input)) {
        thankYouEl.insertBefore(input, paymentLinkEl);
        input.value = "";
      }

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
      const name =
        (nameInputEl && nameInputEl.value && nameInputEl.value.trim()) ||
        "Гость";
      const toAdd = Math.min(
        currentBlocks,
        TOTAL_BLOCKS - builtBlocks
      );
      if (toAdd <= 0) return;

      const pending = getPendingTransfers();
      const id = Date.now();
      pending.push({
        id: id,
        name: name.trim() || "Гость",
        blocks: toAdd,
      });
      setPendingTransfers(pending);

      confirmPaidBtn.disabled = true;
      updatePendingList();

      alert(
        "Спасибо! Блоки будут добавлены после подтверждения перевода."
      );
    });

    // Инициализация
    setBlocks(MIN_BLOCKS);
    updateProgressDisplay();
    updateWall();
    updateStagesDisplay();
    updatePendingList();
    updateBuildersList();
  })();
