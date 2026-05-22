import "../../ui/log/LogEntry.js";

const TIME_FND = /(....)-(..)-(..)T(..:..:..\\....)Z/;
const TIME_REP = "$1-$2-$3 $4";

export function generateHTMLLog(data, target) {
    for (const entry of data) {
        const {
            type, time, message = [], children = [], collapsed
        } = entry;
        const logEntryEl = document.createElement("log-entry");
        logEntryEl.type = type.toLowerCase();
        logEntryEl.time = time.replace(TIME_FND, TIME_REP);
        logEntryEl.expanded = !collapsed;
        for (const msg of message) {
            logEntryEl.addMessageValue(msg);
        }
        generateHTMLLog(children, logEntryEl);
        target.append(logEntryEl);
    }
}
