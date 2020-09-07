var blocked = false;

window.onload = function () {
    var elem = document.getElementById('novel_honbun');
    if (elem) {
        elem.removeAttribute('id');
        elem.classList.add('novel_honbun');
    }
};

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

    if (scrollBottom <= 3000) {
        window.document.dispatchEvent(scrollBottomEvent);
    }
});

function getGuide(nextContent) {
    var guide = nextContent.getElementsByClassName('novel_bn');
    var ret = guide[guide.length-2];
    return ret;
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

document.addEventListener('scrollBottom', function () {
    if (isExistNext()) {
        if (blocked) return;
        blocked = true;
        var curGuide = getGuide(document);
        const nextUrl = getNextUrl(curGuide);
        console.log(nextUrl);
        if (nextUrl === null) return;
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
                var nextHonbun = nextContent.getElementById('novel_honbun');
                nextHonbun.removeAttribute('id');
                nextHonbun.classList.add('novel_honbun');
                var nextTitles = nextContent.getElementsByClassName('novel_subtitle');
                var nextTitle = nextTitles[nextTitles.length-1];

                var honbuns = document.getElementsByClassName('novel_honbun');
                var parent = document.getElementById('novel_color');
                var lastHonbun = honbuns[honbuns.length-1];

                var nextGuide = getGuide(nextContent);

                var titles = document.getElementsByClassName('novel_subtitle');
                const titleLists = Array.from(titles);
                console.log(titleLists.length);
                console.log(titleLists[titleLists.length-1]);
                if (!titleLists[titleLists.length-1].isEqualNode(nextTitle)) {
                    console.log(nextTitle);
                    parent.insertBefore(nextTitle, lastHonbun.nextElementSibling);
                    titles = document.getElementsByClassName('novel_subtitle');
                    var lastTitle = titles[titles.length-1];
                    parent.insertBefore(nextHonbun, lastTitle.nextElementSibling);
                    parent.insertBefore(nextGuide, lastTitle);
                    nextGuide.insertAdjacentHTML('beforebegin', '<p> <br><br> </p>');
                    nextHonbun.insertAdjacentHTML('beforebegin', '<p> <br><br> </p>');
                    nextTitle.insertAdjacentHTML('beforebegin', '<p> <br><br> </p>');
                }
            }
            blocked = false;
        }
    }
});
