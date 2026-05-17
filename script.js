// ─────────────────────────────────────────────
// 0. Custom Cursor — RAF-throttled, no per-event DOM writes
// ─────────────────────────────────────────────
const cursorDot = document.getElementById('cursor-dot');
let mouseX = 0, mouseY = 0, rafScheduled = false;

document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(() => {
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top  = mouseY + 'px';
            rafScheduled = false;
        });
    }
}, { passive: true });

document.querySelectorAll('button, a, .polaroid, .dot, .close').forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.style.transform = 'translate(-50%,-50%) scale(2.2)');
    el.addEventListener('mouseleave', () => cursorDot.style.transform = 'translate(-50%,-50%) scale(1)');
});

// ─────────────────────────────────────────────
// 1. Navigation & Smooth Scroll
// ─────────────────────────────────────────────
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// ─────────────────────────────────────────────
// 2. Nav Dots — IntersectionObserver (no scroll handler)
// ─────────────────────────────────────────────
const sections = ['home', 'letter', 'memories', 'reasons', 'music', 'final'];
const dots = document.querySelectorAll('.dot');

dots.forEach(dot => {
    dot.addEventListener('click', () => scrollToSection(dot.dataset.section));
});

const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const idx = sections.indexOf(entry.target.id);
            if (idx !== -1) {
                dots.forEach(d => d.classList.remove('active'));
                dots[idx] && dots[idx].classList.add('active');
            }
        }
    });
}, { threshold: 0.5 });

sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) navObserver.observe(el);
});

// ─────────────────────────────────────────────
// 3. Scroll Reveal — IntersectionObserver (replaces scroll handler)
// ─────────────────────────────────────────────
let isTypingStarted = false;

const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('active');

        if (el.classList.contains('envelope-container') && !isTypingStarted) {
            typeLetter();
            isTypingStarted = true;
        }

        revealObserver.unobserve(el); // unobserve once revealed
    });
}, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─────────────────────────────────────────────
// 4. Typing Animation — build string, set once per char (avoids reflow loop)
// ─────────────────────────────────────────────
const letterText = "Dear lablab,\n\nfirst of all, I MISS YOU COOMEREEEE BALIK KA NA KJASHFJHGASGFDHASGDJ!!!!!!!! okay tapos nako mag tantrums hehe. Okay, zerious na po. Three months, who would've thought? I know that we have been struggling lately, but i'm happy. I'm happy that we still find a reason to stay, to hold on to each other even at challenging times. Thank you for your patience, support, and understanding lab. I know i've been hard to deal with, so thank you for staying, for trying with me kahit na there are 10 billion reazons to give up. i hope to love you more and more. I wish now that we can never stop loving and caring for each other.\n\nmahal kita lablab";

let charIndex = 0;
const typewriterEl = document.getElementById("typewriter-text");

// Pre-split into segments to avoid innerHTML += on every character
const segments = [];
letterText.split('').forEach(ch => segments.push(ch === '\n' ? '<br>' : ch));

function typeLetter() {
    if (charIndex < segments.length) {
        // Batch: join all rendered segments once, set innerHTML once
        typewriterEl.innerHTML = segments.slice(0, ++charIndex).join('');
        setTimeout(typeLetter, 55);
    } else {
        typewriterEl.classList.add('done');
        setTimeout(() => scrollToSection('memories'), 3000);
    }
}

// ─────────────────────────────────────────────
// 5. Lightbox Logic
// ─────────────────────────────────────────────
const modal     = document.getElementById("lightbox");
const modalImg  = document.getElementById("modal-img");
const captionEl = document.getElementById("modal-caption");

const viewedPics = new Set();
let hasScrolledToReasons = false;

function openModal(imgSrc, caption) {
    modal.style.display = "flex";
    requestAnimationFrame(() => modal.classList.add('show'));
    modalImg.src = imgSrc;
    captionEl.innerHTML = caption;
    viewedPics.add(imgSrc);
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => {
        modal.style.display = "none";
        const totalPics = document.querySelectorAll('.polaroid').length;
        if (viewedPics.size >= totalPics && !hasScrolledToReasons) {
            hasScrolledToReasons = true;
            setTimeout(() => scrollToSection('reasons'), 1000);
        }
    }, 420);
}

