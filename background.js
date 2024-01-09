importScripts("common.js")

chrome.alarms.create("10min_update", {
    periodInMinutes: 10
})

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "10min_update") {
        SaveTabs()
        console.info("auto save")
    }
})