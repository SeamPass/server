"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minutesToFutureTimestamp = void 0;
function minutesToFutureTimestamp(milliseconds) {
    const currentTime = new Date().getTime();
    const futureTime = currentTime + milliseconds;
    return Math.round(futureTime / 1000);
}
exports.minutesToFutureTimestamp = minutesToFutureTimestamp;
