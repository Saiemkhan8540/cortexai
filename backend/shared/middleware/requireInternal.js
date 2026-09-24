import crypto from "crypto"

// Service-to-service routes (update-plan, deduct-credits, save-message)
// must never be callable from the browser. Callers send x-internal-key.
export const internalHeaders = () => ({
    "x-internal-key": process.env.INTERNAL_API_KEY,
})

const requireInternal = (req, res, next) => {
    const expected = process.env.INTERNAL_API_KEY
    const given = req.headers["x-internal-key"]

    if (!expected) {
        console.error("INTERNAL_API_KEY is not set")
        return res.status(500).json({ message: "server misconfigured" })
    }

    const a = Buffer.from(String(given || ""))
    const b = Buffer.from(expected)

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(403).json({ message: "forbidden" })
    }

    next()
}

export default requireInternal
