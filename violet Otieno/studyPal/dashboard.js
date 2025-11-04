const SUPABASE_URL = "https://wzcljidgvmiohucxmfyl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Y2xqaWRndm1pb2h1Y3htZnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzQzNTUsImV4cCI6MjA3NzcxMDM1NX0.ZVV7FIod5lQSUcIG3angv0LmCGQhF6G_ufAMq0yta-E";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SUPABASE_FUNCTIONS_URL = "https://wzcljidgvmiohucxmfyl.functions.supabase.co";

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await client.auth.signOut();
    localStorage.removeItem("email");
    localStorage.removeItem("school");
    sessionStorage.removeItem("new_user_welcome");
    window.location.href = "index.html";
  });
}
const navNotifyBtn = document.getElementById('navNotifyBtn');

// Get email from localStorage (set by auth.js) - this is our storage key
const email = localStorage.getItem("email") || "student";
const USER_STORAGE_KEY = `studypal_lists_${email}`;

// Load user info and verify session
(async () => {
  const { data } = await client.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return;
  }
  // Update email from session if available (source of truth)
  const sessionEmail = data.session.user?.email;
  if (sessionEmail && sessionEmail !== email) {
    localStorage.setItem("email", sessionEmail);
    // Reload to use correct storage key
    window.location.reload();
    return;
  }
})();

// Set welcome message
const welcomeMsg = document.getElementById("welcomeMsg");
const username = email.includes("@") ? email.split("@")[0] : email;
const displayName = username.charAt(0).toUpperCase() + username.slice(1);
welcomeMsg.textContent = `Welcome, ${displayName}`;

// Smooth scroll for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Global fallback for delete buttons (in case event doesn't reach list)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.item-delete-btn');
  if (btn) {
    const container = btn.closest('li, tr');
    if (container) {
      container.remove();
      saveAllLists();
    }
  }
});

// Force caret at start on focus for dashboard inputs
function moveCaretToStart(el) {
  try {
    el.selectionStart = 0;
    el.selectionEnd = 0;
  } catch (_) {}
}

document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="time"], input[type="date"]').forEach((input) => {
  input.addEventListener('focus', () => {
    setTimeout(() => moveCaretToStart(input), 0);
  });
});

// ======== Toast feedback ========
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.textContent = message;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

// ======== Persistence (Local Storage) ========
function getState() {
  // Try current key; if empty, search legacy keys and migrate
  const emptyState = { courses: [], tasks: [], timetable: [], lecturers: [] };
  try {
    const current = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || null;
    if (current && (current.courses?.length || current.tasks?.length || current.timetable?.length || current.lecturers?.length)) {
      return current;
    }
  } catch (_) {}
  // Legacy scan
  try {
    const candidates = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('studypal_lists_') && k !== USER_STORAGE_KEY) {
        try {
          const v = JSON.parse(localStorage.getItem(k) || 'null');
          if (v && (v.courses?.length || v.tasks?.length || v.timetable?.length || v.lecturers?.length)) candidates.push({ k, v });
        } catch (_) {}
      }
    }
    if (candidates.length) {
      // Pick the one with most data
      candidates.sort((a,b) => ((b.v.courses?.length||0)+(b.v.tasks?.length||0)+(b.v.timetable?.length||0)+(b.v.lecturers?.length||0)) - ((a.v.courses?.length||0)+(a.v.tasks?.length||0)+(a.v.timetable?.length||0)+(a.v.lecturers?.length||0)));
      const best = candidates[0].v;
      // Save under current key for future
      try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(best)); } catch (_) {}
      return best;
    }
  } catch (_) {}
  return emptyState;
}

function saveAllLists() {
  const timetableItems = Array.from(document.querySelectorAll('#timetableBody tr')).map(tr => {
    const day = tr.querySelector('.tt-day')?.textContent?.trim() || '';
    const unit = tr.querySelector('.tt-unit')?.textContent?.trim() || '';
    const lect = tr.querySelector('.tt-lecturer')?.textContent?.trim() || '';
    const time = tr.querySelector('.tt-time')?.textContent?.trim() || '';
    const venue = tr.querySelector('.tt-venue')?.textContent?.trim() || '';
    return `${day} — ${unit} — ${lect} — ${time} — Room: ${venue}`;
  });

  const taskItems = Array.from(document.querySelectorAll('#taskBody tr')).map(tr => {
    const title = tr.querySelector('.task-title')?.textContent?.trim() || '';
    const due = tr.querySelector('.task-due')?.textContent?.trim() || '';
    return `${title} — Due: ${due}`;
  });

  const state = {
    courses: Array.from(courseList.children).map(li => li.querySelector('span')?.textContent || ''),
    tasks: taskItems,
    timetable: timetableItems,
    lecturers: Array.from(lecturerList.children).map(li => li.querySelector('span')?.textContent || ''),
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state));
}

