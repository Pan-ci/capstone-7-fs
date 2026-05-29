export const createErrorResponse = ({
    code = "INTERNAL_ERROR",
    message = "Something went wrong",
    details = null,
}) => {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
    };
};
