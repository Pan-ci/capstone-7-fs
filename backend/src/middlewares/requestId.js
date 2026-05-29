export const requestIdMiddleware = (req, res, next) => {
    const requestId =
        req.headers["x-request-id"] ||
        Date.now().toString(36);

    req.requestId = requestId;

    res.setHeader("x-request-id", requestId);

    next();
};
