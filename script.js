(function () {
  const STORAGE_KEY = 'baon-tracker-state';

  let state = loadState();

  const els = {
    balanceValue: document.getElementById('balanceValue'),
    spentToday: document.getElementById('spentToday'),
    expenseCount: document.getElementById('expenseCount'),
    setBalanceInput: document.getElementById('setBalanceInput'),
    setBalanceBtn: document.getElementById('setBalanceBtn'),
    addBtn: document.getElementById('openModalBtn'),
    resetBtn: document.getElementById('resetBtn'),
    expenseList: document.getElementById('expenseList'),
    emptyState: document.getElementById('emptyState'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalWarning: document.getElementById('modalWarning'),
    expenseName: document.getElementById('expenseName'),
    expenseAmount: document.getElementById('expenseAmount'),
    cancelBtn: document.getElementById('cancelBtn'),
    confirmBtn: document.getElementById('confirmBtn'),
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.balance === 'number' && Array.isArray(parsed.expenses)) {
          return parsed;
        }
      }
    } catch (e) { /* fall through to default */ }
    return { balance: 500, expenses: [] };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable, continue in-memory */ }
  }

  function formatMoney(n) {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function render() {
    els.balanceValue.textContent = formatMoney(state.balance);
    const todaySpent = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    els.spentToday.textContent = '₱' + formatMoney(todaySpent);
    els.expenseCount.textContent = state.expenses.length;

    els.expenseList.innerHTML = '';
    if (state.expenses.length === 0) {
      els.emptyState.style.display = 'block';
    } else {
      els.emptyState.style.display = 'none';
      state.expenses.slice().reverse().forEach((exp) => {
        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `
          <div class="expense-icon">${exp.emoji}</div>
          <div class="expense-info">
            <p class="expense-name">${escapeHtml(exp.name)}</p>
            <p class="expense-meta">${exp.time}</p>
          </div>
          <div class="expense-amount">-₱${formatMoney(exp.amount)}</div>
          <button class="expense-delete" aria-label="Delete ${escapeHtml(exp.name)}" data-id="${exp.id}">✕</button>
        `;
        els.expenseList.appendChild(li);
      });
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function pickEmoji(name) {
    const n = name.toLowerCase();

    // Bills & Utilities
    if (/\b(meralco|electricity|electric|water bill|maynilad|manilad|rent|bill|bills|hoa|dues)\b/.test(n)) return '🏠';
    
    // Transport & Commute
    if (/\b(jeep|tricycle|bus|grab|fare|uber|taxi|commute|lrt|mrt|angkas|joyride|moveit)\b/.test(n)) return '🚌';
    
    // Fuel & Vehicle
    if (/\b(gas|gasoline|petrol|shell|petron|caltex|seaoil|parking|toll|rfid|easytrip|autosweep|car wash)\b/.test(n)) return '⛽';

    // Groceries & Market
    if (/\b(grocery|groceries|supermarket|palengke|mart|puregold|savemore|dali|7-eleven|uncle johns)\b/.test(n)) return '🛒';

    // Health, Pharmacy & Personal Care
    if (/\b(pharmacy|mercury drug|watsons|medicine|meds|doctor|clinic|hospital|skincare|soap|shampoo)\b/.test(n)) return '💊';

    // Coffee & Hot Drinks (Placed before general drinks)
    if (/\b(latte|cappuccino|espresso|coffee|café|cafe|starbucks)\b/.test(n)) return '☕️';

    // Cold Drinks & Beverages
    if (/\b(drinks|soda|milktea|water|beer|wine|juice|cola|boba)\b/.test(n)) return '🥤';

    // Fitness & Energy
    if (/\b(gatorade|protein bar|pocari sweat|electrolytes|energy gel|gym|fitness)\b/.test(n)) return '⚡️';

    // Telecom & Data
    if (/\b(load|data|wifi|internet|pldt|globe|smart|converge|dito)\b/.test(n)) return '📶';

    // Food & Dining
    if (/\b(food|lunch|dinner|breakfast|rice|jollibee|mcdo|kfc|tokyo tokyo|eat|snack|merienda|dine)\b/.test(n)) return '🍔';

    // School & Office
    if (/\b(school|book|ballpen|pen|notebook|project|school supplies|supplies|tuition|eraser)\b/.test(n)) return '📚';

    // Subscriptions & Digital
    if (/\b(netflix|spotify|youtube|disney|apple|google play|subscription|iCloud)\b/.test(n)) return '📺';

    // Shopping & Entertainment
    if (/\b(game|movie|shop|clothes|shopee|lazada|shopping|mall)\b/.test(n)) return '🛍️';

    return '💸';
  }

  // Set starting balance
  els.setBalanceBtn.addEventListener('click', () => {
    const val = parseFloat(els.setBalanceInput.value);
    if (!isNaN(val) && val >= 0) {
      state.balance = Math.round(val * 100) / 100;
      els.setBalanceInput.value = '';
      saveState();
      render();
    }
  });
  els.setBalanceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') els.setBalanceBtn.click();
  });

  // Reset everything
  els.resetBtn.addEventListener('click', () => {
    if (confirm('Reset balance and clear all expenses?')) {
      state = { balance: 500, expenses: [] };
      saveState();
      render();
    }
  });

  // Modal open/close
  function openModal() {
    els.expenseName.value = '';
    els.expenseAmount.value = '';
    els.modalWarning.classList.remove('show');
    els.modalOverlay.classList.add('open');
    setTimeout(() => els.expenseName.focus(), 50);
  }
  function closeModal() {
    els.modalOverlay.classList.remove('open');
  }
  els.addBtn.addEventListener('click', openModal);
  els.cancelBtn.addEventListener('click', closeModal);
  els.modalOverlay.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });

  // Live warning as amount is typed
  els.expenseAmount.addEventListener('input', () => {
    const val = parseFloat(els.expenseAmount.value);
    if (!isNaN(val) && val > state.balance) {
      els.modalWarning.classList.add('show');
    } else {
      els.modalWarning.classList.remove('show');
    }
  });

  // Confirm add expense
  els.confirmBtn.addEventListener('click', () => {
    const name = els.expenseName.value.trim();
    const amount = parseFloat(els.expenseAmount.value);

    if (!name) {
      els.expenseName.focus();
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      els.expenseAmount.focus();
      return;
    }
    if (amount > state.balance) {
      els.modalWarning.classList.add('show');
      const ok = confirm('This expense (₱' + formatMoney(amount) + ') is more than your balance (₱' + formatMoney(state.balance) + '). Add it anyway?');
      if (!ok) return;
    }

    const expense = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      amount: Math.round(amount * 100) / 100,
      emoji: pickEmoji(name),
      time: new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
    };

    state.expenses.push(expense);
    state.balance = Math.round((state.balance - expense.amount) * 100) / 100;
    saveState();
    render();
    closeModal();
  });

  els.expenseAmount.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') els.confirmBtn.click();
  });

  // Delete expense (event delegation)
  els.expenseList.addEventListener('click', (e) => {
    const btn = e.target.closest('.expense-delete');
    if (!btn) return;
    const id = btn.dataset.id;
    const idx = state.expenses.findIndex((x) => x.id === id);
    if (idx === -1) return;
    state.balance = Math.round((state.balance + state.expenses[idx].amount) * 100) / 100;
    state.expenses.splice(idx, 1);
    saveState();
    render();
  });

  render();
})();
