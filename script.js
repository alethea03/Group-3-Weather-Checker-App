// ===== Typewriter Script =====
const quotes = [
  "Empowering innovation through collaboration.",
  "Designing solutions that make a difference.",
  "Coding the future, one project at a time.",
  "Strive for excellence, embrace creativity."
];

let currentQuote = 0;
let currentChar = 0;
const typeSpeed = 100;
const pauseBetween = 2000;
const typewriterElement = document.getElementById("typewriter");

function typeQuote() {
  const quote = quotes[currentQuote];
  if (currentChar < quote.length) {
    typewriterElement.textContent += quote.charAt(currentChar);
    currentChar++;
    setTimeout(typeQuote, typeSpeed);
  } else {
    setTimeout(deleteQuote, pauseBetween);
  }
}

function deleteQuote() {
  const quote = quotes[currentQuote];
  if (currentChar > 0) {
    typewriterElement.textContent = quote.substring(0, currentChar - 1);
    currentChar--;
    setTimeout(deleteQuote, typeSpeed / 2);
  } else {
    currentQuote = (currentQuote + 1) % quotes.length;
    setTimeout(typeQuote, typeSpeed);
  }
}

typeQuote();

// ===== Modal & Cards =====
const cards = document.querySelectorAll('.card-front');
const modal = document.getElementById('infoModal');
const modalPhoto = document.getElementById('modalPhoto');
const modalName = document.getElementById('modalName');
const modalID = document.getElementById('modalID');
const modalAge = document.getElementById('modalAge');
const modalRole = document.getElementById('modalRole');
const phpBar = document.getElementById('phpBar');
const htmlBar = document.getElementById('htmlBar');
const cssBar = document.getElementById('cssBar');
const pythonBar = document.getElementById('pythonBar');
const radarCtx = document.getElementById('radarChart').getContext('2d');
let radarChart;

