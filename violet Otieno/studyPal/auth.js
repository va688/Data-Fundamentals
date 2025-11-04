// Replace with your Supabase project URL and public anon key
const SUPABASE_URL = "https://wzcljidgvmiohucxmfyl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Y2xqaWRndm1pb2h1Y3htZnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzQzNTUsImV4cCI6MjA3NzcxMDM1NX0.ZVV7FIod5lQSUcIG3angv0LmCGQhF6G_ufAMq0yta-E";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById("email");
const schoolSelect = document.getElementById("school");
const manualSchool = document.getElementById("manualSchool");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

if (schoolSelect) {
  schoolSelect.addEventListener("change", () => {
    manualSchool.style.display = schoolSelect.value === "other" ? "block" : "none";
  });
}

async function handlePostAuth(email, school) {
  localStorage.setItem("email", email);
  if (school) {
    localStorage.setItem("school", school);
  }
  sessionStorage.setItem("new_user_welcome", "1");
  window.location.href = "dashboard.html";
}

async function handleLogin() {
  const email = emailInput.value;
  const password = passwordInput.value;
  if (!email || !password) {
    alert("Please fill all fields.");
    return;
  }
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Login failed: " + error.message);
    return;
  }
  await handlePostAuth(email);
}

async function handleSignup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  const school = schoolSelect && (schoolSelect.value === "other" ? manualSchool.value : schoolSelect.value);
  if (!email || !password || !school) {
    alert("Please fill all fields.");
    return;
  }
  const { error } = await client.auth.signUp({ email, password });
  if (error) {
    alert("Signup failed: " + error.message);
    return;
  }
  await handlePostAuth(email, school);
}

if (loginBtn) loginBtn.addEventListener("click", handleLogin);
if (signupBtn) signupBtn.addEventListener("click", handleSignup);

(async () => {
  const { data } = await client.auth.getSession();
  if (data.session) {
    // Already logged in, go to dashboard
    if (!window.location.pathname.endsWith("dashboard.html")) {
      window.location.href = "dashboard.html";
    }
  }
})();

// Force caret at start on focus for auth inputs
function moveCaretToStart(el) {
  try {
    el.selectionStart = 0;
    el.selectionEnd = 0;
  } catch (_) {}
}

document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]').forEach((input) => {
  input.addEventListener('focus', () => {
    // Delay to ensure browser applies focus before moving caret
    setTimeout(() => moveCaretToStart(input), 0);
  });
});