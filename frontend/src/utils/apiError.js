export const getApiErrorMessage = (err) => {
    return (
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Unknown error"
    );
};
