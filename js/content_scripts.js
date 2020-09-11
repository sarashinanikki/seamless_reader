var blocked = false;
var novelId;

window.onload = function () {
    var elem = document.getElementById('novel_honbun');
    if (elem) {
        elem.removeAttribute('id');
        elem.classList.add('novel_honbun');
    }

    var novelNo = document.getElementById('novel_no');
    if (novelNo) {
        novelNo.removeAttribute('id');
        novelNo.classList.add('novel_no');
    }

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

    var guides = document.getElementsByClassName('novel_bn');
    var lastGuide = guides[guides.length - 1];
    lastGuide.innerHTML = null;
    var atogaki = document.getElementById('novel_a');
    if (atogaki) {
        atogaki.innerHTML = null;
    }
};

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
    var guide = document.getElementsByClassName('novel_bn')[0];
    if (guide) {
        var guides = guide.getElementsByTagName('a');
        var guideList = Array.from(guides);
        guideList.forEach(e => {
            if (e.textContent[0] == '次') {
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

function getNextGuide(content) {
    var guide = content.getElementsByClassName('novel_bn');
    var ret = guide[guide.length-1];
    return ret;
}

function getCurGuide() {
    var guide = document.getElementsByClassName('novel_bn');
    var ret = guide[guide.length - 2];
    return ret;
}

function getNumber(content) {
    var novelNo = content.getElementById('novel_no');
    if (novelNo) {
        novelNo.removeAttribute('id');
        novelNo.classList.add('novel_no');
    }
    return novelNo;
}

function getHonbun(content) {
    var nextHonbun = content.getElementById('novel_honbun');
    nextHonbun.removeAttribute('id');
    nextHonbun.classList.add('novel_honbun');
    return nextHonbun;
}

function getNextUrl(guide) {
    var ret = null;
    var guides = guide.getElementsByTagName('a');
    var guideList = Array.from(guides);
    guideList.forEach(e => {
        if (e.textContent[0] == '次') {
            ret = e.href;
        }
    });
    return ret;
}

function getNovelTitle() {
    const title = document.getElementsByClassName('contents1')[0].getElementsByTagName('a')[0];
    const ret = title.textContent;
    return ret;
}

document.addEventListener('scrollBottom', function () {
    if (isExistNext()) {
        if (blocked) return;
        blocked = true;
        var curGuide = getCurGuide();
        console.log(curGuide);
        const nextUrl = getNextUrl(curGuide);
        console.log(nextUrl);
        if (nextUrl === null) {
            const honbuns = document.getElementsByClassName('novel_honbun');
            var lastHonbun = honbuns[honbuns.length-1];
            lastHonbun.insertAdjacentElement('afterend', curGuide);
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', nextUrl, true);
        xhr.responseType = 'document';
        xhr.send();

        xhr.onload = function () {
            if (xhr.status !== 200) {
                console.log('access failed');
            }
            else {
                var nextContent = xhr.response;
                var nextHonbun = getHonbun(nextContent);
                var nextTitles = nextContent.getElementsByClassName('novel_subtitle');
                var nextTitle = nextTitles[nextTitles.length-1];

                var honbuns = document.getElementsByClassName('novel_honbun');
                var lastHonbun = honbuns[honbuns.length-1];
                console.log(lastHonbun);
                if (lastHonbun === undefined) {
                    blocked = false;
                    return;
                }

                var parent = document.getElementById('novel_color');
                var nextGuide = getNextGuide(nextContent);

                var titles = document.getElementsByClassName('novel_subtitle');
                const titleLists = Array.from(titles);

                var nextNovelNo = getNumber(nextContent);

                console.log(titleLists.length);
                console.log(titleLists[titleLists.length-1]);
                if (!titleLists[titleLists.length-1].isEqualNode(nextTitle)) {
                    console.log(nextTitle);
                    parent.insertBefore(nextTitle, lastHonbun.nextElementSibling);
                    titles = document.getElementsByClassName('novel_subtitle');
                    var lastTitle = titles[titles.length-1];
                    parent.insertBefore(nextHonbun, lastTitle.nextElementSibling);
                    parent.insertBefore(nextGuide, lastTitle);
                    parent.insertBefore(nextNovelNo, lastTitle.nextElementSibling);
                    
                    nextGuide.insertAdjacentHTML('beforebegin', '<p> <br><br> </p>');
                    nextHonbun.insertAdjacentHTML('beforebegin', '<p> <br><br> </p>');
                    nextTitle.insertAdjacentHTML('beforebegin', '<p> <br><br> </p>');

                    var entity = {};
                    const novelTitle = getNovelTitle(nextContent);
                    const number = nextNovelNo.textContent.split('/')[0];
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
            }
            blocked = false;
        }
    }
});

