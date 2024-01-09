
function TagsQuery() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({}, (tabs) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
            } else {
                resolve(tabs)
            }
        })
    })
}

function TagGroupGet(group_id) {
    return new Promise((resolve, reject) => {
        chrome.tabGroups.get(group_id, (g) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
            } else {
                resolve(g)
            }
        })
    })
}

async function GetAllTabs() {
    let tabs = await TagsQuery()
    var groups = []
    let group_set = new Set();

    // 已经有了tabs信息，再获取groups信息
    for (let i = 0; i < tabs.length; i++) {
        let group_id = tabs[i].groupId;
        if (group_id > 0) {
            let g = await TagGroupGet(group_id)
            if (group_set.has(g.id)) {
                continue;
            }
            group_set.add(g.id)
            groups.push(g)
        }
    }
    return {
        tabs: tabs,
        groups: groups,

    }

}

async function SaveTabs() {
    let o = await GetAllTabs()
    console.log(o.tabs.length)
    console.log(o.groups)
    var q = {}
    var t = String(Date.now())
    q[t] = o
    chrome.storage.local.set(q, () => {
        if (chrome.runtime.lastError) {
            console.log("save fail" + chrome.runtime.lastError)
        }
        console.log("save succ")
    })
    chrome.storage.local.get(["tag_store"], (result) => {
        console.log(result.tag_store)
    })
    await AddSaveList(t)
    let history = await GetSaveList()
    console.log(history)
}

async function GetSaveList() {

    return await new Promise((res, rej) => {
        chrome.storage.local.get(["history"], (result) => {

            if (result.history === undefined) {
                l = []
                chrome.storage.local.set({ history: l })
                res(l)
            }
            res(result.history)
        })
    })
}
async function AddSaveList(key) {
    let history = await new Promise((res, rej) => {
        chrome.storage.local.get(["history"], (result) => {

            if (result.history === undefined) {
                l = []

                res(l)
            }
            res(result.history)
        })
    })
    newHistory = []
    if (history.length > 9) {
        for (let i = 0; i < history.length - 9; i++) {
            chrome.storage.local.remove(String(history[i]));
        }
        for (let i = history.length - 9; i < history.length; i++) {
            newHistory.push(history[i])
        }
        history = newHistory
    }
    history.push(key)
    chrome.storage.local.set({ history: history })
    return
}
async function RecoverLatest() {
    let history = await GetSaveList()
    if (history.length < 1) {
        return
    }
    console.info(history[history.length - 1])
    await RecoverTabs(history[history.length - 1])
}
async function RecoverTabs(key) {
    let { tabs, groups } = await new Promise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
            console.log(result[key])
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
            } else {
                resolve(result[key])
            }
        })
    })

    var window = await new Promise((resolve, reject) => {
        chrome.windows.create({}, (window) => {
            resolve(window)
        })
    })
    var group_m = new Map();
    for (let i = 0; i < tabs.length; i++) {
        var tab = await new Promise((resolve, reject) => {
            chrome.tabs.create({
                windowId: window.id,
                url: tabs[i].url
            }, (tab) => {
                resolve(tab)
            })
        })
        if (tabs[i].groupId <= 0) {
            continue
        }
        var l = group_m.get(tabs[i].groupId)
        if (l === undefined) {
            l = []
        }
        l.push(tab.id)
        group_m.set(tabs[i].groupId, l)
    }

    for (let i = 0; i < groups.length; i++) {
        chrome.tabs.group({
            createProperties: {
                windowId: window.id,
            },
            tabIds: group_m.get(groups[i].id)
        }, (id) => {
            // update一下name和颜色
            groups
            chrome.tabGroups.update(
                id,
                {
                    collapsed: groups[i].collapsed,
                    color: groups[i].color,
                    title: groups[i].title,
                }
            )
        })
    }


}