document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".filter-btn");
  const picker = document.getElementById("customPicker");
  const customDateInput = document.getElementById("customDate");
  const applyBtn = document.getElementById("applyCustom");
  const deptFilter = document.getElementById("departmentFilter");
  const resultsTitle = document.getElementById("resultsTitle");
  const tableBody = document.querySelector("#reportsTable tbody");

  // Sample data (replace with backend data as needed)
  const reports = [
    { id: 101, dept: "CS", issue: "Projector not working", date: "2025-10-25", status: "Pending" },
    { id: 102, dept: "EE", issue: "Fuse issue", date: "2025-10-15", status: "Completed" },
    { id: 103, dept: "ME", issue: "AC Maintenance", date: "2025-11-02", status: "In Progress" },
    { id: 104, dept: "CE", issue: "Broken Chairs", date: "2025-11-04", status: "Pending" },
    { id: 105, dept: "General", issue: "Water leak", date: "2025-09-30", status: "Completed" },
  ];

  // Base title (used to compose the resultsTitle)
  let baseTitle = "Showing: All recent reports";

  // Initial render
  render(reports);
  resultsTitle.textContent = baseTitle;

  // Wire quick filter buttons
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const f = btn.dataset.filter;
      if (f === "custom") {
        picker.style.display = "flex";
      } else {
        picker.style.display = "none";
        applyQuickFilter(f);
      }
    });
  });

  // Apply custom date
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const dateVal = customDateInput.value;
      if (!dateVal) {
        alert("Please choose a date.");
        return;
      }
      applyCustomDate(dateVal);
    });
  }

  // Department header filter
  if (deptFilter) {
    deptFilter.addEventListener("change", () => {
      applyDepartmentFilter();
    });
  }

  // --- Helper functions ---

  // Render rows into tbody
  function render(rows) {
    tableBody.innerHTML = "";
    if (!rows || rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.style.textAlign = "center";
      td.style.padding = "18px";
      td.style.color = "#6b7280";
      td.textContent = "No reports found for selected range.";
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-department", r.dept || "General");
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.dept}</td>
        <td>${escapeHtml(r.issue)}</td>
        <td>${formatDate(new Date(r.date))}</td>
        <td><span class="status ${statusClass(r.status)}">${r.status}</span></td>
        <td><button class="btn-view" data-id="${r.id}">View</button></td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach view handlers (placeholder action)
    tableBody.querySelectorAll(".btn-view").forEach(b => {
      b.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        alert("Open report view for ID: " + id + " (wire to backend page)");
      });
    });

    // Apply department filter immediately (keeps header filter consistent)
    applyDepartmentFilter();
  }

  // Quick filter by week/month/year
  function applyQuickFilter(type) {
    const now = new Date();
    let start, end, titleText;

    if (type === "week") {
      // Monday as start of week
      const day = now.getDay(); // 0 (Sun) .. 6 (Sat)
      const diff = (day === 0 ? 6 : day - 1);
      start = new Date(now);
      start.setDate(now.getDate() - diff);
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      titleText = `This week (${formatDate(start)} - ${formatDate(end)})`;
    } else if (type === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0,0,0,0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23,59,59,999);
      titleText = `This month (${start.toLocaleString(undefined,{month:'short',year:'numeric'})})`;
    } else if (type === "year") {
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0,0,0,0);
      end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23,59,59,999);
      titleText = `This year (${now.getFullYear()})`;
    } else {
      // unknown -> show all
      render(reports);
      baseTitle = "Showing: All recent reports";
      resultsTitle.textContent = baseTitle;
      return;
    }

    // filter data between start and end
    const filtered = reports.filter(r => {
      const d = new Date(r.date + "T00:00:00");
      return d >= start && d <= end;
    });

    baseTitle = `Showing: ${titleText}`;
    resultsTitle.textContent = baseTitle;
    render(filtered);
  }

  // Apply custom date (single day)
  function applyCustomDate(dateStr) {
    const selected = new Date(dateStr);
    const start = new Date(selected); start.setHours(0,0,0,0);
    const end = new Date(selected); end.setHours(23,59,59,999);
    const filtered = reports.filter(r => {
      const d = new Date(r.date + "T00:00:00");
      return d >= start && d <= end;
    });
    baseTitle = `Showing: Custom: ${formatDate(start)}`;
    resultsTitle.textContent = baseTitle;
    render(filtered);
  }

  // Apply header department filter (on current rendered rows)
  function applyDepartmentFilter() {
    if (!deptFilter) return;
    const selected = deptFilter.value;
    const rows = tableBody.querySelectorAll("tr");
    let visible = 0;

    rows.forEach(row => {
      const deptAttr = row.getAttribute("data-department");
      if (!deptAttr) {
        row.style.display = "";
        return;
      }
      if (selected === "All" || deptAttr === selected) {
        row.style.display = "";
        visible++;
      } else {
        row.style.display = "none";
      }
    });

    const suffix = selected === "All" ? `All departments (${visible})` : `${selected} (${visible})`;
    if (baseTitle && baseTitle.startsWith("Showing:")) {
      resultsTitle.textContent = `${baseTitle} • ${suffix}`;
    } else {
      resultsTitle.textContent = `Showing: ${suffix}`;
    }
  }

  // Small helpers
  function formatDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
  }

  function statusClass(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("pending")) return "pending";
    if (s.includes("complete") || s.includes("closed")) return "completed";
    return "inprogress";
  }

  // Basic HTML escape for issue text
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
