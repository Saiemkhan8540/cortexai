import { useDispatch, useSelector } from "react-redux";
import { signInWithPopup } from "firebase/auth";
import React from "react";
import { auth, googleProvider } from "../../utils/firebase";
import api from "../../utils/axios";
import { FcGoogle } from "react-icons/fc";
import { setUserdata } from "../redux/userSlice";
import Sidebar from "../components/SideBar";
import ChatArea from "../components/ChatArea";

function Home() {
  const { userData } = useSelector((state) => state.user);

  const dispatch = useDispatch();

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/api/auth/login", {
        token,
      });

      dispatch(setUserdata(data));
    } catch (error) {
      console.log(error);
    }
  };

  const googleLogin = async () => {
    try {
      const data = await signInWithPopup(
        auth,
        googleProvider
      );

      const token = await data.user.getIdToken();

      console.log(token);

      await handleLogin(token);

      console.log(data);
    } catch (error) {
      console.log("Google Login Error:", error);
    }
  };

  return (
    <div className="h-screen min-w-0 flex bg-[#0d0f14] text-white overflow-hidden">

      {/* Sidebar */}
      <Sidebar />

      {/* Chat + Artifact */}
      <ChatArea />

      {/* Login Modal */}
      {!userData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">

          <div className="w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5">

            <div className="flex flex-col gap-1">

              <h2 className="text-[17px] font-semibold text-slate-100 tracking-tight">
                Welcome to CortexAI
              </h2>

              <p className="text-[13px] text-slate-500">
                Please login to continue using the app.
              </p>

            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 px-[11px] py-3 rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 transition-all duration-150 cursor-pointer"
              onClick={googleLogin}
            >
              <FcGoogle size={15} />
              Continue with Google
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default Home;