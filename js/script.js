import { GoogleGenAI, Type } from "https://esm.run/@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

// Shared Helper: Generate simple text
const generate = async (prompt) => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("API Error:", error);
        throw new Error("Could not connect to AI.");
    }
};

// Application State & Navigation Logic
const app = {
    // Navigation: Switch Views
    showView: (viewId) => {
        // Hide all views
        document.querySelectorAll('.view').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
        
        // Show target view
        const target = document.getElementById(viewId);
        target.classList.remove('hidden');
        target.classList.add('active');

        // Special trigger for Affirmation
        if (viewId === 'affirmation-view') {
            affirmationLogic.fetchAffirmation();
        }
    }
};

// Make app accessible in HTML (for onclick attributes)
window.app = app;


/* =========================================
   Project 1: Joke Generator Logic
   ========================================= */
const jokeLogic = {
    btn: document.getElementById('btn-joke'),
    outputBox: document.getElementById('joke-output'),
    outputText: document.getElementById('joke-text'),
    loadingText: document.getElementById('joke-loading'),

    init: () => {
        jokeLogic.btn.addEventListener('click', async () => {
            jokeLogic.setLoading(true);
            
            try {
                // Template literal prompt
                const prompt = `Tell me a short, clean, and witty joke.`;
                const joke = await generate(prompt);
                
                jokeLogic.outputText.innerText = joke;
                jokeLogic.outputBox.classList.remove('hidden');
            } catch (err) {
                jokeLogic.outputText.innerText = "Oops! The comedian is on break. Try again.";
                jokeLogic.outputBox.classList.remove('hidden');
            } finally {
                jokeLogic.setLoading(false);
            }
        });
    },

    setLoading: (isLoading) => {
        if (isLoading) {
            jokeLogic.loadingText.classList.remove('hidden');
            jokeLogic.outputBox.classList.add('hidden');
            jokeLogic.btn.disabled = true;
        } else {
            jokeLogic.loadingText.classList.add('hidden');
            jokeLogic.btn.disabled = false;
        }
    }
};


/* =========================================
   Project 2: Quiz Helper Logic
   ========================================= */
const quizLogic = {
    btn: document.getElementById('btn-quiz'),
    input: document.getElementById('quiz-topic'),
    container: document.getElementById('quiz-container'),
    questionEl: document.getElementById('quiz-question'),
    answerBox: document.getElementById('quiz-answer-box'),
    answerEl: document.getElementById('quiz-answer'),
    revealBtn: document.getElementById('btn-reveal'),
    loadingText: document.getElementById('quiz-loading'),
    errorText: document.getElementById('quiz-error'),

    init: () => {
        // Generate Quiz
        quizLogic.btn.addEventListener('click', async () => {
            const topic = quizLogic.input.value.trim();
            if (!topic) return;

            quizLogic.setLoading(true);
            quizLogic.errorText.classList.add('hidden');
            quizLogic.container.classList.add('hidden');

            try {
                // Using Schema for structured JSON
                const response = await ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: `Give me one simple quiz question and answer about ${topic}.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                answer: { type: Type.STRING },
                            },
                            required: ["question", "answer"],
                        },
                    },
                });

                // Destructuring response
                const { question, answer } = JSON.parse(response.text);

                // Update UI
                quizLogic.questionEl.innerText = question;
                quizLogic.answerEl.innerText = answer;
                
                // Hide answer initially
                quizLogic.answerBox.classList.add('hidden');
                quizLogic.revealBtn.classList.remove('hidden');
                quizLogic.container.classList.remove('hidden');

            } catch (err) {
                console.error(err);
                quizLogic.errorText.innerText = "Failed to create quiz. Try a different topic.";
                quizLogic.errorText.classList.remove('hidden');
            } finally {
                quizLogic.setLoading(false);
            }
        });

        // Reveal Answer
        quizLogic.revealBtn.addEventListener('click', () => {
            quizLogic.answerBox.classList.remove('hidden');
            quizLogic.revealBtn.classList.add('hidden');
        });
    },

    setLoading: (isLoading) => {
        if (isLoading) {
            quizLogic.loadingText.classList.remove('hidden');
            quizLogic.btn.disabled = true;
        } else {
            quizLogic.loadingText.classList.add('hidden');
            quizLogic.btn.disabled = false;
        }
    }
};


/* =========================================
   Project 3: Daily Affirmation Logic
   ========================================= */
const affirmationLogic = {
    btn: document.getElementById('btn-affirmation'),
    textEl: document.getElementById('affirmation-text'),
    
    init: () => {
        // Button listener for manual refresh
        affirmationLogic.btn.addEventListener('click', () => {
            affirmationLogic.fetchAffirmation();
        });
    },

    fetchAffirmation: async () => {
        affirmationLogic.textEl.innerText = "Gathering positive energy...";
        affirmationLogic.btn.disabled = true;

        try {
            const prompt = "Give me a one-sentence positive affirmation to start the day.";
            const result = await generate(prompt);
            affirmationLogic.textEl.innerText = result;
        } catch (error) {
            affirmationLogic.textEl.innerText = "You are capable of amazing things today.";
        } finally {
            affirmationLogic.btn.disabled = false;
        }
    }
};


// Initialize all logic when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    jokeLogic.init();
    quizLogic.init();
    affirmationLogic.init();
});
