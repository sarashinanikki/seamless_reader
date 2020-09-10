function getNovelId(url) {
    const novelId = url.split('/')[3];
    return novelId;
}

function getBookmarkData(listContainer, curContainer, novelId) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(function(items) {
            console.log(items);
            var list = [];
            for (const [key, value] of Object.entries(items)) {
                var ob = {
                    "id": key,
                    "title": value['title'],
                    "number": value['number'],
                    "url": value['url'],
                    "date": value['date']
                }
                list.push(ob);
            }

            list.sort(function (a, b) {
                if (+a.date > +b.date) {
                    return -1;
                }
                else {
                    return 1;
                }
            });

            console.log(list);
            const param = [listContainer, curContainer, novelId, list]
            resolve(param);
        });
    });
}

// param = [listContainer, curContainer, novelId, list]
function showBookmarkList(param) {
    return new Promise((resolve, reject) => {
        listContainer = param[0]; curContainer = param[1]; novelId = param[2]; bookmarkList = param[3];
        console.log(bookmarkList);
        bookmarkList.forEach(el => {
            const novelTitle = el['title'];
            const url = el['url'];
            const number = el['number'];

            var bookmark = document.createElement('div');
            bookmark.classList.add('list-element');
            var titleParagraph = document.createElement('p');
            titleParagraph.classList.add('novel-title');

            var removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.setAttribute('name', getNovelId(url));
            removeButton.classList.add('delete-button');
            removeButton.innerHTML = 'x'


            var link = document.createElement('a');
            link.href = url;
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer')
            link.innerHTML = '第' + number + '部分';

            titleParagraph.innerHTML = novelTitle;
            bookmark.insertAdjacentElement('beforeend', titleParagraph);
            bookmark.insertAdjacentElement('beforeend', link);
            bookmark.insertAdjacentElement('beforeend', removeButton);
            listContainer.appendChild(bookmark);
        });

        const nextParam = [curContainer, novelId, bookmarkList];
        resolve(nextParam);
    });
}

function showCurrentNovelBookmark(param) {
    return new Promise((resolve, reject) => {
        curContainer = param[0]; novelId = param[1]; bookmarkList = param[2];
        console.log(bookmarkList);
        const curBookmark = bookmarkList.find(bm => bm.id === novelId);
        
        if (curBookmark === undefined) {
            curContainer.innerHTML = 'この小説の記録はありません';
            resolve('getCurrentBookmark => setEvent');
        }

        var bookmark = document.createElement('div');
        bookmark.classList.add('cur-element');
        
        var titleParagraph = document.createElement('p');
        titleParagraph.classList.add('novel-title');

        var removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.setAttribute('name', novelId);
        removeButton.classList.add('delete-button');
        removeButton.innerHTML = 'x'

        const novelTitle = curBookmark['title'];
        const url = curBookmark['url'];
        const number = curBookmark['number'];

        titleParagraph.innerHTML = novelTitle;

        var link = document.createElement('a');
        link.href = url;
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer')
        link.innerHTML = '第' + number + '部分';

        bookmark.insertAdjacentElement('beforeend', titleParagraph);
        bookmark.insertAdjacentElement('beforeend', link);
        bookmark.insertAdjacentElement('beforeend', removeButton);
        curContainer.appendChild(bookmark);
        resolve('getCurrentBookmark => setEvent');
    });
}

function updateBookmarks(novelId) {
    var curContainer = document.getElementById('cur-container');
    var listContainer = document.getElementById('list-container');
    curContainer.innerHTML = null;
    listContainer.innerHTML = null;
    getBookmarkData(listContainer, curContainer, novelId)
    .then(showBookmarkList)
    .then(showCurrentNovelBookmark)
    .then(setEvent)
    .then((response) => {
        console.log(response);
        console.log('end');
    });
}

function removeBookmark(novelId) {
    console.log(novelId);
    chrome.storage.local.remove(novelId, function () {
        console.log('removed');
        load();
    });
}

function setEvent(passVal) {
    return new Promise((resolve, reject) => {
        var deleteBtns = document.querySelectorAll('.delete-button');
        deleteBtns.forEach(el => {
            const novelId = el.getAttribute('name');
            el.addEventListener('click', function(){removeBookmark(novelId);}, false);
        });
        console.log(passVal);
        resolve('delete-buttons.length = ' + deleteBtns.length);
    })
}

window.onload = load;

function load() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { message: "novelId" }, function (response) {
            console.log("response: novelId = " + response);
            var novelId = response;
            updateBookmarks(novelId);
        });
    });
}

chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
    if (req.message === 'update') {
        updateBookmarks(req.novelId);
        sendResponse('updated!');
    }
    return true;
});