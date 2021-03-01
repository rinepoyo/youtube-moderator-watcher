'use strict';

function save(event) {
    event.preventDefault()
    M.Toast.dismissAll();

    const fix_time = parseInt(document.querySelector('#fix_time').value, 10)
    const fix_verified = document.querySelector('#fix_verified').checked
    const fix_unverified = document.querySelector('#fix_unverified').checked
    const names = textToArray(document.querySelector('#names').value)
    const ignore_names = textToArray(document.querySelector('#ignore_names').value)
    const ngwords = textToArray(document.querySelector('#ngwords').value)
    const ngwords_regexp = document.querySelector('#ngwords_regexp').checked
    const hidden_message = document.querySelector('#hidden_message').checked

    chrome.storage.sync.set({
        time: fix_time,
        fix_verified: fix_verified,
        fix_unverified: fix_unverified,
        names: names,
        ignore_names: ignore_names,
        ngwords: ngwords,
        ngwords_regexp: ngwords_regexp,
        hidden_message: hidden_message
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

        document.querySelector('#fix_verified').checked = option.fix_verified
        document.querySelector('#fix_unverified').checked = option.fix_unverified

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
        document.querySelector('#hidden_message').checked = option.hidden_message

        const save_btn = document.querySelector('form')
        save_btn.addEventListener('submit', save);
    });
}

init();