function showRadar(skills) {
  if (radarChart) radarChart.destroy();
  radarChart = new Chart(radarCtx, {
    type: 'radar',
    data: {
      labels: ['PHP', 'HTML', 'CSS', 'Python'],
      datasets: [{
        label: 'Skill Levels',
        data: skills,
        backgroundColor: 'rgba(0, 238, 255, 0.2)',
        borderColor: '#00eaff',
        pointBackgroundColor: '#00eaff',
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        r: {
          angleLines: { color: '#00eaff33' },
          grid: { color: '#00eaff33' },
          pointLabels: { color: '#00eaff' },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { display: false }
        }
      },
      plugins: {
        legend: { labels: { color: '#00eaff' } }
      }
    }
  });
}

cards.forEach((card) => {
  card.addEventListener('click', () => {
    if (card.dataset.id === "reo") {
      modalPhoto.src = "reo.jpg";
      modalName.textContent = "REO JOHN H. ANDOHUYAN";
      modalID.textContent = "School ID: 221-01818";
      modalAge.textContent = "Age: 21";
      modalRole.textContent = "Backend Developer";
      phpBar.style.width = "70%";
      htmlBar.style.width = "80%";
      cssBar.style.width = "75%";
      pythonBar.style.width = "95%";
      showRadar([70, 80, 75, 95]);
    } else if (card.dataset.id === "alethea") {
      modalPhoto.src = "alethea.jpg";
      modalName.textContent = "Alethea S.";
      modalID.textContent = "School ID: 221-01234";
      modalAge.textContent = "Age: 20";
      modalRole.textContent = "Frontend Developer";
      phpBar.style.width = "60%";
      htmlBar.style.width = "90%";
      cssBar.style.width = "85%";
      pythonBar.style.width = "70%";
      showRadar([60, 90, 85, 70]);
    } else if (card.dataset.id === "kristel") {
      modalPhoto.src = "kristel.jpg";
      modalName.textContent = "Kristel M.";
      modalID.textContent = "School ID: 221-05678";
      modalAge.textContent = "Age: 21";
      modalRole.textContent = "UI/UX Designer";
      phpBar.style.width = "50%";
      htmlBar.style.width = "75%";
      cssBar.style.width = "85%";
      pythonBar.style.width = "65%";
      showRadar([50, 75, 85, 65]);
    }
    modal.style.display = "flex";
  });
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    phpBar.style.width = "0";
    htmlBar.style.width = "0";
    cssBar.style.width = "0";
    pythonBar.style.width = "0";
  }
});
// ===== Typing "console" box: random python-ish lines, looping =====
(function(){
  const codeBox = document.getElementById('codeBox');
  if (!codeBox) return; // nothing to do if element missing

  const maxLines = 12;
  const typingSpeed = 40;    // ms per character
  const pauseAfterLine = 700;

  const lines = [];

  function escapeHTML(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function render() {
    // join lines and append a blinking cursor element
    codeBox.innerHTML = lines.map(l => escapeHTML(l)).join('\n') + '<span class="cursor"></span>';
    // keep scrolled to bottom
    codeBox.scrollTop = codeBox.scrollHeight;
  }

  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function randomIdentifier(){
    const names = ['alpha','beta','user','items','result','data','value','idx','count','temp','node'];
    return randChoice(names) + Math.floor(Math.random()*90);
  }

  function generateRandomPythonLine(){
    // a small set of Python-like snippets — expands easily
    const snippets = [
      `import random`,
      `def ${randomIdentifier()}():`,
      `for ${randChoice(['i','j','k'])} in range(${Math.floor(Math.random()*10)+1}):`,
      `if ${randomIdentifier()} > ${Math.floor(Math.random()*100)}:`,
      `${randomIdentifier()} = ${Math.floor(Math.random()*100)}`,
      `print("${randChoice(['Hello','Processing','Computed','Loaded'])} ${Math.floor(Math.random()*100)}")`,
      `class ${randomIdentifier().replace(/[0-9]/g,'')}:`,
      `with open("data.txt","r") as f:`,
      `return ${Math.floor(Math.random()*100)}`,
      `items.append(${Math.floor(Math.random()*10)})`,
      `try:`,
      `except Exception as e:`,
      `lambda x: x * ${Math.floor(Math.random()*10)+1}`
    ];
    return randChoice(snippets);
  }

  function typeLine(line, done){
    if (lines.length === 0) lines.push('');
    let i = 0;
    function step(){
      lines[lines.length-1] = line.slice(0, i+1);
      render();
      i++;
      if (i < line.length) {
        setTimeout(step, typingSpeed);
      } else {
        // completed line
        setTimeout(done, pauseAfterLine);
      }
    }
    step();
  }

  function nextLineLoop(){
    const next = generateRandomPythonLine();
    if (lines.length >= maxLines) lines.shift();
    lines.push(''); // placeholder for the line being typed
    typeLine(next, nextLineLoop);
  }

  // Start the continuous typing
  nextLineLoop();
})();

// Smooth scrolling for nav links AND buttons
document.querySelectorAll('nav ul li a, .btn.primary').forEach(link => {
  link.addEventListener('click', e => {
    const target = link.getAttribute('href');
    if (target && target.startsWith('#')) {
      e.preventDefault();
      document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
    }
  });
});

document.getElementById("aboutBtn").addEventListener("click", function () {
  // Hide all sections
  document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "none");

  // Show About section
  document.getElementById("aboutSection").style.display = "block";

  // Optional: highlight active nav item
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  this.classList.add("active");
});

// ===== Check Internet Connection =====
window.addEventListener('load', () => {
  if (!navigator.onLine) {
    alert("⚠️ You are currently offline. Some features may not work properly.");
  }
});

window.addEventListener('offline', () => {
  alert("⚠️ You lost internet connection. Please check your connection.");
});

window.addEventListener('online', () => {
  alert("✅ Internet connection restored!");
});

// ===== Smooth Scrolling for Navbar Links =====
document.querySelectorAll('nav ul li a').forEach(link => {
  link.addEventListener('click', e => {
    const target = link.getAttribute('href');
    if (target.startsWith('#')) {
      e.preventDefault();
      document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Contact Form Submission =====
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', function(e) {
  e.preventDefault(); // prevent actual form submission
  alert('Thank you for contacting us! We will get back to you soon.');
  contactForm.reset(); // clears the form
});
