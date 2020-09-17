async function loadOption() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            time: 30
        }, function (option) {
            resolve(option)
        })
    })
}
