const isProd = process.env.NODE_ENV === "production";
const debugEnabled = process.env.DEBUG === "true" || (!isProd && process.env.DEBUG !== "false");

const formatMessage = (level, scope, requestId, ...args) => {
    const prefix = [
        new Date().toISOString(),
        level,
        scope ? `[${scope}]` : "",
        requestId ? `[${requestId}]` : "",
    ]
        .filter(Boolean)
        .join(" ");

    return [prefix, ...args];
};

export const logger = {
    info: (scope, requestId, ...args) => {
        console.log(...formatMessage("[INFO]", scope, requestId, ...args));
    },

    warn: (scope, requestId, ...args) => {
        console.warn(...formatMessage("[WARN]", scope, requestId, ...args));
    },

    error: (scope, requestId, ...args) => {
        console.error(...formatMessage("[ERROR]", scope, requestId, ...args));
    },

    debug: (scope, requestId, ...args) => {
        if (!debugEnabled) return;
        console.debug(...formatMessage("[DEBUG]", scope, requestId, ...args));
    },
};
