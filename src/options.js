'use strict';

function save(event) {
    event.preventDefault()
    M.Toast.dismissAll();

    const fix_time = parseInt(document.querySelector('#fix_time').value, 10)
    const official_only = document.querySelector('#official_only').checked
    const names = textToArray(document.querySelector('#names').value)
    const ignore_names = textToArray(document.querySelector('#ignore_names').value)
    const ngwords = textToArray(document.querySelector('#ngwords').value)
    const ngwords_regexp = document.querySelector('#ngwords_regexp').checked

    chrome.storage.sync.set({
        time: fix_time,
        official_only: official_only,
        names: names,
        ignore_names: ignore_names,
        ngwords: ngwords,
        ngwords_regexp: ngwords_regexp
    }, function () {
        init()
        M.toast({ html: '保存しました', displayLength: 2000 })
    })

    // 設定変更を通知
    chrome.tabs.query({
        url: "https://*.youtube.com/**"
    }, function (tabs) {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: "OPTIONS_UPDATE_NOTIFICATION"
            }, {});
        });
    });
}

function textToArray(value) {
    return value.split('\n').map(v => v.trim()).filter(v => v)
}

function init() {
    loadOption().then((option) => {
        const fix_time = document.querySelector('#fix_time')
        fix_time.value = option.time

        const official_only = document.querySelector('#official_only')
        official_only.checked = option.official_only

        const names = document.querySelector('#names')
        names.value = option.names.join('\n')
        M.textareaAutoResize(names);

        const ignore_names = document.querySelector('#ignore_names')
        ignore_names.value = option.ignore_names.join('\n')
        M.textareaAutoResize(ignore_names);

        const ngwords = document.querySelector('#ngwords')
        ngwords.value = option.ngwords.join('\n')
        M.textareaAutoResize(ngwords);

        document.querySelector('#ngwords_regexp').checked = option.ngwords_regexp

        const save_btn = document.querySelector('form')
        save_btn.addEventListener('submit', save);
    });
}

init();
