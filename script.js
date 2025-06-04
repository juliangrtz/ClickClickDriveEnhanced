// ==UserScript==
// @name         ClickClickDriveEnhanced
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Enhances videos and adds keyboard shortcuts to the ClickClickDrive website.
// @match        https://www.clickclickdrive.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastAnswerState = null;
    let lastEnhancedVideoUrl = null;

    const SELECTORS = {
        showAnswersButton: 'button[data-test="QUESTION_SHOW_ANSWERS_BUTTON"]',
        nextButton: '[data-test="QUESTION_NEXT_BUTTON"]',
        closeResultsButton: '[data-test="RESULTS_PAGE_CLOSE_BUTTON"]',
        checkbox: '[data-test="QUESTION_ANSWER_OPTION_CHECKBOX"]',
        markButton: '.MarkButton__Wrapper-sc-1jns6xg-0',
        correctAnswer: '[data-answer-type="CORRECT_ANSWER_CHOSEN"], input[style*="color: rgb(81, 227, 174)"]',
        incorrectAnswer: '[data-answer-type="CORRECT_ANSWER_NOT_CHOSEN"], input[style*="color: rgb(247, 70, 86)"], [data-answer-type="WRONG_ANSWER"]'
    };

    function simulateClick(element) {
        element?.click();
    }

    function isInTheorySection() {
        return window.location.href.startsWith('https://www.clickclickdrive.de/theorie/');
    }

    function isInFinalExam() {
        return Boolean(document.querySelector('main[class^="FinalExamLayout"]'));
    }

    function handleKeyPress(event) {
        const key = event.key;

        if (isInFinalExam()) return;

        if (isInTheorySection() && key === ' ') {
            event.preventDefault();
            const buttons = [
                document.querySelector(SELECTORS.showAnswersButton),
                document.querySelector(SELECTORS.nextButton),
                document.querySelector(SELECTORS.closeResultsButton)
            ];

            for (const button of buttons) {
                if (button && !button.disabled) {
                    simulateClick(button);
                    break;
                }
            }
        } else if (key >= '1' && key <= '3') {
            const index = parseInt(key) - 1;
            const checkboxes = document.querySelectorAll(SELECTORS.checkbox);
            if (checkboxes[index]) {
                simulateClick(checkboxes[index]);
            }
        } else if (key === 'Enter') {
            markQuestion();
        }
    }

    function markQuestion() {
        const button = document.querySelector(SELECTORS.markButton);
        if (button) {
            button.setAttribute('data-waiting', 'true');
            simulateClick(button);
        }
    }

    function focusInput() {
        const input = document.querySelector('input');
        input?.focus();
    }

    function autoAdvanceOnCorrect() {
        const correct = document.querySelector(SELECTORS.correctAnswer);
        const incorrect = document.querySelector(SELECTORS.incorrectAnswer);

        const currentState = correct && !incorrect ? 'success' : incorrect ? 'error' : null;

        if (currentState !== lastAnswerState) {
            lastAnswerState = currentState;

            if (currentState === 'success') {
                const nextBtn = document.querySelector(SELECTORS.nextButton);
                simulateClick(nextBtn);
            }
        }
    }

    function transformFilename(original) {
        return original
            .split('/')
            .pop()
            .toLowerCase()
            .replace('.mp4', '')
            .replace(/[\.\-]/g, '') + 'v1440.mp4';
    }

    function openEnhancedVideo() {
        const video = document.querySelector('video');
        const playVideoBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.innerHTML.includes("Video abspielen"));
        if (!video || !playVideoBtn) return;

        const originalUrl = video.src;
        if (!originalUrl || originalUrl === lastEnhancedVideoUrl) return;

        lastEnhancedVideoUrl = originalUrl;
        const filename = transformFilename(originalUrl);
        const enhancedUrl = `https://video2.kalaiwa.de/assets/${filename}`;

        window.open(enhancedUrl, '_blank');
    }

    const observer = new MutationObserver(() => {
        focusInput();
        autoAdvanceOnCorrect();
        openEnhancedVideo();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', handleKeyPress);
})();
