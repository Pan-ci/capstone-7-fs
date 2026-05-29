const isProd = process.env.NODE_ENV === "production";

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
};
