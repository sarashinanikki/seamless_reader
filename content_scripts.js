function isExistNext() {
    var ret = true;
    var guide = document.getElementsByClassName('novel_bn')[0];
    var next = guide.getElementsByTagName('a');
    if (next.length !== 2) ret = false;
    return ret;
}

var scrollBottomEvent = new Event('scrollBottom');
window.document.addEventListener('scroll', function () {
    var body = window.document.body;
    var html = window.document.documentElement;

    var scrollTop = body.scrollTop || html.scrollTop;
    var scrollBottom = html.scrollHeight - html.clientHeight - scrollTop;

    if (scrollBottom <= 0) {
        window.document.dispatchEvent(scrollBottomEvent);
    }
});

document.addEventListener('scrollBottom', function () {
    if (isExistNext()) {
        var guide = document.getElementsByClassName('novel_bn')[0];
        var next = guide.getElementsByTagName('a')[1];
        const nextUrl = next.href;
        alert('hoge')
    }
});
