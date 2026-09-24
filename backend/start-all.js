// Runs the gateway and all four services in one container (e.g. a single
// Render web service). Each service stays its own Node process because every
// service reads process.env.PORT and uses mongoose's default connection with
// its own database, which can't be shared inside one process.
//
// Only the gateway listens publicly (on $PORT). The services bind to
// 127.0.0.1 on internal ports, and the gateway reaches them via the
// *_SERVICE URLs this script sets.

import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const root = path.dirname(fileURLToPath(import.meta.url))
const INTERNAL_HOST = "127.0.0.1"

const services = [
    { name: "auth", dir: "services/auth", port: Number(process.env.AUTH_PORT) || 8001, heapMb: 64 },
    { name: "chat", dir: "services/chat", port: Number(process.env.CHAT_PORT) || 8002, heapMb: 48 },
    { name: "agent", dir: "services/agent", port: Number(process.env.AGENT_PORT) || 8003, heapMb: 160 },
    { name: "billing", dir: "services/billing", port: Number(process.env.BILLING_PORT) || 8004, heapMb: 48 },
]
const gateway = { name: "gateway", dir: "gateway", heapMb: 48 }

// Keeps six Node processes inside a 512 MB instance: each child gets a V8
// heap cap (override with NODE_HEAP_MB_<NAME>) and a small young generation,
// so GC runs before a process balloons. Other NODE_OPTIONS flags pass through.
const nodeOptionsFor = ({ name, heapMb }) => {
    const heap = Number(process.env[`NODE_HEAP_MB_${name.toUpperCase()}`]) || heapMb
    const inherited = (process.env.NODE_OPTIONS || "")
        .split(/\s+/)
        .filter((flag) => flag && !/^--max-(old|semi)-space-size/.test(flag))
    return [...inherited, `--max-old-space-size=${heap}`, "--max-semi-space-size=4"].join(" ")
}

const serviceUrls = Object.fromEntries(
    services.map((s) => [`${s.name.toUpperCase()}_SERVICE`, `http://${INTERNAL_HOST}:${s.port}`])
)

// Each service keeps its own database. MONGODB_URI_<NAME> wins; otherwise the
// database name in MONGODB_URI is replaced with the service name.
const mongoUriFor = (name) => {
    const own = process.env[`MONGODB_URI_${name.toUpperCase()}`]
    if (own) return own
    if (!process.env.MONGODB_URI) return undefined

    const url = new URL(process.env.MONGODB_URI)
    url.pathname = `/${name}`
    return url.toString()
}

const children = new Map()
let shuttingDown = false

const prefixLines = (name, stream, out) => {
    let buffer = ""
    stream.on("data", (chunk) => {
        buffer += chunk
        const lines = buffer.split("\n")
        buffer = lines.pop()
        for (const line of lines) out.write(`[${name}] ${line}\n`)
    })
}

const start = (name, dir, env) => {
    // Unset values must stay unset (spawn would pass the string "undefined"),
    // so a local .env can still supply them.
    const overrides = Object.fromEntries(
        Object.entries({ ...serviceUrls, ...env }).filter(([, v]) => v !== undefined)
    )

    const child = spawn(process.execPath, ["index.js"], {
        cwd: path.join(root, dir),
        env: { ...process.env, ...overrides },
        stdio: ["ignore", "pipe", "pipe"],
    })

    prefixLines(name, child.stdout, process.stdout)
    prefixLines(name, child.stderr, process.stderr)

    // If any process dies, stop everything so the platform restarts the
    // container instead of serving a half-working API.
    child.on("exit", (code, signal) => {
        children.delete(name)
        if (shuttingDown) return
        console.error(`[start-all] ${name} exited (code ${code}, signal ${signal}); shutting down`)
        shutdown(1)
    })

    children.set(name, child)
}

const shutdown = (exitCode = 0) => {
    if (shuttingDown) return
    shuttingDown = true

    for (const child of children.values()) child.kill("SIGTERM")

    const deadline = setTimeout(() => {
        for (const child of children.values()) child.kill("SIGKILL")
        process.exit(exitCode)
    }, 10_000)

    const waitForChildren = setInterval(() => {
        if (children.size === 0) {
            clearInterval(waitForChildren)
            clearTimeout(deadline)
            process.exit(exitCode)
        }
    }, 100)
}

process.on("SIGTERM", () => shutdown(0))
process.on("SIGINT", () => shutdown(0))

for (const s of services) {
    start(s.name, s.dir, {
        PORT: String(s.port),
        HOST: INTERNAL_HOST,
        MONGODB_URI: mongoUriFor(s.name),
        NODE_OPTIONS: nodeOptionsFor(s),
    })
}

start(gateway.name, gateway.dir, {
    PORT: process.env.PORT || "8000",
    NODE_OPTIONS: nodeOptionsFor(gateway),
})

console.log(
    `[start-all] gateway on :${process.env.PORT || 8000}; services on ${INTERNAL_HOST}:` +
    services.map((s) => `${s.name}=${s.port}`).join(", ")
)
