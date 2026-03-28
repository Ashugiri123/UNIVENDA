// 1. MOBILE MENU TOGGLE
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');

if(burger) {
    burger.addEventListener('click', () => {
        // Toggle Nav
        if (nav.style.display === "flex") {
            nav.style.display = "none";
        } else {
            nav.style.display = "flex";
            nav.style.flexDirection = "column";
            nav.style.position = "absolute";
            nav.style.top = "80px";
            nav.style.right = "0";
            nav.style.width = "100%";
            nav.style.backgroundColor = "white";
            nav.style.padding = "20px";
            nav.style.boxShadow = "0 5px 10px rgba(0,0,0,0.1)";
            nav.style.zIndex = "100";
        }
        
        // Burger Animation
        burger.classList.toggle('toggle');
    });
}

// 2. SCROLL ANIMATION (The "Fade In" Effect)
const faders = document.querySelectorAll('.fade-in');

const appearOptions = {
    threshold: 0.2, // Trigger when 20% of item is visible
    rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            entry.target.classList.add('visible');
            appearOnScroll.unobserve(entry.target);
        }
    });
}, appearOptions);

faders.forEach(fader => {
    appearOnScroll.observe(fader);
});

// 3. FORM SUBMISSION MOCKUP
const verifyForm = document.getElementById('verifyForm');

if (verifyForm) {
    verifyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simulating a server request
        const btn = verifyForm.querySelector('button');
        const originalText = btn.innerText;
        
        btn.innerText = "Submitting...";
        btn.style.opacity = "0.7";
        
        setTimeout(() => {
            alert("Application Received! \n\nThank you for applying to UNIVENDA. We will verify your College ID and activate your seller account shortly.");
            verifyForm.reset();
            btn.innerText = "Application Sent";
            btn.style.backgroundColor = "#28a745"; // Green color
        }, 1500);
    });
}

// 4. NAVBAR SCROLL EFFECT
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    } else {
        header.style.boxShadow = "0 2px 15px rgba(0,0,0,0.05)";
    }
});