function renderList(listEl, items) {
  listEl.innerHTML = '';
  items.forEach(text => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${text}</span><button class="item-delete-btn" aria-label="Delete" title="Delete">✕</button>`;
    listEl.appendChild(li);
  });
}

// ========== Add Courses ==========
const addCourseBtn = document.getElementById("addCourseBtn");
const courseList = document.getElementById("courseList");
const coursesDatalist = document.getElementById("coursesDatalist");
addCourseBtn.addEventListener("click", () => {
  const name = document.getElementById("courseName").value;
  if (!name) return alert("Enter course name");
  const li = document.createElement("li");
li.innerHTML = `<span>${name}</span><button class="item-delete-btn" aria-label="Delete" title="Delete">✕</button>`;
  courseList.appendChild(li);
  document.getElementById("courseName").value = "";
  refreshCoursesDatalist();
  saveAllLists();
  showToast('Course added');
});

courseList.addEventListener("click", (e) => {
  const btn = e.target.closest(".item-delete-btn");
  if (btn) {
    btn.parentElement.remove();
    refreshCoursesDatalist();
    saveAllLists();
  }
});

function refreshCoursesDatalist() {
  if (!coursesDatalist) return;
  coursesDatalist.innerHTML = '';
  // also refresh timetable unit select
  const timetableUnitSelect = document.getElementById("timetableUnit");
  if (timetableUnitSelect) {
    timetableUnitSelect.innerHTML = '';
    const def = document.createElement('option');
    def.value = '';
    def.textContent = 'Select unit';
    timetableUnitSelect.appendChild(def);
  }
  Array.from(courseList.children).forEach(li => {
    const text = li.querySelector('span')?.textContent?.trim();
    if (text) {
      const option = document.createElement('option');
      option.value = text;
      coursesDatalist.appendChild(option);
      if (timetableUnitSelect) {
        const o2 = document.createElement('option');
        o2.value = text;
        o2.textContent = text;
        timetableUnitSelect.appendChild(o2);
      }
    }
  });
}

// Initialize datalist on load
refreshCoursesDatalist();

// Rehydrate lists from localStorage on load
// Wait for DOM to be ready and ensure all elements exist
document.addEventListener('DOMContentLoaded', () => {
  const state = getState();
  console.log('Loading saved data for:', email, 'Storage key:', USER_STORAGE_KEY, 'State:', state);
  if (state.courses && state.courses.length) {
    renderList(courseList, state.courses);
  }
  if (state.tasks && state.tasks.length) {
    renderTasks(state.tasks);
  }
  if (state.timetable && state.timetable.length) {
    renderTimetable(state.timetable);
  }
  if (state.lecturers && state.lecturers.length) {
    renderLecturers(state.lecturers);
  }
  // refresh dependent selects/datalists after rendering
  refreshCoursesDatalist();
  refreshLecturersDatalist();

  // Load notification lead setting
  try {
    const savedLead = localStorage.getItem('notifyLead');
    if (savedLead && notifyLeadSelect) notifyLeadSelect.value = savedLead;
  } catch (_) {}

  // Request notification permission early
  try { if (typeof Notification !== 'undefined') Notification.requestPermission(); } catch (_) {}
});

// Also run immediately if DOM is already loaded (script at bottom of body)
if (document.readyState === 'loading') {
  // DOMContentLoaded will handle it
} else {
  // DOM already loaded, run immediately
  const state = getState();
  console.log('Loading saved data (immediate) for:', email, 'Storage key:', USER_STORAGE_KEY, 'State:', state);
  if (state.courses && state.courses.length) renderList(courseList, state.courses);
  if (state.tasks && state.tasks.length) renderTasks(state.tasks);
  if (state.timetable && state.timetable.length) renderTimetable(state.timetable);
  if (state.lecturers && state.lecturers.length) renderLecturers(state.lecturers);
  refreshCoursesDatalist();
  refreshLecturersDatalist();
}

function renderTimetable(items) {
  const tbody = document.getElementById('timetableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  items.forEach(text => {
    // Parse stored formats:
    // New:   "Day — Unit — Lecturer — Time — Room: Venue"
    // Legacy:"Unit — Lecturer — Time — Room: Venue"
    let day = '', unit = '', lect = '', time = '', venue = '';
    const parts = text.split(' — ').map(s => s.trim());
    if (parts.length >= 5) {
      [day, unit, lect, time] = parts;
      venue = parts[4].replace(/^Room:\s*/i, '');
    } else if (parts.length >= 4) {
      [unit, lect, time] = parts;
      venue = parts[3].replace(/^Room:\s*/i, '');
      day = 'Monday'; // default fallback for legacy entries
    } else {
      const p2 = text.split(' - ').map(s => s.trim());
      unit = p2[0] || '';
      lect = p2[1] || '';
      time = p2[2] || '';
      venue = (p2[3] || '').replace(/^Room:\s*/i, '');
      day = 'Monday';
    }
    addTimetableRow(day, unit, lect, time, venue);
  });
}

// ========== Add Tasks ==========
const addTaskBtn = document.getElementById("addTaskBtn");
const taskBody = document.getElementById("taskBody");
const taskDateInput = document.getElementById("taskDate");

function addTaskRow(title, due) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><span class="task-title">${title}</span></td>
    <td><span class="task-due">${due}</span></td>
    <td><button class="item-delete-btn" aria-label="Delete" title="Delete">✕</button></td>
  `;
  taskBody.appendChild(tr);
}

addTaskBtn.addEventListener("click", () => {
  const name = document.getElementById("taskName").value.trim();
  const date = taskDateInput.value;
  if (!name || !date) return alert("Fill all fields");
  addTaskRow(name, date);
  document.getElementById("taskName").value = "";
  taskDateInput.value = "";
  saveAllLists();
  showToast('Task added');
});

taskBody.addEventListener("click", (e) => {
  const btn = e.target.closest(".item-delete-btn");
  if (btn) {
    const row = btn.closest('tr');
    if (row) row.remove();
    saveAllLists();
  }
});

// Quick date chips
document.querySelectorAll('.chip-btn[data-date]').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.getAttribute('data-date');
    const d = new Date();
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    if (type === 'next7') d.setDate(d.getDate() + 7);
    if (type === 'next30') d.setDate(d.getDate() + 30);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    taskDateInput.value = `${yyyy}-${mm}-${dd}`;
    taskDateInput.focus();
  });
});

