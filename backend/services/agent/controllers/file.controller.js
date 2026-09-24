import { getFromS3 } from "../utils/getFromS3.js";
import { userFileKey } from "../utils/userFile.js";

// GET /file/:userId/:name — redirects the owner to a short-lived signed URL.
export const serveFile = async (req, res) => {
  try {
    const { userId, name } = req.params;

    if (userId !== req.headers["x-user-id"] || !/^[\w.-]+$/.test(name)) {
      return res.status(404).json({ message: "file not found" });
    }

    const url = await getFromS3(userFileKey(userId, name), 5 * 60);

    return res.redirect(302, url);
  } catch (error) {
    console.error("❌ FILE ERROR:", error);
    return res.status(500).json({ message: "could not load file" });
  }
};
