/* ===== CLEAN FRONTEND CALLING BACKEND API ===== */

// ---- VIEW SWITCHER ----
window.app = {
    showView(id) {
        // Hide ALL views
        document.querySelectorAll(".view").forEach(v => {
            v.classList.remove("active");
            v.classList.add("hidden");
        });

        // Show selected view
        const view = document.getElementById(id);
        if (view) {
            view.classList.remove("hidden");
            view.classList.add("active");
        }
    }
};

// ---- UNIVERSAL API CALL TO BACKEND ----
async function getAIResponse(prompt) {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data.text;
    } catch (err) {
        console.error(err);
        return "❌ Error: " + err.message;
    }
}

/* ============================
   1) JOKE GENERATOR
================================ */

const btnJoke = document.getElementById("btn-joke");
const jokeText = document.getElementById("joke-text");
const jokeOutput = document.getElementById("joke-output");
const jokeLoading = document.getElementById("joke-loading");

if (btnJoke) {
    btnJoke.onclick = async () => {
        jokeLoading.classList.remove("hidden");
        jokeOutput.classList.add("hidden");

        const text = await getAIResponse("Tell me a short, clean, funny joke.");

        jokeLoading.classList.add("hidden");
        jokeText.textContent = text;
        jokeOutput.classList.remove("hidden");
    };
}

/* ============================
   2) QUIZ HELPER
================================ */

const btnQuiz = document.getElementById("btn-quiz");
const quizTopic = document.getElementById("quiz-topic");
const quizLoading = document.getElementById("quiz-loading");
const quizError = document.getElementById("quiz-error");
const quizContainer = document.getElementById("quiz-container");
const quizAnsBox = document.getElementById("quiz-answer-box");
const quizQ = document.getElementById("quiz-question");
const quizA = document.getElementById("quiz-answer");

if (btnQuiz) {
    btnQuiz.onclick = async () => {
        const topic = quizTopic.value.trim();

        if (!topic) {
            quizError.textContent = "Please enter a topic!";
            quizError.classList.remove("hidden");
            return;
        }

        quizError.classList.add("hidden");
        quizLoading.classList.remove("hidden");
        quizContainer.classList.add("hidden");
        quizAnsBox.classList.add("hidden");

        const q = await getAIResponse(`Give one simple quiz question about: ${topic}`);
        const a = await getAIResponse(`Answer this question in one line: ${q}`);

        quizLoading.classList.add("hidden");

        quizQ.textContent = q;
        quizA.textContent = a;

        quizContainer.classList.remove("hidden");
    };
}

const btnReveal = document.getElementById("btn-reveal");
if (btnReveal) {
    btnReveal.onclick = () => {
        quizAnsBox.classList.remove("hidden");
    };
}

/* ============================
   3) DAILY AFFIRMATION
================================ */

const affText = document.getElementById("affirmation-text");
const btnAff = document.getElementById("btn-affirmation");

if (btnAff) {
    btnAff.onclick = async () => {
        affText.textContent = "Generating...";
        const text = await getAIResponse("Give me a short 1-sentence positive daily affirmation.");
        affText.textContent = text;
    };

    // Auto-load affirmation on start if in affirmation view
    // Or just load one by default
    window.addEventListener('load', async () => {
        const text = await getAIResponse("Give me a short 1-sentence positive daily affirmation.");
        affText.textContent = text;
    });
}
