/* global localStorage */

let answerDiv;
let bodyDiv;
let gridContainerDiv;
let infoDiv;
let questionDiv;
let resultsDiv;
let startDiv;

let answer = "";
let averageAll;
let averageLastTen;
let correct = 0;
let expected = "";
let flashTimer;
let highscore;
let intervalId;
let results;
let startTime;
let wrong = 0;
let pending = true;
let buttonAnimations = new Map();
let questions = [];

const time = 5;

function flash(clazz)
{
    if (flashTimer) {
        clearTimeout(flashTimer);
        bodyDiv.classList.remove("correct");
        bodyDiv.classList.remove("wrong");
    }
    bodyDiv.classList.add(clazz);
    flashTimer = setTimeout(() => {
        flashTimer = undefined;
        bodyDiv.classList.remove(clazz);
        if (!answer)
            answerDiv.innerHTML = pending ? "" : "?";
    }, 500);
}

function pressButton(value)
{
    const button = document.getElementById(`button${value}`);
    let cur = buttonAnimations.get(value);
    if (cur) {
        clearTimeout(cur);
    }
    button.classList.add("pressed");
    buttonAnimations.set(value, setTimeout(() => {
        buttonAnimations.delete(value);
        button.classList.remove("pressed");
    }, 500));
}

function question()
{
    const a = Math.floor(Math.random() * 10) + 2;
    const b = Math.floor(Math.random() * 10) + 2;
    expected = String(a * b);
    answer = "";
    const questionText = `${a} x ${b}`;
    questions.push({question: questionText, time: Date.now() });
    questionDiv.innerHTML = questionText;
}
function onClick(value)
{
    if (pending) {
        start();
        return;
    } else if (value === undefined) {
        return;
    }
    pressButton(value);

    if (!startTime) {
        startTime = Date.now();
        intervalId = setInterval(updateInfo, 1000);
    }

    const button = document.getElementById(`button${value}`);

    answer += value;
    answerDiv.innerHTML = answer;
    if (expected.length === answer.length) {
        let q = questions[questions.length - 1];
        q.time = q.time - Date.now();
        // console.log(typeof answer, typeof value, answer, value);
        let clazz;
        if (answer === expected) {
            q.correct = true;
            ++correct;
            updateInfo();
            clazz = "correct";
        } else {
            q.correct = false;
            ++wrong;
            updateInfo();
            clazz = "wrong";
        }
        question();
        flash(clazz);
    }
}

function onBackspace()
{
    answer = answer.substr(0, answer.length - 1);
    answerDiv.innerHTML = answer || "?";
}

function clearHistory()
{
    localStorage.clear();
    updateInfo();
}

function onKey(event)
{
    if (pending) {
        start();
        return;
    }
    switch (event.key) {
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
        onClick(event.key);
        break;
    case "Backspace":
        onBackspace();
        break;
    case "x":
        clearHistory();
        break;
    }
}

function updateResults()
{
    highscore = undefined;
    let lastTen = 0;
    let total = 0;
    for (let idx=0; idx<results.length; ++idx) {
        const value = results[idx].correct;
        if (!highscore || value > highscore)
            highscore = value;
        total += value;
        if (results.length - idx <= 10) {
            lastTen += value;
        }
    }
    averageAll = results.length ? Math.round(total / results.length) : undefined;
    averageLastTen = results.length ? Math.round(lastTen / Math.min(10, results.length)) : undefined;
}

function updateInfo()
{
    const now = Date.now();
    const elapsed = Math.min(time * 1000, now - startTime);
    if (elapsed === time * 1000) {
        clearInterval(intervalId);
        startTime = undefined;
        intervalId = undefined;
        results.push({ correct, wrong, time: Date.now() });
        localStorage.setItem("results", JSON.stringify(results));
        updateResults();
        pending = true;
        questionDiv.innerHTML = "";
        answerDiv.innerHTML = "";
        startDiv.classList.remove("hidden");
        gridContainerDiv.classList.add("hidden");
        gridContainerDiv.classList.remove("grid-container");
        resultsDiv.innerHTML = results.map((result, idx) => {
            const res = result.correct === undefined ? "" : (result.correct ? "correct" : "wrong");
            return `${idx + 1}/${results.length}: ${result.question} => ${res}`;
        }).join("<br\>");
        resultsDiv.classList.remove("hidden");
        resultsDiv.classList.add("results");
    }

    let str = "";
    if (results.length) {
        str += `HS: ${highscore} Avg: ${averageAll} Last 10: ${averageLastTen} --- `;
    }

    str += `${correct}/${wrong + correct}`;
    if (correct + wrong) {
        str += ` %: ${((correct / (correct + wrong)) * 100).toFixed(1)}`;
    }

    if (startTime) {
        str += ` Time: ${time - Math.round(elapsed / 1000)}`;
    }
    infoDiv.innerHTML = str;
}

function start()
{
    questions = [];
    pending = false;
    startDiv.classList.add("hidden"); // can it have more than one hidden?
    gridContainerDiv.classList.remove("hidden");
    gridContainerDiv.classList.add("grid-container");
    correct = wrong = 0;
    updateInfo();
    question();
    answerDiv.innerHTML = "?";
}

function onLoad()
{
    console.log("onLoad");
    document.addEventListener('keydown', onKey);
    answerDiv = document.getElementById("answer");
    bodyDiv = document.getElementById("body");
    gridContainerDiv = document.getElementById("grid-container");
    resultsDiv = document.getElementById("results");
    infoDiv = document.getElementById("info");
    questionDiv = document.getElementById("question");
    startDiv = document.getElementById("start");

    for (let i=0; i<10; ++i) {
        const button = document.getElementById(`button${i}`);
        button.onclick = onClick.bind(undefined, i);
    }
    startDiv.onclick = onClick;
    document.getElementById("backspace").onclick = onBackspace;

    const str = localStorage.getItem("results");
    results = str ? JSON.parse(str) : [];
    updateResults();
    updateInfo();
    // start();
}
