import api from "../../utils/axios";

async function logout() {
  try {
    await api.post("/api/auth/logout")
  } catch (error) {
    console.log(error)
  }
}

export default logout