// ========== Timetable ==========
const addLectureBtn = document.getElementById("addLectureBtn");
const timetableBody = document.getElementById("timetableBody");
const lectureTimeInput = document.getElementById("lectureTime");
const lectureVenueInput = document.getElementById("lectureVenue");
const timetableUnitSelect = document.getElementById("timetableUnit");
const lecturersDatalist = document.getElementById("lecturersDatalist");
const lectureDaySelect = document.getElementById("lectureDay");
const notifyLeadSelect = document.getElementById("notifyLead");
if (notifyLeadSelect) {
  notifyLeadSelect.addEventListener('change', () => {
    try { localStorage.setItem('notifyLead', notifyLeadSelect.value); } catch (_) {}
  });
}

function addTimetableRow(day, unit, lecturer, time, venue) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><span class="tt-day">${day}</span></td>
    <td><span class="tt-unit">${unit}</span></td>
    <td><span class="tt-lecturer">${lecturer}</span></td>
    <td><span class="tt-time">${time}</span></td>
    <td><span class="tt-venue">${venue}</span></td>
    <td><button class="item-delete-btn" aria-label="Delete" title="Delete">✕</button></td>
  `;
  timetableBody.appendChild(tr);
}

addLectureBtn.addEventListener("click", () => {
  const unit = timetableUnitSelect.value;
  const lecturer = document.getElementById("timetableLecturer").value;
  const day = lectureDaySelect.value;
  const time = lectureTimeInput.value;
  const venue = lectureVenueInput.value;
  if (!unit || !lecturer || !day || !time || !venue) return alert("Fill all fields");

  addTimetableRow(day, unit, lecturer, time, venue);

  timetableUnitSelect.value = "";
  document.getElementById("timetableLecturer").value = "";
  lectureTimeInput.value = "";
  lectureVenueInput.value = "";
  saveAllLists();
  showToast('Lecture added');
});

timetableBody.addEventListener("click", (e) => {
  const btn = e.target.closest(".item-delete-btn");
  if (btn) {
    const row = btn.closest('tr');
    if (row) row.remove();
    saveAllLists();
  }
});

// ========== Lecturer Details ==========
const addLecturerBtn = document.getElementById("addLecturerBtn");
const lecturerList = document.getElementById("lecturerList");

function addLecturerRow(name, course, email, phone) {
  const li = document.createElement('li');
  li.className = 'lecturer-item';
  const emailHtml = email ? `<a href="mailto:${email}" class="lecturer-email">${email}</a>` : '';
  const phoneHtml = phone ? `<a href="tel:${phone}" class="lecturer-phone">${phone}</a>` : '';
  const hiddenText = `${name} (${course})${email?` — ${email}`:''}${phone?` — ${phone}`:''}`;
  li.innerHTML = `
    <div class="lecturer-card">
      <div class="lecturer-card-header">
        <div class="lecturer-name">${name}</div>
        <span class="lecturer-course">${course}</span>
      </div>
      <div class="lecturer-contact">${[emailHtml, phoneHtml].filter(Boolean).join(' · ') || '<span class="muted">No contact provided</span>'}</div>
    </div>
    <span class="lecturer-text" style="display:none;">${hiddenText}</span>
    <button class="item-delete-btn" aria-label="Delete" title="Delete">✕</button>
  `;
  lecturerList.appendChild(li);
}

addLecturerBtn.addEventListener("click", () => {
  const name = document.getElementById("lecturerName").value.trim();
  const course = document.getElementById("relatedCourse").value.trim();
  const lecturerEmail = document.getElementById("lecturerEmail").value.trim();
  const lecturerPhone = (document.getElementById("lecturerPhone")?.value || '').trim();
  if (!name || !course) return alert("Please fill Name and Course.");
  addLecturerRow(name, course, lecturerEmail, lecturerPhone);
  document.getElementById("lecturerName").value = "";
  document.getElementById("relatedCourse").value = "";
  document.getElementById("lecturerEmail").value = "";
  if (document.getElementById("lecturerPhone")) document.getElementById("lecturerPhone").value = "";
  refreshLecturersDatalist();
  saveAllLists();
  showToast('Lecturer added');
});

lecturerList.addEventListener("click", (e) => {
  const btn = e.target.closest(".item-delete-btn");
  if (btn) {
    btn.parentElement.remove();
    refreshLecturersDatalist();
    saveAllLists();
  }
});

function refreshLecturersDatalist() {
  if (!lecturersDatalist) return;
  lecturersDatalist.innerHTML = '';
  Array.from(lecturerList.children).forEach(li => {
    const name = li.querySelector('.lecturer-name')?.textContent?.trim() || li.querySelector('.lecturer-text')?.textContent?.split(' (')[0];
    if (name) {
      const option = document.createElement('option');
      option.value = name;
      lecturersDatalist.appendChild(option);
    }
  });
}

function renderLecturers(items) {
  lecturerList.innerHTML = '';
  items.forEach(text => {
    // Stored format: "Name (Course) — email — phone" (email/phone optional)
    let name = '', course = '', email = '', phone = '';
    try {
      const nameCourse = text.split(')')[0];
      name = nameCourse.split(' (')[0] || '';
      course = nameCourse.includes('(') ? nameCourse.split('(')[1] || '' : '';
      const rest = text.slice(nameCourse.length + 1).trim();
      const parts = rest.split('—').map(s => s.trim()).filter(Boolean);
      if (parts[0]) email = parts[0];
      if (parts[1]) phone = parts[1];
    } catch (_) {}
    if (name && course) addLecturerRow(name, course, email, phone);
  });
}

function renderTasks(items) {
  const tbody = document.getElementById('taskBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  items.forEach(text => {
    // Stored format: "Title — Due: YYYY-MM-DD"
    const parts = text.split(' — Due: ');
    const title = parts[0] || '';
    const due = parts[1] || '';
    addTaskRow(title, due);
  });
}

// ========== Recommended Books (via Supabase Function) ==========
const recommendBooksBtn = document.getElementById("recommendBooksBtn");
const recommendationsList = document.getElementById("recommendationsList");

let recommendAbortController = null;
let recommendBtnOriginalText = null;
function setRecommendLoading(loading) {
  if (!recommendBooksBtn) return;
  if (recommendBtnOriginalText == null) recommendBtnOriginalText = recommendBooksBtn.textContent;
  recommendBooksBtn.disabled = !!loading;
  recommendBooksBtn.textContent = loading ? 'Fetching…' : recommendBtnOriginalText;
}

const courseMoreState = {}; // course -> startIndex for Google Books

function bookCardHTML(b) {
  const title = (b.title || 'Untitled').toString();
  const author = (b.author || '').toString();
  return `
    ${b.url ? `<a href="${b.url}" target="_blank" rel="noopener">` : ''}
      <div class="book-title">${title}</div>
      ${author ? `<div class="book-author">By ${author}</div>` : ''}
      ${b.url ? `<div class="book-meta">View details ↗</div>` : ''}
    ${b.url ? `</a>` : ''}
  `;
}

function bookKey(b) {
  const url = (b.url || '').toLowerCase();
  if (url) return url;
  return `${(b.title||'').toLowerCase()}|${(b.author||'').toLowerCase()}`;
}

function dedupeBooks(arr) {
  const out = [];
  const seen = new Set();
  (arr || []).forEach(b => {
    const k = bookKey(b);
    if (!seen.has(k)) { seen.add(k); out.push(b); }
  });
  return out;
}

async function fetchBooksForCourse(course, signal) {
  // Try Supabase Function first
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/recommend-books`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courses: [course] }), signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return dedupeBooks(Array.isArray(data?.books) ? data.books : []);
  } catch (_) {
    // Fallback to Google Books
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(course + ' textbook')}&maxResults=12&printType=books&orderBy=relevance`, { signal })
      .then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] }));
    const arr = (r.items || []).map(it => {
      const v = it.volumeInfo || {}; return { title: v.title, author: (v.authors || [])[0], url: v.infoLink || v.previewLink };
    });
    return dedupeBooks(arr);
  }
}

async function fetchMoreForCourse(course, startIndex = 0, signal) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(course + ' textbook')}&maxResults=6&startIndex=${startIndex}&printType=books&orderBy=relevance`;
  const r = await fetch(url, { signal }).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] }));
  const arr = (r.items || []).map(it => {
    const v = it.volumeInfo || {}; return { title: v.title, author: (v.authors || [])[0], url: v.infoLink || v.previewLink };
  });
  return dedupeBooks(arr);
}

