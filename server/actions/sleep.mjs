// Source: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
export function sleep(time_ms) {
    return new Promise((resolve) => setTimeout(resolve, time_ms));
}
