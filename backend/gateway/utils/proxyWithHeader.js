import proxy from "express-http-proxy"

export const proxyWithHeader = (serviceUrl) => {
    return proxy(serviceUrl, {
        // Body ko parse mat karo — multipart/form-data (file uploads)
        // ko as-is stream karke aage bhej do.
        parseReqBody: false,

        // Default 1mb hai; file uploads ke liye badhaya.
        limit: "25mb",

        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            const userId = srcReq.user?.userId || srcReq.user?._id

            if (userId) {
                proxyReqOpts.headers = proxyReqOpts.headers || {}
                proxyReqOpts.headers["x-user-id"] = userId
            }

            return proxyReqOpts
        }
    })
}