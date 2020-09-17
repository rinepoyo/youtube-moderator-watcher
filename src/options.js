function save(event) {
    event.preventDefault()
    M.Toast.dismissAll();

    const fix_time = parseInt(document.querySelector('#fix_time').value, 10)

    chrome.storage.sync.set({
        time: fix_time
    }, function () {
        M.toast({ html: '保存しました', displayLength: 2000 })
    })
}


function init() {
    loadOption().then((option) => {
        const fix_time = document.querySelector('#fix_time')
        fix_time.value = option.time

        const save_btn = document.querySelector('form')
        save_btn.addEventListener('submit', save);
    });
}

init();
