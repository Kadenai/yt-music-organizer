// pages-i18n.js - Applies translations and handles welcome page form

(function () {
    'use strict';

    var t = window.I18N.t;

    // ── Apply text translations ──
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        var translated = t(key);
        if (translated && translated !== key) {
            el.textContent = translated;
        }
    });

    // ── Apply placeholder translations ──
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-ph');
        var translated = t(key);
        if (translated && translated !== key) {
            el.placeholder = translated;
        }
    });

    // ── Update page title ──
    var titleEl = document.querySelector('[data-i18n-title]');
    if (titleEl) {
        var key = titleEl.getAttribute('data-i18n-title');
        var translated = t(key);
        if (translated && translated !== key) {
            document.title = translated + ' - YT Music Organizer';
        }
    }

    // ── Update html lang attribute ──
    document.documentElement.lang = window.I18N.lang === 'pt' ? 'pt-BR' : 'en';

    // ── Welcome Page: Last.fm Form Handler ──
    var inputUser = document.getElementById('wel-lastfm-user');
    var inputKey = document.getElementById('wel-lastfm-key');
    var statusEl = document.getElementById('wel-save-status');

    if (inputUser && inputKey && typeof chrome !== 'undefined' && chrome.storage) {
        var saveTimeout = null;

        // Load existing values
        chrome.storage.sync.get(['lastFmKey', 'lastFmUser'], function (res) {
            if (res.lastFmUser) inputUser.value = res.lastFmUser;
            if (res.lastFmKey) inputKey.value = res.lastFmKey;
        });

        function saveCredentials() {
            var u = inputUser.value.trim();
            var k = inputKey.value.trim();

            statusEl.textContent = t('welLfmSaving');
            statusEl.className = 'lfm-status lfm-status--saving';

            chrome.storage.sync.set({ lastFmUser: u, lastFmKey: k }, function () {
                statusEl.textContent = t('welLfmSaved');
                statusEl.className = 'lfm-status lfm-status--saved';
                setTimeout(function () {
                    statusEl.textContent = '';
                    statusEl.className = 'lfm-status';
                }, 3000);
            });
        }

        function debouncedSave() {
            clearTimeout(saveTimeout);
            statusEl.textContent = t('welLfmSaving');
            statusEl.className = 'lfm-status lfm-status--saving';
            saveTimeout = setTimeout(saveCredentials, 800);
        }

        inputUser.addEventListener('input', debouncedSave);
        inputKey.addEventListener('input', debouncedSave);
        inputUser.addEventListener('change', saveCredentials);
        inputKey.addEventListener('change', saveCredentials);
    }
})();
