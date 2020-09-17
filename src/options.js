
function save() {
    M.Toast.dismissAll();

    const time = document.querySelector('#time').value;

    chrome.storage.sync.set({
        time: time
    }, function () {
        M.toast({ html: '保存しました', displayLength: 2000 })
    })
}


function init() {
    loadOption().then((option) => {
        const select = document.querySelector('#time');
        select.value = option.time;
        const instances = M.FormSelect.init(select);
        select.addEventListener('change', save);
    });
}

init();