function renderCourseGroup(course, books) {
  const norm = (course || '').trim().toLowerCase();
  if (!norm) return;
  // Avoid duplicate groups
  if (recommendationsList.querySelector(`[data-course="${CSS.escape(norm)}"]`)) return;

  const group = document.createElement('div');
  group.className = 'course-group';
  group.dataset.course = norm;
  const title = document.createElement('h3');
  title.className = 'course-title';
  title.textContent = `For ${course}`;
  const ul = document.createElement('ul');
  ul.style.listStyle = 'none'; ul.style.padding = '0'; ul.style.margin = '0';

  // pick up to 3 random unique picks
  const unique = dedupeBooks(books);
  const picks = unique.slice(0, 3);
  const existingKeys = new Set(picks.map(bookKey));
  picks.forEach(b => {
    const li = document.createElement('li');
    li.className = 'book-item';
    li.innerHTML = bookCardHTML(b);
    ul.appendChild(li);
  });

  const actions = document.createElement('div');
  actions.className = 'course-actions';
  const moreBtn = document.createElement('button');
  moreBtn.className = 'more-btn';
  moreBtn.textContent = 'Show more';
  if (unique.length <= 3) moreBtn.style.display = 'none';
  actions.appendChild(moreBtn);

  moreBtn.addEventListener('click', async () => {
    const start = courseMoreState[course] || 0;
    const more = await fetchMoreForCourse(course, start, recommendAbortController?.signal);
    courseMoreState[course] = start + more.length;
    let added = 0;
    more.forEach(b => {
      const k = bookKey(b);
      if (existingKeys.has(k) || added >= 3) return;
      existingKeys.add(k); added++;
      const li = document.createElement('li');
      li.className = 'book-item';
      li.innerHTML = bookCardHTML(b);
      ul.appendChild(li);
    });
    if (added === 0) { moreBtn.disabled = true; moreBtn.textContent = 'No more results'; }
  });

  group.appendChild(title);
  group.appendChild(ul);
  group.appendChild(actions);
  recommendationsList.appendChild(group);
}

