// ==UserScript==
// @name         HDrezka rating
// @author       H1pp0
// @description  Показывает рейтинг на постере.
// @version      1.0.0
// @match        *://*.kinopub.me/*
// @match        *://*.tvhdrezka.com/*
// @match        *://*.hdrezka.com/*
// @match        *://*.rezka.ag/*
// @match        *://*.nukinopoisk.com/*
// @match        *://*.bestkinopoisk.com/*
// @match        *://*.aghdrezka.com/*
// @icon         http://kinopub.me/templates/hdrezka/images/favicon.ico
// @grant        none
// ==/UserScript==


'use strict';

async function getRating(id, userAgent) {
    const url = `https://${location.hostname}/engine/ajax/quick_content.php?id=${id}`;
    const headers = new Headers();
    headers.append('User-Agent', userAgent);

    const options = {
        method: 'GET',
        headers: headers,
    };

    let response = null;
    let rating = null;
    let ratingCount = null;

    try {
        response = await fetch(url, options);
    } catch (error) {
        console.error(`Error fetching rating for ID ${id}: ${error}`);
        throw error;
    }

    if (response.ok) {
        const data = await response.text();
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(data, 'text/html');
        const ratingEl = htmlDoc.querySelector('.b-content__bubble_rating b');
        if (ratingEl) {
            rating = ratingEl.textContent.trim();
            const ratingText = htmlDoc.querySelector('.b-content__bubble_rating').textContent.trim();
            ratingCount = ratingText.slice(ratingText.lastIndexOf('(') + 1, ratingText.lastIndexOf(')'));
        }
    } else if (response.status === 503) {
        console.warn(`503 error fetching rating for ID ${id}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getRating(id, userAgent);
    } else {
        console.error(`Error fetching rating for ID ${id}: ${response.statusText}`);
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    return [rating, ratingCount];
}

function adBlock() {
    const classes = [".b-post__mixedtext", ".b-post__rating_table"];
    classes.forEach(function(className) {
        let el = document.querySelector(className);
        if (el) {
            el.nextElementSibling.remove();
        }
    });
}

window.onload = async function() {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.576.0 Safari/537.36",
    ];

    const contentItems = document.querySelectorAll(".b-content__inline .b-content__inline_item");

    for (const item of contentItems) {
        const id = item.getAttribute('data-id');
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

        let rating = null;
        let ratingCount = null;
        try {
            [rating, ratingCount] = await getRating(id, userAgent);
        } catch (error) {
            console.error(`Error fetching rating for ID ${id}: ${error}`);
        }

        if (rating) {
            const span = document.createElement('span');
            let color = null;
            let fontSize = null;
            let strippedRatingCount = ratingCount.replace(/\s/g, '');
            span.innerHTML = `<b>${rating} - ${ratingCount}</b>`;
            if (strippedRatingCount > 1000) {
                color = 'black'; // highlight yellow if ratingCount is greater than 1000
                fontSize = "20px";
            } else if (strippedRatingCount < 1000) {
                color = 'white'; // highlight orange if ratingCount is greater than 100 but less than 1000
                fontSize = "10px";
            }
            const catElement = item.querySelector('.b-content__inline_item-cover span.cat i.entity');
            catElement.innerText = span.innerText;
            catElement.style.color = color;
            catElement.style.fontSize = fontSize;
        }
    }

    adBlock();
}
