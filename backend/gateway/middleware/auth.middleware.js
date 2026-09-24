import redis from "../../shared/redis/redis.js"

const protect = async (req, res, next) => {
    try{
        const sessionId = req.cookies?.session
        if(!sessionId){
            return res.status(401).json({message:'unauthorized'})
        }
        const session = await redis.get(`session-${sessionId}`)
        if(!session){
            return res.status(401).json({message:'unauthorized'})
        }
        req.user = JSON.parse(session)
        next()

    } catch(error){
        console.error("protect error", error)
        return res.status(500).json({message: "auth check failed"})
    }
  }

  export default protect

  