recommendBooksBtn.addEventListener("click", async () => {
  // Abort any in-flight request
  try { recommendAbortController?.abort(); } catch (_) {}
  recommendAbortController = new AbortController();
  courseMoreState.__reset = true; // marker to reset state
  for (const k of Object.keys(courseMoreState)) { if (k !== '__reset') delete courseMoreState[k]; }

  const courses = Array.from(courseList.children)
    .map(li => li.querySelector('span')?.textContent?.trim())
    .filter(Boolean);

  recommendationsList.innerHTML = '';

  if (courses.length === 0) {
    recommendationsList.innerHTML = '<li>Add at least one course to get recommendations.</li>';
    return;
  }

  setRecommendLoading(true);

  const courseMap = new Map();
  courses.forEach(c => {
    const norm = (c || '').trim().toLowerCase();
    if (norm && !courseMap.has(norm)) courseMap.set(norm, c);
  });

  recommendationsList.innerHTML = '';
  try {
    // Fetch for each course sequentially to keep order stable
    for (const [, course] of courseMap) {
      const books = await fetchBooksForCourse(course, recommendAbortController.signal);
      renderCourseGroup(course, books);
    }
  } catch (e) {
    if (e.name !== 'AbortError') console.error('recommendations error', e);
  } finally {
    setRecommendLoading(false);
  }
});

