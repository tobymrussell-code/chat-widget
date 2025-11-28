window.addEventListener('DOMContentLoaded', () => {
  alert('Your finance app is running!');
});

(function () {
  const storageKey = 'llc-rental-ledger-v1';
  const today = new Date().toISOString().slice(0, 10);

  const state = loadState();

  const elements = {
    summaryCards: document.getElementById('summary-cards'),
    propertyCards: document.getElementById('property-cards'),
    companyFilter: document.getElementById('company-filter'),
    propertyFilter: document.getElementById('property-filter'),
    monthFilter: document.getElementById('month-filter'),
    transactionTable: document.querySelector('#transaction-table tbody'),
    dialog: document.getElementById('entity-dialog'),
    entityForm: document.getElementById('entity-form'),
    entityTitle: document.getElementById('entity-title'),
    entityName: document.getElementById('entity-name'),
    entityNotes: document.getElementById('entity-notes'),
    addPropertyBtn: document.getElementById('add-property-btn'),
    addCompanyBtn: document.getElementById('add-company-btn'),
    ingestForm: document.getElementById('ingest-form'),
    ingestFile: document.getElementById('ingest-file'),
    ingestDate: document.getElementById('ingest-date'),
    ingestAmount: document.getElementById('ingest-amount'),
    ingestCategory: document.getElementById('ingest-category'),
    ingestNotes: document.getElementById('ingest-notes'),
    categorizationList: document.getElementById('categorization-list'),
    documentHistory: document.getElementById('document-history'),
    taxCard: document.getElementById('tax-card'),
    burnCard: document.getElementById('burn-card'),
    overspendCard: document.getElementById('overspend-card'),
    breakdownList: document.getElementById('breakdown-list'),
    nudgeList: document.getElementById('nudge-list'),
    exportYear: document.getElementById('export-year'),
    exportDownload: document.getElementById('export-download'),
    exportEmail: document.getElementById('export-email'),
    exportStatus: document.getElementById('export-status'),
  };

  let dialogContext = null;

  elements.monthFilter.value = today.slice(0, 7);
  if (elements.ingestDate) elements.ingestDate.value = today;
  if (elements.exportYear) elements.exportYear.value = new Date().getFullYear();

  populateSelectors();
  render();
  wireEvents();

  function loadState() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      const documents = parsed.documents || [];
      const uploads = parsed.uploads || [];
      const receipts = parsed.receipts || [];

      uploads.forEach((file) => {
        if (!documents.some((d) => d.id === file.id)) {
          documents.push({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            notes: file.notes,
            uploadedAt: file.uploadedAt,
            date: file.uploadedAt?.slice(0, 10) || today,
            amount: 0,
            category: '',
            status: 'pending',
            classification: null,
            propertyId: null,
          });
        }
      });

      receipts.forEach((receipt) => {
        if (!documents.some((d) => d.id === receipt.id)) {
          documents.push({
            id: receipt.id,
            name: receipt.fileName,
            size: receipt.fileSize,
            type: receipt.fileType,
            notes: receipt.notes,
            uploadedAt: new Date().toISOString(),
            date: receipt.date,
            amount: receipt.amount,
            category: receipt.category,
            status: 'categorized',
            classification: receipt.companyId,
            propertyId: receipt.propertyId || null,
          });
        }
      });

      parsed.documents = documents;
      delete parsed.uploads;
      delete parsed.receipts;
      if (!parsed.companies.some((c) => c.id === 'personal')) {
        parsed.companies = [
          { id: 'personal', name: 'Personal Expenses', notes: 'Non-LLC spending' },
          ...parsed.companies,
        ];
      }
      return parsed;
    }

    return {
      companies: [
        { id: 'personal', name: 'Personal Expenses', notes: 'Non-LLC spending' },
        { id: 'llc-1', name: 'American Home Buyer LLC', notes: 'Acquisitions and flips' },
        { id: 'llc-2', name: 'America Home Builders LLC', notes: 'Construction & rehabs' },
      ],
      properties: [
        { id: 'prop-1', name: 'Maple Duplex', notes: 'Cleveland - 2 units' },
        { id: 'prop-2', name: 'Seaside Loft', notes: 'Tampa - downtown loft' },
      ],
      transactions: [
        {
          id: crypto.randomUUID(),
          date: today,
          type: 'income',
          amount: 2400,
          category: 'Assignment fee',
          companyId: 'llc-1',
          notes: 'Closed Maple duplex deal',
        },
        {
          id: crypto.randomUUID(),
          date: today,
          type: 'expense',
          amount: 820,
          category: 'Marketing',
          companyId: 'llc-1',
          notes: 'Ads + signage',
        },
        {
          id: crypto.randomUUID(),
          date: today,
          type: 'income',
          amount: 18500,
          category: 'Draw request',
          companyId: 'llc-2',
          propertyId: 'prop-2',
          notes: 'Phase 1 framing funded',
        },
        {
          id: crypto.randomUUID(),
          date: today,
          type: 'expense',
          amount: 950,
          category: 'Mortgage',
          companyId: 'llc-2',
          propertyId: 'prop-2',
          notes: 'Monthly note',
        },
        {
          id: crypto.randomUUID(),
          date: today,
          type: 'expense',
          amount: 260,
        category: 'Personal',
        companyId: 'personal',
        notes: 'Supplies + errands',
      },
    ],
    documents: [],
  };
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function wireEvents() {
    [elements.companyFilter, elements.propertyFilter, elements.monthFilter].forEach((el) =>
      el.addEventListener('change', render)
    );

    elements.addPropertyBtn.addEventListener('click', () => openDialog('property'));
    elements.addCompanyBtn.addEventListener('click', () => openDialog('company'));

    elements.entityForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = elements.entityName.value.trim();
      const notes = elements.entityNotes.value.trim();
      if (!name) return;

      if (dialogContext === 'company') {
        state.companies.push({ id: crypto.randomUUID(), name, notes });
      } else {
        state.properties.push({ id: crypto.randomUUID(), name, notes });
      }

      saveState();
      populateSelectors();
      render();
      elements.dialog.close();
    });

    elements.ingestForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const file = elements.ingestFile.files?.[0];
      if (!file) return;

      const document = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || file.name.split('.').pop() || 'file',
        notes: elements.ingestNotes.value.trim(),
        uploadedAt: new Date().toISOString(),
        date: elements.ingestDate.value || today,
        amount: Number(elements.ingestAmount.value || 0),
        category: elements.ingestCategory.value.trim(),
        status: 'pending',
        classification: null,
        propertyId: null,
      };

      state.documents.unshift(document);
      saveState();
      render();
      elements.ingestForm.reset();
      elements.ingestDate.value = today;
    });

    elements.categorizationList?.addEventListener('click', (event) => {
      const button = event.target.closest('button.categorize-btn');
      if (!button) return;
      const id = button.dataset.id;
      const classification = document.querySelector(`select[data-doc="${id}"]`)?.value;
      const property = document.querySelector(`select[data-doc-property="${id}"]`)?.value || '';
      handleCategorization(id, classification, property || null);
    });

    elements.exportDownload?.addEventListener('click', () => handleExportDownload());
    elements.exportEmail?.addEventListener('click', () => handleExportEmail());
    elements.exportYear?.addEventListener('change', () => renderExportStatus());
  }

  function populateSelectors() {
    const companyOptions = [
      `<option value="all">All companies</option>`,
      ...state.companies.map((company) => `<option value="${company.id}">${company.name}</option>`),
    ];

    const propertyOptions = [
      `<option value="all">All properties</option>`,
      `<option value="">Not property-specific</option>`,
      ...state.properties.map((property) => `<option value="${property.id}">${property.name}</option>`),
    ];

    elements.companyFilter.innerHTML = companyOptions.join('');
    elements.propertyFilter.innerHTML = propertyOptions.join('');
  }

  function openDialog(type) {
    dialogContext = type;
    elements.entityTitle.textContent = type === 'company' ? 'New LLC' : 'New rental property';
    elements.entityName.value = '';
    elements.entityNotes.value = '';
    elements.dialog.showModal();
  }

  function render() {
    const filters = {
      company: elements.companyFilter.value,
      property: elements.propertyFilter.value,
      month: elements.monthFilter.value,
    };

    const filtered = getFilteredTransactions(filters);

    renderSummaryCards(filtered);
    renderPropertyCards(filtered);
    renderTable(filtered);
    renderDocuments();
    renderInsights(filtered, filters);
    renderExportStatus();
  }

  function getFilteredTransactions(filters) {
    return state.transactions.filter((txn) => {
      const matchesCompany = filters.company === 'all' || txn.companyId === filters.company;
      const matchesProperty =
        filters.property === 'all'
          ? true
          : filters.property === ''
            ? !txn.propertyId
            : txn.propertyId === filters.property;
      const matchesMonth = !filters.month || txn.date.startsWith(filters.month);
      return matchesCompany && matchesProperty && matchesMonth;
    });
  }

  function renderSummaryCards(transactions) {
    const income = sum(transactions, (t) => (t.type === 'income' ? t.amount : 0));
    const expenses = sum(transactions, (t) => (t.type === 'expense' ? t.amount : 0));
    const cashFlow = income - expenses;

    const selectedCompany = state.companies.find((c) => c.id === elements.companyFilter.value);

    const cards = [
      createCard('Cash flow', cashFlow, 'Net after expenses'),
      createCard('Income', income, selectedCompany ? selectedCompany.name : 'All companies'),
      createCard('Expenses', expenses, selectedCompany ? selectedCompany.notes || 'Company costs' : 'All outgoing', true),
    ];

    elements.summaryCards.innerHTML = cards.join('');
  }

  function renderInsights(transactions, filters) {
    if (!elements.taxCard || !elements.breakdownList || !elements.nudgeList) return;

    const income = sum(transactions, (t) => (t.type === 'income' ? t.amount : 0));
    const expenses = sum(transactions, (t) => (t.type === 'expense' ? t.amount : 0));
    const net = income - expenses;
    const month = filters.month || today.slice(0, 7);

    const reserveRate = 0.25;
    const reserveTarget = income * reserveRate;
    const reserveCopy = net >= reserveTarget
      ? 'You have enough net income to cover estimated taxes.'
      : 'Consider reserving part of this month’s cash to cover taxes.';

    elements.taxCard.innerHTML = `
      <div class="insight-icon">💰</div>
      <div>
        <p class="eyebrow">Tax savings</p>
        <h3>Set aside ${formatCurrency(reserveTarget)}</h3>
        <p class="muted">${(reserveRate * 100).toFixed(0)}% of ${month || 'recent'} income. ${reserveCopy}</p>
      </div>
    `;

    const personalExpenses = transactions
      .filter((t) => t.type === 'expense' && t.companyId === 'personal')
      .reduce((total, txn) => total + txn.amount, 0);
    const burnTone = personalExpenses > expenses * 0.5 ? 'amount-negative' : 'amount-positive';
    elements.burnCard.innerHTML = `
      <div class="insight-icon">🏡</div>
      <div>
        <p class="eyebrow">Personal share</p>
        <h3 class="${burnTone}">${formatPercent(expenses ? personalExpenses / expenses : 0)} of spend</h3>
        <p class="muted">Personal expenses this period: ${formatCurrency(personalExpenses)}</p>
      </div>
    `;

    const categoryTotals = transactions
      .filter((t) => t.type === 'expense')
      .reduce((map, txn) => {
        map[txn.category] = (map[txn.category] || 0) + txn.amount;
        return map;
      }, {});

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    let overspendText = 'No big spikes detected.';
    let overspendTone = 'amount-positive';

    if (topCategory) {
      const [category, amount] = topCategory;
      const prevMonth = previousMonth(month);
      const prevFilters = { ...filters, month: prevMonth };
      const prev = prevMonth ? getFilteredTransactions(prevFilters) : [];
      const prevAmount = prev
        .filter((t) => t.type === 'expense' && t.category === category)
        .reduce((total, txn) => total + txn.amount, 0);
      const increase = prevAmount ? (amount - prevAmount) / prevAmount : 0;

      if (prevAmount && increase > 0.2) {
        overspendTone = 'amount-negative';
        overspendText = `${category} is up ${formatPercent(increase)} vs last month.`;
      } else if (amount > expenses * 0.35) {
        overspendTone = 'amount-negative';
        overspendText = `${category} dominates your spend this period.`;
      } else {
        overspendText = `${category} is your top expense category.`;
      }
    }

    elements.overspendCard.innerHTML = `
      <div class="insight-icon">📈</div>
      <div>
        <p class="eyebrow">Spending alert</p>
        <h3 class="${overspendTone}">${topCategory ? topCategory[0] : 'Stable spend'}</h3>
        <p class="muted">${overspendText}</p>
      </div>
    `;

    renderBreakdown(categoryTotals, expenses);
    renderNudges({ reserveTarget, net, overspendText, topCategory, month });
  }

  function renderPropertyCards(transactions) {
    const byProperty = new Map();
    transactions.forEach((txn) => {
      const key = txn.propertyId || 'none';
      if (!byProperty.has(key)) {
        byProperty.set(key, []);
      }
      byProperty.get(key).push(txn);
    });

    const cards = [];
    byProperty.forEach((txns, propertyId) => {
      const income = sum(txns, (t) => (t.type === 'income' ? t.amount : 0));
      const expenses = sum(txns, (t) => (t.type === 'expense' ? t.amount : 0));
      const cashFlow = income - expenses;
      const propertyName =
        propertyId === 'none'
          ? 'Not property-specific'
          : state.properties.find((p) => p.id === propertyId)?.name || 'Unassigned property';

      cards.push(createCard(propertyName, cashFlow, `${txns.length} entries`, expenses > income));
    });

    elements.propertyCards.innerHTML = cards.length ? cards.join('') : `<p class="muted">No property-level entries yet.</p>`;
  }

  function renderBreakdown(categoryTotals, totalExpenses) {
    if (!elements.breakdownList) return;

    const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    const bars = entries.map(([category, amount]) => {
      const pct = totalExpenses ? Math.round((amount / totalExpenses) * 100) : 0;
      return `<div class="bar-row">
        <div class="bar-label">${category}</div>
        <div class="bar-track"><span style="width:${pct}%"></span></div>
        <div class="bar-value">${pct}% • ${formatCurrency(amount)}</div>
      </div>`;
    });

    elements.breakdownList.innerHTML = bars.join('') || '<p class="muted">No expenses to visualize yet.</p>';
  }

  function renderNudges({ reserveTarget, net, overspendText, topCategory, month }) {
    if (!elements.nudgeList) return;

    const items = [];
    items.push(
      `Set aside ${formatCurrency(reserveTarget)} for taxes this period (${month || 'recent'} income).`
    );

    if (net < 0) {
      items.push('Spending exceeds income—consider trimming variable costs or collecting receivables.');
    } else {
      items.push('Positive cash flow—great job! Consider prepaying loans or building reserves.');
    }

    if (topCategory) {
      items.push(`Watch ${topCategory[0]}: ${overspendText}`);
    }

    elements.nudgeList.innerHTML = items.map((item) => `<li>🔔 ${item}</li>`).join('');
  }

  function renderTable(transactions) {
    const rows = transactions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((txn) => {
        const company = state.companies.find((c) => c.id === txn.companyId)?.name || 'Unknown';
        const property = txn.propertyId
          ? state.properties.find((p) => p.id === txn.propertyId)?.name || 'Unknown property'
          : '—';
        const amountClass = txn.type === 'income' ? 'amount-positive' : 'amount-negative';

        return `<tr>
          <td>${txn.date}</td>
          <td>${capitalize(txn.type)}</td>
          <td>${company}</td>
          <td>${property}</td>
          <td>${txn.category}</td>
          <td>${txn.notes || '—'}</td>
          <td class="numeric ${amountClass}">${formatCurrency(txn.amount)}</td>
        </tr>`;
      });

    elements.transactionTable.innerHTML = rows.join('') || `<tr><td colspan="7">No transactions recorded.</td></tr>`;
  }

  function createCard(title, amount, subtitle, danger = false) {
    const className = amount >= 0 && !danger ? 'amount-positive' : 'amount-negative';
    return `<article class="card">
      <p class="eyebrow">${subtitle}</p>
      <h3>${title}</h3>
      <p class="${className}">${formatCurrency(amount)}</p>
    </article>`;
  }

  function sum(list, selector) {
    return list.reduce((total, item) => total + (selector(item) || 0), 0);
  }

  function previousMonth(monthString) {
    if (!monthString) return null;
    const date = new Date(`${monthString}-01T00:00:00`);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    return `${(bytes / Math.pow(1024, i)).toFixed(bytes < 1024 ? 0 : 1)} ${sizes[i]}`;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function renderDocuments() {
    renderCategorizationQueue();
    renderDocumentHistory();
  }

  function renderCategorizationQueue() {
    if (!elements.categorizationList) return;
    const pending = state.documents.filter((doc) => doc.status !== 'categorized' && doc.status !== 'ignored');

    const companyOptions = [
      `<option value="">Select destination</option>`,
      ...state.companies.map((company) => `<option value="${company.id}">${company.name}</option>`),
      '<option value="ignore">Ignore / do not track</option>',
    ];

    const propertyOptions = [
      `<option value="">Not property-specific</option>`,
      ...state.properties.map((property) => `<option value="${property.id}">${property.name}</option>`),
    ];

    const items = pending
      .slice()
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .map((doc) => {
        return `<div class="attachment-item">
          <span class="pill">Pending</span>
          <div>
            <strong>${doc.name}</strong>
            <div class="muted">${formatBytes(doc.size)} • ${doc.date} ${doc.category ? `• ${doc.category}` : ''} ${doc.amount ? `• ${formatCurrency(doc.amount)}` : ''}</div>
            ${doc.notes ? `<div class="muted">${doc.notes}</div>` : ''}
            <div class="queue-actions">
              <label>
                Destination
                <select data-doc="${doc.id}">${companyOptions.join('')}</select>
              </label>
              <label>
                Property
                <select data-doc-property="${doc.id}">${propertyOptions.join('')}</select>
              </label>
              <button type="button" class="categorize-btn" data-id="${doc.id}">Categorize</button>
            </div>
          </div>
        </div>`;
      });

    elements.categorizationList.innerHTML = items.join('') || '<p class="muted">Nothing waiting—upload a file to start categorizing.</p>';
  }

  function renderDocumentHistory() {
    if (!elements.documentHistory) return;
    const history = state.documents
      .slice()
      .filter((doc) => doc.status === 'categorized' || doc.status === 'ignored')
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .map((doc) => {
        const destination =
          doc.classification === 'ignore'
            ? 'Ignored'
            : state.companies.find((c) => c.id === doc.classification)?.name || 'Unassigned';
        const property = doc.propertyId
          ? state.properties.find((p) => p.id === doc.propertyId)?.name || 'Unknown property'
          : 'Not property-specific';
        const badge = doc.status === 'ignored' ? 'Muted' : 'Filed';
        return `<div class="attachment-item">
          <span class="pill">${badge}</span>
          <div>
            <strong>${doc.name}</strong>
            <div class="muted">${destination} • ${property} • ${doc.date}${doc.category ? ` • ${doc.category}` : ''}${
              doc.amount ? ` • ${formatCurrency(doc.amount)}` : ''
            }</div>
            ${doc.notes ? `<div class="muted">${doc.notes}</div>` : ''}
          </div>
        </div>`;
      });

    elements.documentHistory.innerHTML =
      history.join('') || '<p class="muted">No processed uploads yet—categorize a pending item to see it here.</p>';
  }

  function handleCategorization(id, classification, propertyId) {
    const doc = state.documents.find((d) => d.id === id);
    if (!doc || !classification) return;
    if (doc.status === 'categorized' || doc.status === 'ignored') return;

    doc.classification = classification;
    doc.propertyId = propertyId || null;

    if (classification === 'ignore') {
      doc.status = 'ignored';
      saveState();
      renderDocuments();
      return;
    }

    doc.status = 'categorized';
    const txn = {
      id: crypto.randomUUID(),
      date: doc.date || today,
      type: 'expense',
      amount: doc.amount || 0,
      category: doc.category || 'Receipt',
      companyId: classification,
      propertyId: propertyId || null,
      notes: doc.notes || `Upload: ${doc.name}`,
    };

    state.transactions.push(txn);
    saveState();
    render();
  }

  function renderExportStatus() {
    if (!elements.exportStatus || !elements.exportYear) return;
    const year = sanitizeYear(elements.exportYear.value) || new Date().getFullYear();
    const yearlyTransactions = state.transactions.filter((txn) => txn.date.startsWith(`${year}-`));
    const income = sum(yearlyTransactions, (t) => (t.type === 'income' ? t.amount : 0));
    const expenses = sum(yearlyTransactions, (t) => (t.type === 'expense' ? t.amount : 0));
    const cashFlow = income - expenses;

    elements.exportStatus.innerHTML = yearlyTransactions.length
      ? `Ready to export <strong>${yearlyTransactions.length}</strong> rows for ${year}. Net cash flow: <span class="${
          cashFlow >= 0 ? 'amount-positive' : 'amount-negative'
        }">${formatCurrency(cashFlow)}</span>.`
      : `No transactions found for ${year}. Add entries or pick another year.`;
  }

  function handleExportDownload() {
    if (!elements.exportYear) return;
    const year = sanitizeYear(elements.exportYear.value) || new Date().getFullYear();
    const { csv, fileName, count } = buildCsv(year);
    if (!count) {
      elements.exportStatus.textContent = `No transactions available for ${year}.`;
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    elements.exportStatus.textContent = `Downloaded ${fileName} with ${count} rows.`;
  }

  function handleExportEmail() {
    if (!elements.exportYear) return;
    const year = sanitizeYear(elements.exportYear.value) || new Date().getFullYear();
    const { csv, fileName, count, totals } = buildCsv(year);
    if (!count) {
      elements.exportStatus.textContent = `No transactions available for ${year}.`;
      return;
    }

    // Trigger a download so the user can attach the CSV, then open the mail client.
    handleExportDownload();

    const subject = encodeURIComponent(`Year-end export ${year} - LLC & personal ledger`);
    const bodyLines = [
      `Attached: ${fileName} (${count} rows).`,
      `Income: ${formatCurrency(totals.income)} | Expenses: ${formatCurrency(totals.expenses)} | Net: ${formatCurrency(
        totals.net
      )}.`,
      '',
      'If the file is not attached automatically, it was saved to your downloads—attach it before sending.',
      '',
      'CSV preview (first few rows):',
      csv
        .split('\n')
        .slice(0, 6)
        .join('\n'),
    ];

    const mailto = `mailto:?subject=${subject}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
    elements.exportStatus.textContent = `Opened mail app with a draft for ${fileName}.`;
  }

  function buildCsv(year) {
    const header = ['Date', 'Type', 'Company', 'Property', 'Category', 'Notes', 'Amount'];
    const rows = state.transactions
      .filter((txn) => txn.date.startsWith(`${year}-`))
      .map((txn) => {
        const company = state.companies.find((c) => c.id === txn.companyId)?.name || '';
        const property = txn.propertyId ? state.properties.find((p) => p.id === txn.propertyId)?.name || '' : '';
        return [
          txn.date,
          capitalize(txn.type),
          company,
          property,
          txn.category,
          txn.notes ? txn.notes.replace(/\n/g, ' ') : '',
          txn.amount,
        ];
      });

    const csv = [header.join(','), ...rows.map((row) => row.map(csvSafe).join(','))].join('\n');
    const income = sum(
      state.transactions.filter((txn) => txn.date.startsWith(`${year}-`)),
      (t) => (t.type === 'income' ? t.amount : 0)
    );
    const expenses = sum(
      state.transactions.filter((txn) => txn.date.startsWith(`${year}-`)),
      (t) => (t.type === 'expense' ? t.amount : 0)
    );
    return {
      csv,
      fileName: `ledger-${year}.csv`,
      count: rows.length,
      totals: { income, expenses, net: income - expenses },
    };
  }

  function csvSafe(value) {
    if (value === null || value === undefined) return '';
    const str = String(value).replace(/"/g, '""');
    if (/[",\n]/.test(str)) {
      return `"${str}"`;
    }
    return str;
  }

  function sanitizeYear(value) {
    const parsed = Number(value);
    if (!parsed || parsed < 2000 || parsed > 2099) return null;
    return String(parsed);
  }
})();
