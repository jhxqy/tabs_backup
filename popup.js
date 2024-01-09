console.log('start', Date.now())

function UpdateStatus(val) {

    if (val == [] || val === undefined) {
        var status = document.getElementById("status")

        status.innerText = "not backup"
    } else {
        var status = document.getElementById("status")
        let e = val[val.length - 1]
        const date = new Date(parseInt(e));
        status.innerText = "Last saved at: " + date.toLocaleString()
    }
}
document.addEventListener('DOMContentLoaded', Load)

async function Load() {
    let saveList = await GetSaveList()
    UpdateStatus(saveList)
    var saveButton = document.getElementById("save")
    saveButton.addEventListener('click', SaveTabs)

    var recoverButton = document.getElementById("recover")
    recoverButton.addEventListener('click', RecoverLatest)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (key === "history") {
                UpdateStatus(newValue)
            }
        }
    });
}