// ========== Notifications & Study Schedule ==========
async function checkUpcomingAssignments() {
  const today = new Date();
  const upcomingLimit = new Date();
  upcomingLimit.setDate(today.getDate() + 3);

  const items = Array.from(document.querySelectorAll('#taskBody tr')).map(tr => ({
    title: tr.querySelector('.task-title')?.textContent?.trim() || '',
    due_date: tr.querySelector('.task-due')?.textContent?.trim() || ''
  }));

  const upcoming = items.filter(a => {
    const due = new Date(a.due_date);
    // Compare by end of day for due date
    const endOfDue = new Date(a.due_date + 'T23:59:59');
    return endOfDue >= today && due <= upcomingLimit;
  });

  if (upcoming.length > 0) {
    alert(`⏰ You have ${upcoming.length} task(s) due soon:\n` +
      upcoming.map(a => `• ${a.title} (${a.due_date})`).join("\n"));
  }
}
checkUpcomingAssignments();

// ===== Notifications (Lectures and Tasks) =====
function getLeadMs() {
  const mins = parseInt(notifyLeadSelect?.value || '30', 10);
  return mins * 60 * 1000;
}

const notifiedKeys = new Set();
function clearOldNotificationsCache() {
  // Clear daily to prevent growth
  notifiedKeys.clear();
}
setInterval(clearOldNotificationsCache, 24 * 60 * 60 * 1000);

function nextOccurrence(dayName, timeHHMM) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const targetDow = days.indexOf(dayName);
  if (targetDow < 0) return null;
  const [hh, mm] = (timeHHMM || '00:00').split(':').map(Number);
  const now = new Date();
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  const diff = (targetDow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  // If the time today already passed, push to next week
  if (diff === 0 && d <= now) d.setDate(d.getDate() + 7);
  return d;
}

function notificationsEnabled() {
  try { return localStorage.getItem('notifications_enabled') === '1'; } catch (_) { return false; }
}

function canNotify() {
  if (!('Notification' in window)) return false;
  return notificationsEnabled() && Notification.permission === 'granted';
}

function notifyUser(title, body) {
  if (canNotify()) {
    try { new Notification(title, { body }); } catch (_) { alert(`${title}\n${body}`); }
  } else {
    // Silent fail to avoid spamming alerts when disabled
    console.log('Notification (disabled):', title, body);
  }
}

function checkLectureNotifications() {
  const lead = getLeadMs();
  const rows = Array.from(document.querySelectorAll('#timetableBody tr'));
  const now = new Date();
  rows.forEach(tr => {
    const day = tr.querySelector('.tt-day')?.textContent?.trim();
    const unit = tr.querySelector('.tt-unit')?.textContent?.trim();
    const time = tr.querySelector('.tt-time')?.textContent?.trim();
    const venue = tr.querySelector('.tt-venue')?.textContent?.trim();
    if (!day || !time) return;
    const next = nextOccurrence(day, time);
    if (!next) return;
    const key = `${day}|${unit}|${time}|${next.toDateString()}`;
    const notifyAt = new Date(next.getTime() - lead);
    const diff = next - now;
    if (diff > 0 && now >= notifyAt && !notifiedKeys.has(key)) {
      notifyUser('Lecture soon', `${unit} at ${time} in ${venue} (${day})`);
      notifiedKeys.add(key);
    }
  });
}

function checkTaskNotifications() {
  const lead = getLeadMs();
  const rows = Array.from(document.querySelectorAll('#taskBody tr'));
  const now = new Date();
  rows.forEach(tr => {
    const title = tr.querySelector('.task-title')?.textContent?.trim();
    const dueStr = tr.querySelector('.task-due')?.textContent?.trim();
    if (!dueStr) return;
    // Assume 09:00 local on due date
    const due = new Date(`${dueStr}T09:00:00`);
    const key = `task|${title}|${dueStr}`;
    const notifyAt = new Date(due.getTime() - lead);
    if (now >= notifyAt && now < due && !notifiedKeys.has(key)) {
      notifyUser('Task due soon', `${title} due ${dueStr}`);
      notifiedKeys.add(key);
    }
  });
}

let notifInterval = null;
function startNotificationLoop() {
  if (!notificationsEnabled() || (typeof Notification !== 'undefined' && Notification.permission !== 'granted')) {
    if (notifInterval) { clearInterval(notifInterval); notifInterval = null; }
    return;
  }
  checkLectureNotifications();
  checkTaskNotifications();
  if (!notifInterval) {
    notifInterval = setInterval(() => {
      checkLectureNotifications();
      checkTaskNotifications();
    }, 60 * 1000);
  }
}

// UI controls for notifications
const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');
const notificationsStatus = document.getElementById('notificationsStatus');

function refreshNotificationsStatus() {
  let status = 'Disabled';
  let enabled = false;
  if (typeof Notification === 'undefined') status = 'Not supported by this browser';
  else if (Notification.permission === 'granted' && notificationsEnabled()) { status = 'Enabled'; enabled = true; }
  else if (Notification.permission === 'denied') status = 'Blocked in browser settings';
  else status = 'Click Enable to allow';
  if (notificationsStatus) notificationsStatus.textContent = `Status: ${status}`;
  if (navNotifyBtn) {
    navNotifyBtn.classList.toggle('active', enabled);
    navNotifyBtn.title = `Notifications: ${status}`;
    navNotifyBtn.setAttribute('aria-label', `Notifications: ${status}`);
  }
}

