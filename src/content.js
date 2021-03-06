'use strict';

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

// 設定値のキャッシュ
let option = null

let hidden_message = ''

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

// オーナーとモデレータのチャットを抽出
const parseCommentNode = async function (node) {

    // NGワード
    if (option.ngwords.length > 0) {
        const messageNode = node.querySelector('#message')
        if (messageNode) {
            let match = false
            let message;

            if (messageNode.childElementCount > 0) {
                // 絵文字をテキストとして扱う
                message = "";
                for (const node of messageNode.childNodes) {
                    message += node.textContent ? node.textContent : node.alt ? node.alt : ""
                }
            } else {
                message = messageNode.textContent
            }

            if (option.ngwords_regexp) {
                if (option.ngwordsPtn.some(ptn => ptn.test(message))) {
                    match = true
                }
            } else {
                if (option.ngwords.some(ngword => message.includes(ngword))) {
                    match = true
                }
            }

            if (match) {
                if (option.hidden_message) {
                    messageNode.title = message
                    messageNode.textContent = hidden_message
                    messageNode.classList.add('ngmessage')
                } else {
                    node.hidden = true
                }
                return
            }
        }
    }

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
        const fixedAreaHeight = getContainer().getBoundingClientRect().height
        if (node.offsetTop < scrollerTop + fixedAreaHeight) {
            fixChat(node, timestamp)
            targets.shift()
        }
    }

    // モデレータ、オーナー以外のチャットは無視
    const authorName = node.querySelector('#author-name')
    if (authorName) {
        let userName = ''
        if (option.names.length > 0 || option.ignore_names.length > 0) {
            userName = authorName.textContent
        }
        if (checkFix(node, authorName, userName)) {
            // 除外指定
            if (option.ignore_names.indexOf(userName) != -1) {
                return
            }

            // 固定待ちデータに追加
            const timestamp = new Date().getTime()
            targets.push([node, timestamp])
        }
    }
}

function checkFix(node, authorName, userName) {
    if (option.fix_verified && authorName.className.indexOf('owner') >= 0) {
        return true
    }

    if (option.fix_verified || option.fix_unverified) {
        const moderator = authorName.className.indexOf('moderator') >= 0
        if (moderator) {
            if (option.fix_verified && option.fix_unverified) {
                return true
            }

            const verified = node.querySelector('[type="verified"]')
            if (verified) {
                if (option.fix_verified) {
                    return true
                }
            } else {
                if (option.fix_unverified) {
                    return true
                }
            }
        }
    }

    if (option.names.indexOf(userName) != -1) {
        return true
    }

    return false
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
    if (node.hasAttribute('author-is-owner')) {
        clone.setAttribute('author-is-owner', "")
    } else {
        // 確認済みモデレータの場合にスタイル調整
        const verified = node.querySelector('[type="verified"]')
        if (verified) {
            clone.classList.add('_verified_moderator')
        }
    }
    clone.setAttribute('author-type', node.getAttribute('author-type'))
    clone.classList.add('_yt-live-chat-text-message-renderer')


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
        authorChip.classList.add('_yt-live-chat-author-chip')
        if (authorChipOrg.hasAttribute('is-highlighted')) {
            authorChip.setAttribute('is-highlighted', "")
        }
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
    const fixTime = option.time * 1000
    if (fixTime === 0) {
        // 永続固定
        container.appendChild(clone)
    } else {
        // 指定時間固定
        const removeTime = fixTime - (new Date().getTime() - timestamp)
        if (removeTime > 0) {
            container.appendChild(clone)
            reserveRemoveFixedChat(clone, removeTime)
        }
    }

    // スクロール
    container.scrollTop = container.scrollHeight
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
            icon.classList.add('_yt-icon')
            iconOrg.parentNode.insertBefore(icon, iconOrg)
            iconOrg.outerHTML = ""
        }
    }
}

// 固定チャットを消す（手動）
function removeFixedChat(node) {
    node.outerHTML = ""
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

// 設定読込
async function refreshOption() {
    option = await loadOption();

    // 正規表現パターンを事前に生成
    if (option.ngwords_regexp && option.ngwords.length > 0) {
        option.ngwordsPtn = option.ngwords.map(ngword => new RegExp(ngword))
    }
}

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

async function initialize() {

    await refreshOption()

    hidden_message = chrome.i18n.getMessage('hidden_text');

    // 設定変更の通知を監視
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        switch (message.type) {
            case 'OPTIONS_UPDATE_NOTIFICATION':
                refreshOption()
                break;
            default:
                break;
        }
        sendResponse({})
    });

    startObserveIfExists();
}
initialize();
