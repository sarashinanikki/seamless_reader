var blocked = false;
var novelId;

window.onload = function () {
    setReadLaterButton();

    chrome.storage.local.get(function (items) {
        console.log(items);
        bookmarkList = items;
    });

    const url = location.href;
    var urlElements = url.split('/');
    if (urlElements.length >= 5) {
        novelId = urlElements[3];
        console.log(novelId);
    }
};

// 後で読む機能
function setReadLaterButton() {
    const urlElements = location.href.split('/');
    if (urlElements.length < 5) {
        return;
    }
    var novelId = '';
    novelId = urlElements[3];
    const url = `https://ncode.syosetu.com/${novelId}/`;
    const announce = document.getElementsByClassName('c-announce')[0];
    const menu = document.getElementsByClassName('c-menu__body')[0];

    var title = '';
    if (urlElements.length === 5) {
        title = document.getElementsByClassName('p-novel__title')[0].textContent;
    }
    else if (urlElements.length === 6) {
        title = announce.getElementsByTagName('a')[0].textContent;
    }

    const laterButton = document.createElement('div');
    laterButton.id = 'later-button';
    const span = document.createElement('span');
    span.innerHTML = '後で読む';
    laterButton.appendChild(span);

    laterButton.addEventListener('click', function() {
        var entity = {};
        const date = new Date();
        // 後で読むやつはIDの頭に$をつける
        entity['$'+novelId] = {
            "title": title,
            "url": url,
            "number": 0,
            "date": date.getTime()
        }
        console.log(entity);
        chrome.storage.local.set(entity, function () {
            console.log('readLaterList updated!');
            chrome.runtime.sendMessage({ message: "readLater"}, function (res) {
            });
            myAlert();
        });
    });
    
    const adjustLayout = document.getElementsByClassName('p-adjust-layout')[0];
    adjustLayout.insertAdjacentElement('beforebegin', laterButton);
}

function myAlert() {
    var body = document.querySelector('body');
    var dialog = document.createElement('div');
    dialog.id = 'my-alert'
    var message = document.createElement('p');
    message.className = 'alert-message';
    message.innerHTML = '登録されました';
    var check = document.createElement('img');
    check.className = 'checkmark';
    check.src = chrome.runtime.getURL('images/checkmark.png');
    dialog.appendChild(check);
    dialog.appendChild(message);
    body.appendChild(dialog);

    setTimeout(function() {
        body.removeChild(dialog);
    }, 3000);
}

chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
    if (req.message === 'novelId') {
        const url = location.href;
        var urlElements = url.split('/');
        var response = '';
        if (urlElements.length >= 5) {
            response = urlElements[3];
        }
        sendResponse(response);
    }
    return true
})

function isExistNext() {
    var ret = false;
    var pager = document.getElementsByClassName('c-pager')[0];
    if (pager) {
        var pages = pager.getElementsByTagName('a');
        var pageList = Array.from(pages);
        pageList.forEach(e => {
            if (e.textContent.startsWith('次')) {
                ret = true;
            }
        });
    }
    return ret;
}

var scrollBottomEvent = new Event('scrollBottom');
window.document.addEventListener('scroll', function () {
    var body = window.document.body;
    var html = window.document.documentElement;

    var scrollTop = body.scrollTop || html.scrollTop;
    var scrollBottom = html.scrollHeight - html.clientHeight - scrollTop;

    if (scrollBottom <= 4000) {
        window.document.dispatchEvent(scrollBottomEvent);
    }
});

function getNextPager() {
    const nextPages = document.getElementsByClassName('c-pager__item--next');
    const nextPage = nextPages[nextPages.length - 1];
    return nextPage;
}

function getPost(content) {
    const post = content.getElementsByClassName('p-novel')[0];
    return post;
}

function getNextUrl() {
    const nextPager = getNextPager();
    const nextUrl = nextPager.href;
    return nextUrl;
}

function getNovelTitle() {
    const title = document.getElementsByClassName('c-announce')[0].getElementsByTagName('a')[0];
    const ret = title.textContent;
    return ret;
}

document.addEventListener('scrollBottom', function () {
    if (isExistNext()) {
        if (blocked) return;
        blocked = true;
        const nextUrl = getNextUrl();
        console.log(nextUrl);

        var xhr = new XMLHttpRequest();
        xhr.open('GET', nextUrl, true);
        xhr.responseType = 'document';
        xhr.send();

        xhr.onload = function () {
            if (xhr.status !== 200) {
                console.log('access failed');
            }
            else {
                const nextContent = xhr.response;
                const nextPost = getPost(nextContent);

                // 最初のpagerは不要なので削除
                const nextPager = nextPost.getElementsByClassName('c-pager')[0];
                nextPost.removeChild(nextPager);

                const posts = document.getElementsByClassName('p-novel');
                const lastPost = posts[posts.length - 1];

                lastPost.insertAdjacentHTML('afterend', nextPost.outerHTML);
                nextPost.insertAdjacentHTML('beforebegin', '<p> <br><br> </p>');

                var entity = {};
                const novelTitle = getNovelTitle(nextContent);
                const number = nextUrl.split('/')[4];
                const date = new Date();
                entity[novelId] = {
                    "title": novelTitle,
                    "url": nextUrl,
                    "number": number,
                    "date": date.getTime()
                }
                console.log(entity);
                chrome.storage.local.set(entity, function () {
                    console.log('bookmark updated!');
                    chrome.runtime.sendMessage({message: "update", novelId: novelId}, function (res) {
                    });
                });
            }
            blocked = false;
        }
    }
});