if (enableNotificationsBtn) {
  enableNotificationsBtn.addEventListener('click', async () => {
    if (typeof Notification === 'undefined') { alert('Notifications not supported on this browser.'); return; }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        localStorage.setItem('notifications_enabled', '1');
        refreshNotificationsStatus();
        startNotificationLoop();
      } else {
        localStorage.setItem('notifications_enabled', '0');
        refreshNotificationsStatus();
        if (notifInterval) { clearInterval(notifInterval); notifInterval = null; }
      }
    } catch (e) { console.error('notify permission error', e); }
  });
}

if (navNotifyBtn) {
  navNotifyBtn.addEventListener('click', async () => {
    if (!notificationsEnabled() || (typeof Notification !== 'undefined' && Notification.permission !== 'granted')) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') localStorage.setItem('notifications_enabled', '1');
        refreshNotificationsStatus();
        startNotificationLoop();
      } catch (e) { console.error(e); }
    } else {
      const section = document.getElementById('notifications');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => { refreshNotificationsStatus(); startNotificationLoop(); });
if (document.readyState !== 'loading') { refreshNotificationsStatus(); startNotificationLoop(); }

// === Study Schedule Generator ===
const generateScheduleBtn = document.getElementById('generateScheduleBtn');
const scheduleList = document.getElementById('scheduleList');

function minutesToDate(baseDate, minutes) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + minutes * 60 * 1000);
}

function buildLocalSmartSchedule(timetable, tasks) {
  const horizonDays = 7;
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = new Date();
  today.setSeconds(0,0);

  // Normalize tasks with due dates
  const normTasks = tasks.map(t => ({
    title: t.title,
    due: t.due,
    dueDate: t.due ? new Date(`${t.due}T23:59:59`) : null,
  })).sort((a,b) => (a.dueDate?.getTime()||Infinity) - (b.dueDate?.getTime()||Infinity));

  // Collect lecture occurrences within horizon and block their times
  const lectureBlocks = new Map(); // key YYYY-MM-DD -> Set(minutes from midnight)
  const lectureItems = [];
  for (let i=0;i<=horizonDays;i++) {
    const d = new Date(today);
    d.setDate(d.getDate()+i);
    const dow = dayNames[d.getDay()];
    const sameDayLectures = timetable.filter(l => (l.day||'').trim() === dow && l.time);
    if (!sameDayLectures.length) continue;
    sameDayLectures.forEach(l => {
      const [hh,mm] = (l.time||'00:00').split(':').map(Number);
      const mins = hh*60+mm;
      const dateStr = d.toISOString().slice(0,10);
      if (!lectureBlocks.has(dateStr)) lectureBlocks.set(dateStr, new Set());
      lectureBlocks.get(dateStr).add(mins);
      lectureItems.push({
        title: `Lecture: ${l.unit}${l.lecturer?` — ${l.lecturer}`:''}`,
        start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm).toISOString(),
        duration_minutes: 60,
        notes: l.venue ? `Venue: ${l.venue}` : ''
      });
      // Add 30-min review one hour before if feasible
      const reviewStart = mins - 90;
      if (reviewStart >= 9*60) {
        lectureBlocks.get(dateStr).add(reviewStart);
        lectureItems.push({
          title: `Review: ${l.unit}`,
          start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(reviewStart/60), reviewStart%60).toISOString(),
          duration_minutes: 30,
          notes: 'Pre-lecture warm-up'
        });
      }
    });
  }

  // Build available slots per day (09:00-20:00 every 60 min) excluding lectures/reviews
  const daySlots = new Map(); // dateStr -> array of minute offsets
  for (let i=0;i<=horizonDays;i++) {
    const d = new Date(today);
    d.setDate(d.getDate()+i);
    const dateStr = d.toISOString().slice(0,10);
    const slots = [];
    for (let m=9*60; m<=20*60; m+=60) {
      const blocked = lectureBlocks.get(dateStr)?.has(m);
      if (!blocked) slots.push(m);
    }
    daySlots.set(dateStr, slots);
  }

  // Determine study sessions per task based on urgency
  const sessions = [];
  normTasks.forEach(t => {
    const due = t.dueDate;
    const daysLeft = due ? Math.max(0, Math.ceil((due - today) / (24*60*60*1000))) : horizonDays;
    let count = 1;
    if (daysLeft <= 1) count = 4; else if (daysLeft <= 3) count = 3; else if (daysLeft <= 7) count = 2; else count = 1;
    for (let i=0;i<count;i++) sessions.push({ title: `Focus: ${t.title}`, due, duration: 50 });
  });

  // Assign sessions to earliest available slots before due date when possible
  const scheduled = [...lectureItems];
  sessions.forEach(s => {
    let placed = false;
    for (let i=0;i<=horizonDays && !placed;i++) {
      const d = new Date(today); d.setDate(d.getDate()+i);
      const dateStr = d.toISOString().slice(0,10);
      if (s.due && new Date(`${dateStr}T23:59:59`) > s.due) break; // don't schedule after due when possible
      const slots = daySlots.get(dateStr) || [];
      if (slots.length) {
        const m = slots.shift(); // take earliest slot
        scheduled.push({
          title: s.title,
          start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(m/60), m%60).toISOString(),
          duration_minutes: s.duration,
          notes: 'Auto-scheduled by StudyPal'
        });
        placed = true;
      }
    }
    // If not placed before due, place in next available slot
    if (!placed) {
      outer: for (let i=0;i<=horizonDays;i++) {
        const d = new Date(today); d.setDate(d.getDate()+i);
        const slots = daySlots.get(d.toISOString().slice(0,10)) || [];
        if (slots.length) {
          const m = slots.shift();
          scheduled.push({
            title: s.title,
            start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(m/60), m%60).toISOString(),
            duration_minutes: s.duration,
            notes: 'Auto-scheduled by StudyPal'
          });
          break outer;
        }
      }
    }
  });

  // Sort by start datetime
  scheduled.sort((a,b) => new Date(a.start) - new Date(b.start));
  return scheduled;
}

