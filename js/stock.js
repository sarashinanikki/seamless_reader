function getReadLaterData(listContainer) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(function (items) {
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

            list = list.filter((el) => el.id[0]==='$');
            console.log(list);
            const param = [listContainer, list]
            resolve(param);
        });
    });
}

function showReadLaterList(param) {
    return new Promise((resolve, reject) => {
        var listContainer = param[0]; var readLaterList = param[1];
        console.log(readLaterList);
        readLaterList.forEach(el => {
            const novelTitle = el['title'];
            const url = el['url'];

            var readLater = document.createElement('div');
            readLater.classList.add('list-element');

            var removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.setAttribute('name', el['id']);
            removeButton.classList.add('delete-button');
            removeButton.innerHTML = 'x'


            var titleLink = document.createElement('a');
            titleLink.classList.add('novel-title');
            titleLink.href = url;
            titleLink.setAttribute('target', '_blank');
            titleLink.setAttribute('rel', 'noopener noreferrer')
            titleLink.innerHTML = novelTitle;

            var dateParagraph = document.createElement('p');
            const date = new Date(el['date']);
            const dateString = `登録日: ${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
            dateParagraph.innerHTML = dateString;

            readLater.insertAdjacentElement('beforeend', titleLink);
            readLater.insertAdjacentElement('beforeend', dateParagraph);
            readLater.insertAdjacentElement('beforeend', removeButton);
            listContainer.appendChild(readLater);
        });

        resolve('showReadLaterList => setEvent');
    });
}

function updateReadLaterList() {
    var listContainer = document.getElementById('list-container');
    listContainer.innerHTML = null;
    getReadLaterData(listContainer)
        .then(showReadLaterList)
        .then(setEvent)
        .then((response) => {
            console.log(response);
            console.log('end');
        });
}

function setEvent(passVal) {
    return new Promise((resolve, reject) => {
        var deleteBtns = document.querySelectorAll('.delete-button');
        deleteBtns.forEach(el => {
            const novelId = el.getAttribute('name');
            el.addEventListener('click', function () { removeReadLater(novelId); }, false);
        });
        console.log(passVal);
        resolve('delete-buttons.length = ' + deleteBtns.length);
    })
}

function removeReadLater(novelId) {
    console.log(novelId);
    chrome.storage.local.remove(novelId, function () {
        console.log('removed');
        load();
    });
}

window.onload = load;

function load() {
    updateReadLaterList();
}

chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
    if (req.message === 'readLater') {
        sendResponse('readLater updated!');
    }
    return true;
});