'use strict';

async function loadOption() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            time: 30,
            fix_verified: true,
            fix_unverified: true,
            names: [],
            ignore_names: [],
            ngwords: [],
            ngwords_regexp: false,
            hidden_message: false
        }, function (option) {
            resolve(option)
        })
    })
}