generateScheduleBtn.addEventListener('click', async () => {
  scheduleList.innerHTML = "<li>🧠 Generating schedule...</li>";

  const tasks = Array.from(document.querySelectorAll('#taskBody tr')).map(tr => ({
    title: tr.querySelector('.task-title')?.textContent?.trim() || '',
    due: tr.querySelector('.task-due')?.textContent?.trim() || ''
  }));
  const hasTimetable = document.querySelectorAll('#timetableBody tr').length > 0;

  if (!hasTimetable) {
    scheduleList.innerHTML = "<li>Please add at least one lecture in your timetable to get an AI schedule.</li>";
    return;
  }

  // Build timetable struct once for reuse (also used by fallback)
  const timetableStruct = Array.from(document.querySelectorAll('#timetableBody tr')).map(tr => ({
    day: tr.querySelector('.tt-day')?.textContent?.trim() || '',
    unit: tr.querySelector('.tt-unit')?.textContent?.trim() || '',
    lecturer: tr.querySelector('.tt-lecturer')?.textContent?.trim() || '',
    time: tr.querySelector('.tt-time')?.textContent?.trim() || '',
    venue: tr.querySelector('.tt-venue')?.textContent?.trim() || '',
  }));

  try {
    const courses = Array.from(courseList.children)
      .map(li => li.querySelector('span')?.textContent?.trim())
      .filter(Boolean);
    const school = localStorage.getItem('school') || '';

    const resp = await fetch(`${SUPABASE_FUNCTIONS_URL}/generate-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courses, timetable: timetableStruct, tasks, school })
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const items = Array.isArray(data?.schedule) ? data.schedule : [];

    scheduleList.innerHTML = '';
    if (items.length === 0) {
      scheduleList.innerHTML = '<li>No schedule returned. Try adding more tasks or lectures.</li>';
      return;
    }

    items.forEach(it => {
      const li = document.createElement('li');
      const when = it.start ? new Date(it.start).toLocaleString() : '';
      const dur = it.duration_minutes ? ` • ${it.duration_minutes}m` : '';
      li.textContent = `📘 ${it.title}${when ? ' — ' + when : ''}${dur}`;
      if (it.notes) li.title = it.notes;
      scheduleList.appendChild(li);
    });
  } catch (e) {
    console.error('generate-schedule error:', e);
    // Local smart schedule using timetable + tasks
    const items = buildLocalSmartSchedule(timetableStruct, tasks);
    scheduleList.innerHTML = '';
    if (items.length === 0) {
      scheduleList.innerHTML = '<li>No available time slots in the next 7 days.</li>';
      return;
    }
    items.forEach(it => {
      const li = document.createElement('li');
      const when = it.start ? new Date(it.start).toLocaleString() : '';
      const dur = it.duration_minutes ? ` • ${it.duration_minutes}m` : '';
      li.textContent = `📘 ${it.title}${when ? ' — ' + when : ''}${dur}`;
      if (it.notes) li.title = it.notes;
      scheduleList.appendChild(li);
    });
  }
});
