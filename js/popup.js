function getNovelId(url) {
    const novelId = url.split('/')[3];
    return novelId;
}

function getBookmarkList(listContainer) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(function (items) {
            console.log(items);
            var bookmarkList = items;
            for (const key of Object.keys(bookmarkList)) {
                const novelTitle = bookmarkList[key]['title'];
                const url = bookmarkList[key]['url'];
                const number = bookmarkList[key]['number'];

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
            }
            resolve('getBookmarkList => setEvent');
        });
    });
}

function getCurrentNovelBookmark(curContainer, novelId, passVal) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(novelId, function (items){
            console.log(items);
            var curBookmark = items[novelId];
            
            if (curBookmark === undefined) {
                curContainer.innerHTML = 'この小説の記録はありません';
                return;
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
    })
}

function updateBookmarks(novelId) {
    var curContainer = document.getElementById('cur-container');
    var listContainer = document.getElementById('list-container');
    curContainer.innerHTML = null;
    listContainer.innerHTML = null;
    Promise.all([getBookmarkList(listContainer), getCurrentNovelBookmark(curContainer, novelId)])
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