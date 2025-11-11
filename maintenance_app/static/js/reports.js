// reports.js - Updated for Django template
document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const customPicker = document.getElementById('customPicker');
  const customDateInput = document.getElementById('customDate');
  const applyBtn = document.getElementById('applyCustom');
  const resultsTitle = document.getElementById('resultsTitle');
  const tableBody = document.querySelector('#reportsTable tbody');
  const deptFilter = document.getElementById('departmentFilter');

  // Get all rows from the table (populated by Django)
  const allRows = Array.from(tableBody.querySelectorAll('tr[data-department]'));
  
  // Canonical base title
  let baseTitle = 'Showing: All recent reports';

  // Initialize
  applyDepartmentFilter();
  showCustomPicker(false);

  // Filter button click behavior
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveFilter(btn);
      const filter = btn.dataset.filter;
      if (filter === 'custom') {
        showCustomPicker(true);
      } else {
        showCustomPicker(false);
        applyQuickFilter(filter);
      }
    });
  });

  applyBtn.addEventListener('click', () => {
    const dateVal = customDateInput.value;
    if (!dateVal) {
      alert('Please choose a date.');
      return;
    }
    applyCustomDate(dateVal);
  });

  // Header department filter change
  if (deptFilter) {
    deptFilter.addEventListener('change', () => {
      applyDepartmentFilter();
      updateResultsTitle();
    });
  }

  // Helper: set active class
  function setActiveFilter(btn) {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  // Show/hide custom picker
  function showCustomPicker(show) {
    if (customPicker) {
      customPicker.setAttribute('aria-hidden', String(!show));
      customPicker.style.display = show ? 'flex' : 'none';
    }
  }

  // Quick filters: this week / month / year
  function applyQuickFilter(type) {
    const now = new Date();
    let startDate, endDate;

    if (type === 'week') {
      const day = now.getDay(); // 0 Sun .. 6 Sat
      const diff = (day === 0 ? 6 : day - 1); // Monday start
      startDate = new Date(now);
      startDate.setDate(now.getDate() - diff);
      startDate.setHours(0,0,0,0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23,59,59,999);
      baseTitle = `Showing: This week (${formatDate(startDate)} - ${formatDate(endDate)})`;
      filterByDateRange(startDate, endDate);
    } else if (type === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0,0,0,0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23,59,59,999);
      baseTitle = `Showing: This month (${startDate.toLocaleString('default',{month:'short',year:'numeric'})})`;
      filterByDateRange(startDate, endDate);
    } else if (type === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0,0,0,0);
      endDate = new Date(now.getFullYear(), 11, 31);
      endDate.setHours(23,59,59,999);
      baseTitle = `Showing: This year (${now.getFullYear()})`;
      filterByDateRange(startDate, endDate);
    }
    updateResultsTitle();
  }

  // Custom date applied
  function applyCustomDate(dateStr) {
    const selected = new Date(dateStr);
    const start = new Date(selected);
    start.setHours(0,0,0,0);
    const end = new Date(selected);
    end.setHours(23,59,59,999);
    baseTitle = `Showing: Custom: ${formatDate(start)}`;
    filterByDateRange(start, end);
    updateResultsTitle();
  }

  // Filter rows by date range
  function filterByDateRange(startDate, endDate) {
    allRows.forEach(row => {
      const dateStr = row.getAttribute('data-date');
      if (!dateStr) {
        row.style.display = 'none';
        return;
      }
      const rowDate = new Date(dateStr + 'T00:00:00');
      if (rowDate >= startDate && rowDate <= endDate) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
    applyDepartmentFilter();
  }

  // Show/hide rows based on header department filter
  function applyDepartmentFilter() {
    if (!deptFilter) return;
    const selected = deptFilter.value;
    const visibleRows = allRows.filter(row => row.style.display !== 'none' || !row.style.display);
    let visibleCount = 0;

    allRows.forEach(row => {
      // Skip if already hidden by date filter
      if (row.style.display === 'none') {
        return;
      }
      
      const deptAttr = row.getAttribute('data-department');
      if (selected === 'All' || deptAttr === selected) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    // Check for empty message row
    const emptyRow = tableBody.querySelector('tr:not([data-department])');
    if (emptyRow) {
      if (visibleCount === 0 && selected === 'All') {
        emptyRow.style.display = '';
      } else {
        emptyRow.style.display = 'none';
      }
    }
  }

  // Update results title
  function updateResultsTitle() {
    if (!deptFilter) return;
    const selected = deptFilter.value;
    const visibleRows = allRows.filter(row => {
      return row.style.display !== 'none' && 
             (selected === 'All' || row.getAttribute('data-department') === selected);
    });
    const visibleCount = visibleRows.length;
    
    const suffix = selected === 'All' 
      ? `All departments (${visibleCount})` 
      : `${selected} (${visibleCount})`;
    
    if (baseTitle && baseTitle.startsWith('Showing:')) {
      resultsTitle.textContent = `${baseTitle} • ${suffix}`;
    } else {
      resultsTitle.textContent = `Showing: ${suffix}`;
    }
  }

  // Small helpers
  function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  }
});