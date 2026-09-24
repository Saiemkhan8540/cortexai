import axios from "axios"
import { internalHeaders } from "../../../shared/middleware/requireInternal.js"

// Throws a 402 error (surfaced to the client) when the balance is too low.
export const deductCredits = async (userId, agent) => {
    try {
        const { data } = await axios.post(
            `${process.env.AUTH_SERVICE}/deduct-credits`,
            { userId, agent },
            { headers: internalHeaders() }
        )
        return data
    } catch (error) {
        const status = error.response?.status
        const err = new Error(error.response?.data?.message || "Could not charge credits")
        err.status = status === 402 ? 402 : 503
        err.data = { success: false, ...(error.response?.data || {}), message: err.message }
        throw err
    }
}

export const refundCredits = async (userId, amount) => {
    try {
        const { data } = await axios.post(
            `${process.env.AUTH_SERVICE}/refund-credits`,
            { userId, amount },
            { headers: internalHeaders() }
        )
        return data
    } catch (error) {
        // Logged loudly: the user was charged for a failed request.
        console.error("❌ REFUND FAILED:", { userId, amount }, error.response?.data || error.message)
        return null
    }
}

// Wraps a graph node: charge before the LLM runs, refund if the agent
// throws or reports failure. Agents signal a handled failure with failed: true.
export const withCredits = (agent, node) => async (state) => {
    const charge = await deductCredits(state.userId, agent)

    let result
    try {
        result = await node({ ...state, failed: false })
    } catch (error) {
        await refundCredits(state.userId, charge.deducted)
        throw error
    }

    if (result?.failed) {
        const refund = await refundCredits(state.userId, charge.deducted)
        return { ...result, credits: refund?.credits ?? charge.credits }
    }

    return { ...result, credits: charge.credits }
}
