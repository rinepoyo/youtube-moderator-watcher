/**
 * 下記のライセンスで配布されている成果物を使用しています。
 * Material icons (https://material.io/resources/icons/)
 * Apache license version 2.0 (https://www.apache.org/licenses/LICENSE-2.0.html)
 */

// 固定用の枠
let _container = null

// チャット表示領域
let _scroller = null

// 固定待ちデータ
let targets = []

// チャット表示領域
function getScroller() {
    if (!_scroller) {
        _scroller = document.querySelector('#item-scroller');
    }
    return _scroller
}

// 固定用の枠
function getContainer() {
    if (!_container) {
        _container = document.createElement('div')
        _container.id = "fixed_container"

        const renderer = document.querySelector('yt-live-chat-renderer')
        const separator = renderer.querySelector('#separator')
        separator.appendChild(_container)

        const link = `<link href="https://fonts.googleapis.com/icon?family=Material+Icons"
            rel="stylesheet">`
        document.head.insertAdjacentHTML('beforeend', link)
    }
    return _container
}

// 固定時間
async function getFixTime() {
    const option = await loadOption();
    return option.time * 1000
}

// オーナーとモデレータのチャットを抽出
const parseCommentNode = async function (node) {
    // チャット以外のDOM変更は無視
    const nodeName = node.nodeName.toUpperCase()
    if (nodeName !== 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER' &&
        nodeName !== 'YT-LIVE-CHAT-PAID-MESSAGE-RENDERER' &&
        nodeName !== 'YT-LIVE-CHAT-MEMBERSHIP-ITEM-RENDERER' &&
        nodeName !== 'YT-LIVE-CHAT-PAID-STICKER-RENDERER'
    ) {
        return;
    }

    // 対象チャットが表示領域から消えるタイミングを監視
    if (targets.length > 0) {
        const node = targets[0][0]
        const timestamp = targets[0][1]
        const scrollerTop = getScroller().scrollTop
        if (node.offsetTop < scrollerTop) {
            fixChat(node, timestamp)
            targets.shift()
        }
    }

    // モデレータ、オーナー以外のチャットは無視
    const authorName = node.querySelector('#author-name')
    if (authorName.className.indexOf('owner') >= 0 ||
        authorName.className.indexOf('moderator') >= 0) {

        // 固定待ちデータに追加
        const timestamp = new Date().getTime()
        targets.push([node, timestamp])
    }
}

// チャットを固定する
async function fixChat(node, timestamp) {
    // 固定用の枠
    const container = getContainer();

    // 固定用にチャットを複製
    // yt-*タグをそのまま使うと本家のスクリプトに操作されるのでdivタグを作成
    const clone = document.createElement('div')
    clone.innerHTML = node.innerHTML
    clone.removeAttribute('id')
    clone.setAttribute('class', node.className)
    clone.classList.add('_yt_live_chat_text_message_renderer')

    // divタグで複製してから、元のyt-*タグを削除
    const imgParOrg = clone.querySelector('yt-img-shadow')
    if (imgParOrg) {
        const imgPar = document.createElement('div')
        imgPar.id = imgParOrg.id
        imgPar.setAttribute('class', imgParOrg.className)
        imgPar.innerHTML = imgParOrg.innerHTML
        imgParOrg.parentNode.insertBefore(imgPar, imgParOrg)
        imgParOrg.outerHTML = ""
    }

    const authorChipOrg = clone.querySelector('yt-live-chat-author-chip')
    if (authorChipOrg) {
        const authorChip = document.createElement('div')
        authorChip.setAttribute('class', authorChipOrg.className)
        authorChip.innerHTML = authorChipOrg.innerHTML
        authorChip.classList.add('_yt_live_chat_author_chip')
        authorChipOrg.parentNode.insertBefore(authorChip, authorChipOrg)
        authorChipOrg.outerHTML = ""
    }

    // 確認済みとモデレータアイコンで最大2個
    copyAuthorBadge(clone)
    copyAuthorBadge(clone)

    const menu = clone.querySelector('#menu')
    if (menu) {
        menu.outerHTML = ""
    }

    const action = clone.querySelector('#inline-action-button-container')
    if (action) {
        action.outerHTML = ""
    }

    // 手動で消すボタン
    const close = document.createElement('i')
    close.setAttribute('class', 'material-icons')
    close.textContent = 'close'
    close.onclick = () => { removeFixedChat(clone) }
    clone.appendChild(close)

    // 固定時間を計算
    const fixTime = await getFixTime();
    const removeTime = fixTime - (new Date().getTime() - timestamp)
    if (removeTime > 0) {
        container.appendChild(clone)
        reserveRemoveFixedChat(clone, removeTime)
    } else {
        console.log('固定しない')
    }
}

function copyAuthorBadge(clone) {
    const badgeOrg = clone.querySelector('yt-live-chat-author-badge-renderer')
    if (badgeOrg) {
        const badge = document.createElement('div')
        badge.className = badgeOrg.className
        badge.classList.add('_yt-live-chat-author-badge-renderer')
        badge.setAttribute('type', badgeOrg.getAttribute('type'))
        badge.setAttribute('aria-label', badgeOrg.getAttribute('aria-label'))
        badge.setAttribute('shared-tooltip-text', badgeOrg.getAttribute('shared-tooltip-text'))
        badge.innerHTML = badgeOrg.innerHTML
        badgeOrg.parentNode.insertBefore(badge, badgeOrg)
        badgeOrg.outerHTML = ""

        const iconOrg = badge.querySelector('yt-icon')
        if (iconOrg) {
            const icon = document.createElement('div')
            icon.className = iconOrg.className
            icon.innerHTML = iconOrg.innerHTML
            iconOrg.parentNode.insertBefore(icon, iconOrg)
            iconOrg.outerHTML = ""
        }
    }
}

// 固定チャットを消す（手動）
function removeFixedChat(node) {
    node.outerHTML = ""
    console.log('けした2')
}

// 一定時間後に固定チャットを消す
async function reserveRemoveFixedChat(node, removeTime) {
    const fn = function () {
        if (node.parentNode) {
            node.outerHTML = ""
        }
    }
    window.setTimeout(fn, removeTime)
}

// チャットの監視処理
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((addNode) => {
            parseCommentNode(addNode)
        })
    });
});

// チャット領域が描画されるまで待ってから監視を開始
function startObserveIfExists() {
    const items = document.querySelector('#items.yt-live-chat-item-list-renderer')
    if (items) {
        observer.observe(items, {
            childList: true,
        });
    } else {
        window.setTimeout(startObserveIfExists, 500);
    }
}
startObserveIfExists();