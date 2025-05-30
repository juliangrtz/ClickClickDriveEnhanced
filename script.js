// ==UserScript==
// @name         ClickClickDriveEnhanced
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Enhances videos and adds keyboard shortcuts to the ClickClickDrive website.
// @match        https://www.clickclickdrive.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastAnswerState = null;
    let enhancedVideoUrl = null;

    function simulateClick(element) {
        if (element) {
            element.click();
        }
    }

    function handleKeyPress(event) {
        const key = event.key;
        const isTargetURL = window.location.href.startsWith('https://www.clickclickdrive.de/theorie/');

        if (isTargetURL && key === ' ') {
            event.preventDefault();
            const buttons = [
                Array.from(document.querySelectorAll('button')).find(btn => btn.innerHTML.includes("Video abspielen")),  // TODO: Make language-independent
                document.querySelector('.PlayButton-sc-1m0g6ip-0'),
                Array.from(document.querySelectorAll('button')).find(btn => btn.innerHTML.includes("Antwortvarianten anzeigen")),  // TODO: Make language-independent
                document.querySelector('[data-test="QUESTION_NEXT_BUTTON"]'),
                document.querySelector('[data-test="RESULTS_PAGE_CLOSE_BUTTON"]')
            ];
            for (const button of buttons) {
                if (button && !button.disabled) {
                    simulateClick(button);
                    break;
                }
            }
        } else if (key >= '1' && key <= '3') {
            const checkboxes = document.querySelectorAll('[data-test="QUESTION_ANSWER_OPTION_CHECKBOX"]');
            const index = parseInt(key, 10) - 1;
            if (checkboxes[index]) {
                simulateClick(checkboxes[index]);
            }
        } else if (key === 'Enter') {
            markQuestion();
        }
    }

    function markQuestion() {
        const markButton = document.querySelector('.MarkButton__Wrapper-sc-1jns6xg-0');
        if (markButton) {
            markButton.setAttribute('data-waiting', 'true');
            simulateClick(markButton);
        }
    }

    function focusInputField() {
        const inputField = document.querySelector('input');
        if (inputField) {
            inputField.focus();
        }
    }

    function checkAnswers() {
        const correctChosen = document.querySelector('[data-answer-type="CORRECT_ANSWER_CHOSEN"], input[style*="color: rgb(81, 227, 174)"]');
        const correctNotChosen = document.querySelector('[data-answer-type="CORRECT_ANSWER_NOT_CHOSEN"], input[style*="color: rgb(247, 70, 86)"], [data-answer-type="WRONG_ANSWER"]');

        const currentState = correctChosen && !correctNotChosen ? 'success' : correctNotChosen ? 'error' : null;

        if (currentState !== lastAnswerState) {
            lastAnswerState = currentState;

            if (currentState === 'success') {
                simulateClick(document.querySelector('[data-test="QUESTION_NEXT_BUTTON"]'));
            }
        }
    }

    function transformURLtoFilename(urlOrFilename) {
        const lastPart = urlOrFilename.substring(urlOrFilename.lastIndexOf('/') + 1);
        const cleaned = lastPart
            .toLowerCase()
            .replace('.mp4', '')
            .replace(/[\.\-]/g, '');
        return cleaned + 'v1440.mp4';
    }

    function enhanceVideo() {
        const video = document.querySelector("video");
        const playVideoBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => btn.innerHTML.includes("Video abspielen"));
        if (!video || !playVideoBtn) return;

        simulateClick(Array.from(document.querySelectorAll('button')).find(btn => btn.innerHTML.includes("Video abspielen"))); // TODO: Make language-independent
        //simulateClick(Array.from(document.querySelectorAll('button')).find(btn => btn.innerHTML.includes("Antwortvarianten anzeigen")));  // TODO: Make language-independent

        const originalUrl = video.src;
        if (!originalUrl || originalUrl === enhancedVideoUrl) return;

        // 1.1.02-050-M.mp4 => 1102050mv1440.mp4
        const lastPart = originalUrl.substring(originalUrl.lastIndexOf('/') + 1);
        const url = "https://video2.kalaiwa.de/assets/" + transformURLtoFilename(lastPart);

        enhancedVideoUrl = originalUrl;
        window.open(url, '_blank');
    }

    const observer = new MutationObserver((_mutations) => {
        focusInputField();
        checkAnswers();
        enhanceVideo();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('keydown', handleKeyPress);

    const parentStyle = document.createElement('style');
    parentStyle.type = 'text/css';
    parentStyle.appendChild(document.createTextNode('.List__ListItem-sc-1sexzs7-1-parent { counter-reset: list-item; }'));
    document.head.appendChild(parentStyle);
})();