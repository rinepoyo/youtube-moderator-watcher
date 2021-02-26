async function loadOption() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            time: 30,
            official_only: false,
            names: []
        }, function (option) {
            resolve(option)
        })
    })
}