modal.addEventListener('click', e => {
    if (e.target === modal || e.target.classList.contains('modal-backdrop')) closeModal();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// ─────────────────────────────────────────────
// 6. Reasons — Reveal & Float Hearts
// ─────────────────────────────────────────────
const clickedReasons = new Set();
let hasScrolledToMusic = false;

function showReason(button, message) {
    if (button.classList.contains('revealed')) return;

    button.style.transform = "scale(0.96) translateX(0)";
    setTimeout(() => {
        button.querySelector('.reason-label').textContent = message;
        button.classList.add('revealed');
        button.style.transform = "";
    }, 200);

    createFloatingHeart(button);
    clickedReasons.add(message);

    const totalReasons = document.querySelectorAll('.reason-btn').length;
    if (clickedReasons.size >= totalReasons && !hasScrolledToMusic) {
        hasScrolledToMusic = true;
        setTimeout(() => scrollToSection('music'), 3000);
    }
}

// ─────────────────────────────────────────────
// 7. Music Player
// ─────────────────────────────────────────────
let isPlaying = false;
const bgMusic      = document.getElementById("bg-music");
const playPauseBtn = document.getElementById("play-pause-btn");
const playIcon     = document.getElementById("play-icon");
const vinyl        = document.getElementById("vinyl-disc");
const tonearm      = document.getElementById("tonearm");
const progressFill = document.getElementById("progress-fill");

function toggleMusic() {
    if (isPlaying) {
        bgMusic.pause();
        playIcon.textContent = "▶ Play";
        vinyl.classList.remove("playing");
        if (tonearm) tonearm.classList.remove("playing");
    } else {
        bgMusic.play().catch(() => {
            alert("Please replace 'jaehyun.mp3' with the actual audio file! 🎵");
        });
        playIcon.textContent = "❚❚ Pause";
        vinyl.classList.add("playing");
        if (tonearm) tonearm.classList.add("playing");
    }
    isPlaying = !isPlaying;
}

bgMusic.addEventListener('timeupdate', () => {
    if (bgMusic.duration && progressFill) {
        progressFill.style.width = (bgMusic.currentTime / bgMusic.duration * 100) + '%';
    }
}, { passive: true });

bgMusic.addEventListener('ended', () => {
    isPlaying = false;
    if (playIcon) playIcon.textContent = "▶ Play";
    vinyl.classList.remove("playing");
    if (tonearm) tonearm.classList.remove("playing");
    if (progressFill) progressFill.style.width = '0%';
});

// ─────────────────────────────────────────────
// 8. Ambient Petals — lazy creation via IntersectionObserver trigger
// ─────────────────────────────────────────────
function createPetals() {
    const container = document.querySelector('.petal-container');
    if (!container) return;
    // Reduced count + use will-change only when in view
    for (let j = 0; j < 6; j++) {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        petal.style.left              = Math.random() * 100 + 'vw';
        petal.style.animationDuration = (Math.random() * 14 + 10) + 's';
        petal.style.animationDelay    = (Math.random() * 10) + 's';
        const size = (Math.random() * 14 + 10) + 'px';
        petal.style.width  = size;
        petal.style.height = size;
        container.appendChild(petal);
    }
}
createPetals();

// ─────────────────────────────────────────────
// 9. Sparkle Stars
// ─────────────────────────────────────────────
function createSparkles() {
    const container = document.getElementById('sparkles-container');
    if (!container) return;
    for (let k = 0; k < 8; k++) {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        const size = (Math.random() * 5 + 3) + 'px';
        sparkle.style.width               = size;
        sparkle.style.height              = size;
        sparkle.style.left                = Math.random() * 100 + 'vw';
        sparkle.style.top                 = Math.random() * 100 + 'vh';
        sparkle.style.animationDuration   = (Math.random() * 3 + 2) + 's';
        sparkle.style.animationDelay      = (Math.random() * 5) + 's';
        container.appendChild(sparkle);
    }
}
createSparkles();

// ─────────────────────────────────────────────
// 10. Floating Heart on Reason Click
// ─────────────────────────────────────────────
function createFloatingHeart(element) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart-js';
    heart.textContent = ['💖', '💗', '💕', '❤️'][Math.floor(Math.random() * 4)];
    const rect = element.getBoundingClientRect();
    heart.style.cssText = `left:${rect.left + rect.width / 2 - 12}px;top:${rect.top + window.scrollY - 10}px`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1500);
}

// ─────────────────────────────────────────────
// 11. Final Bloom Ending
// ─────────────────────────────────────────────
function triggerBloom() {
    const overlay = document.getElementById('bloom-overlay');
    overlay.classList.add('active');
    overlay.innerHTML = '<h1>now send me vm kisses!! duhhhhhhh!!!</h1>';

    for (let h = 0; h < 20; h++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'floating-heart-js';
            heart.textContent = ['💖', '💗', '💕', '🌸', '❤️'][Math.floor(Math.random() * 5)];
            heart.style.cssText = `left:${Math.random() * window.innerWidth}px;top:${Math.random() * window.innerHeight + window.scrollY}px;z-index:3000;font-size:${Math.random() * 2 + 1}rem`;
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 1500);
        }, h * 120);
    }
}
