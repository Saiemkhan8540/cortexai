import React, { useEffect, useState } from "react";

import {
  Coins,
  LogOut,
  MessageSquare,
  PanelLeftIcon,
  PanelRight,
  PenSquare,
  Plus,
  User,
  X,
  Menu,
} from "lucide-react";

import { getConversations } from "../features/getConversation";

import { useDispatch, useSelector } from "react-redux";

import {
  addConversation,
  setConversations,
  setSelectedConversation,
} from "../redux/conversationSlice";

import { createConversation } from "../features/createConversation";
import logout from "../features/logOut";
import { setUserdata } from "../redux/userSlice";

import BillingDrawer from "./BillingDrawer";

function SideBar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [showBilling, setShowBilling] = useState(false);

  // MOBILE SIDEBAR
  const [mobileOpen, setMobileOpen] = useState(false);

  const dispatch = useDispatch();

  const {
    conversations,
    selectedConversation,
  } = useSelector(
    (state) => state.conversation
  );

  const { userData } = useSelector(
    (state) => state.user
  );

  // ============================================================
  // GET CONVERSATIONS
  // ============================================================

  useEffect(() => {
    // Logged out: nothing to load (the request would just 401).
    if (!userData?.userId) return;

    const getConv = async () => {
      try {
        const data = await getConversations();

        console.log(
          "🔥 Conversations from API:",
          data
        );

        dispatch(
          setConversations(
            Array.isArray(data) ? data : []
          )
        );

        if (
          data?.length > 0 &&
          !selectedConversation
        ) {
          dispatch(
            setSelectedConversation(data[0])
          );
        }

      } catch (error) {
        console.error(
          "❌ GET CONVERSATIONS ERROR:",
          error
        );
      }
    };

    getConv();

  }, [userData?.userId, dispatch]);

  // ============================================================
  // CREATE NEW CONVERSATION
  // ============================================================

  const handleCreateConversation = async () => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      const data = await createConversation();

      console.log(
        "🔥 Created Conversation:",
        data
      );

      if (data?._id) {

        dispatch(
          addConversation(data)
        );

        dispatch(
          setSelectedConversation(data)
        );

        setCollapsed(false);

        // Close mobile sidebar after creating chat
        setMobileOpen(false);
      }

    } catch (error) {

      console.error(
        "❌ CREATE CONVERSATION ERROR:",
        error
      );

    } finally {

      setIsCreating(false);

    }
  };

  // ============================================================
  // SELECT CONVERSATION
  // ============================================================

  const handleSelectConversation = (conv) => {

    console.log(
      "🔥 CLICKED CONVERSATION:",
      conv
    );

    dispatch(
      setSelectedConversation(conv)
    );

    // Close mobile sidebar
    setMobileOpen(false);

  };

  // ============================================================
  // MOBILE SIDEBAR CONTENT
  // ============================================================

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div
        className="
          flex
          items-center
          gap-2.5
          px-4
          py-4
          border-b
          border-white/[0.06]
          shrink-0
        "
      >

        {/* DESKTOP COLLAPSE */}

        {!mobile && (
          <button
            type="button"
            className="
              hidden
              lg:flex
              items-center
              justify-center
              w-7 h-7
              rounded-lg
              text-slate-500
              hover:text-slate-200
              hover:bg-white/[0.05]
              transition-colors
              bg-transparent
              border-none
              cursor-pointer
            "
            onClick={() =>
              setCollapsed(true)
            }
            title="Collapse sidebar"
          >
            <PanelLeftIcon size={18} />
          </button>
        )}

        {/* MOBILE CLOSE */}

        {mobile && (
          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
            className="
              flex
              items-center
              justify-center
              w-8 h-8
              rounded-lg
              text-slate-500
              hover:text-slate-200
              hover:bg-white/[0.05]
              transition-colors
              bg-transparent
              border-none
              cursor-pointer
            "
            title="Close"
          >
            <X size={18} />
          </button>
        )}

        {/* LOGO */}

        <span
          className="
            text-[16px]
            font-semibold
            text-slate-100
            tracking-tight
            flex-1
            truncate
          "
        >
          CortexAI
        </span>

        {/* PLAN */}

        <span
          className="
            text-[10px]
            font-medium
            text-indigo-400
            bg-indigo-500/10
            border
            border-indigo-500/20
            px-2
            py-0.5
            rounded-full
            tracking-wide
          "
        >
          free
        </span>

        {/* NEW CHAT */}

        <button
          type="button"
          className="
            flex
            items-center
            justify-center
            w-8 h-8
            rounded-lg
            text-slate-500
            hover:text-slate-200
            hover:bg-white/[0.05]
            transition-colors
            bg-transparent
            border-none
            cursor-pointer
          "
          onClick={handleCreateConversation}
          disabled={isCreating}
          title="New chat"
        >
          <PenSquare size={15} />
        </button>

      </div>

      {/* ======================================================
          NEW CHAT
      ======================================================= */}

      <div className="px-4 pt-4 pb-1">

        <button
          type="button"
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            text-sm
            font-medium
            text-white
            bg-linear-to-br
            from-indigo-500
            to-violet-700
            rounded-xl
            py-[10px]
            border-none
            cursor-pointer
            hover:opacity-90
            transition-opacity
          "
          onClick={handleCreateConversation}
          disabled={isCreating}
        >
          <Plus size={15} />

          New Chat
        </button>

      </div>

      {/* ======================================================
          RECENTS
      ======================================================= */}

      {conversations.length === 0 ? (

        <div
          className="
            px-5
            pt-4
            pb-1.5
            text-[10.5px]
            font-semibold
            uppercase
            tracking-widest
            text-slate-600
          "
        >
          No Recent Conversations
        </div>

      ) : (

        <div
          className="
            px-5
            pt-4
            pb-1.5
            text-[10.5px]
            font-semibold
            uppercase
            tracking-widest
            text-slate-600
          "
        >
          Recents
        </div>

      )}

      {/* ======================================================
          CONVERSATIONS
      ======================================================= */}

      <div
        className="
          flex-1
          min-h-0
          overflow-y-auto
          px-2.5
          pb-2
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >

        {conversations.map((conv) => {

          const isActive =
            selectedConversation?._id ===
            conv?._id;

          return (

            <div
              key={conv?._id}
              onClick={() =>
                handleSelectConversation(conv)
              }
              className={`
                flex
                items-center
                gap-2.5
                cursor-pointer
                mb-0.5
                px-3
                py-2.5
                rounded-[10px]
                border
                transition-colors
                duration-150

                ${
                  isActive
                    ? "bg-indigo-500/10 border-indigo-500/[0.18]"
                    : "bg-transparent border-transparent hover:bg-white/[0.05]"
                }
              `}
            >

              <div
                className={`
                  flex
                  items-center
                  justify-center
                  shrink-0
                  w-[28px]
                  h-[28px]
                  rounded-lg

                  ${
                    isActive
                      ? "bg-indigo-500/15 text-indigo-400"
                      : "bg-white/[0.05] text-slate-500"
                  }
                `}
              >
                <MessageSquare size={13} />
              </div>

              <span
                className={`
                  text-[13px]
                  font-medium
                  truncate

                  ${
                    isActive
                      ? "text-slate-100"
                      : "text-slate-300"
                  }
                `}
              >
                {conv?.title || "New Chat"}
              </span>

            </div>

          );

        })}

      </div>

      {/* ======================================================
          DIVIDER
      ======================================================= */}

      <div
        className="
          mx-2.5
          h-px
          bg-white/[0.06]
        "
      />

      {/* ======================================================
          USER SECTION
      ======================================================= */}

      <div className="px-3.5 py-3.5 shrink-0">

        {userData ? (

          <div
            className="
              flex
              items-center
              gap-2.5
              rounded-xl
              px-3
              py-2.5
              hover:bg-white/[0.05]
              transition-colors
            "
          >

            {/* AVATAR */}

            <div className="relative shrink-0">

              {userData?.avatar &&
              !imageError ? (

                <img
                  className="
                    w-9
                    h-9
                    rounded-[10px]
                    object-cover
                    border-2
                    border-indigo-500/25
                  "
                  src={userData.avatar}
                  alt="user"
                  onError={() =>
                    setImageError(true)
                  }
                />

              ) : (

                <div
                  className="
                    w-9
                    h-9
                    rounded-[10px]
                    bg-white/[0.06]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <User
                    size={15}
                    className="text-slate-400"
                  />
                </div>

              )}

            </div>

            {/* USER INFO */}

            <div className="flex-1 min-w-0">

              <p
                className="
                  text-[13.5px]
                  font-semibold
                  text-slate-100
                  truncate
                "
              >
                {userData?.name || "user"}
              </p>

              <p
                className="
                  text-[11px]
                  text-slate-600
                  mt-px
                "
              >
                Free Plan
              </p>

            </div>

            {/* BUTTONS */}

            <div className="flex gap-1">

              {/* BILLING */}

              <button
                type="button"
                onClick={() =>
                  setShowBilling(true)
                }
                className="
                  flex
                  items-center
                  justify-center
                  w-8 h-8
                  rounded-[7px]
                  border-none
                  bg-transparent
                  text-yellow-600
                  cursor-pointer
                  hover:bg-white/[0.08]
                  hover:text-yellow-400
                  transition-all
                "
                title="Billing"
              >
                <Coins size={16} />
              </button>

              {/* LOGOUT */}

              <button
                type="button"
                className="
                  flex
                  items-center
                  justify-center
                  w-8 h-8
                  rounded-[7px]
                  border-none
                  bg-transparent
                  text-slate-600
                  cursor-pointer
                  hover:bg-white/[0.08]
                  hover:text-slate-400
                  transition-all
                "
                onClick={async () => {

                  await logout();

                  dispatch(
                    setUserdata(null)
                  );

                  // Don't leak the previous user's chats to the next login.
                  dispatch(setConversations([]));
                  dispatch(setSelectedConversation(null));

                  setMobileOpen(false);

                }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>

            </div>

          </div>

        ) : (

          <button
            type="button"
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              text-sm
              font-medium
              text-slate-200
              bg-white/[0.05]
              border
              border-white/[0.08]
              rounded-xl
              py-[11px]
              cursor-pointer
              hover:bg-white/[0.08]
              transition-colors
            "
          >
            Login
          </button>

        )}

      </div>

      {/* ======================================================
          BILLING
      ======================================================= */}

      <BillingDrawer
        open={showBilling}
        onClose={() =>
          setShowBilling(false)
        }
      />

    </div>
  );

  // ============================================================
  // COLLAPSED DESKTOP SIDEBAR
  // ============================================================

  if (collapsed) {

    return (

      <div
        className="
          hidden
          lg:flex
          flex-col
          items-center
          w-[56px]
          h-screen
          bg-[#0d0f14]
          border-r
          border-white/[0.06]
          py-4
          gap-1
          shrink-0
        "
      >

        {/* EXPAND */}

        <button
          type="button"
          className="
            flex
            items-center
            justify-center
            w-9 h-9
            rounded-xl
            text-slate-500
            hover:text-slate-200
            hover:bg-white/[0.05]
            transition-colors
            bg-transparent
            border-none
            cursor-pointer
            mb-1
          "
          onClick={() =>
            setCollapsed(false)
          }
          title="Expand sidebar"
        >
          <PanelRight size={18} />
        </button>

        {/* NEW CHAT */}

        <button
          type="button"
          className="
            flex
            items-center
            justify-center
            w-9 h-9
            rounded-xl
            text-slate-500
            hover:text-slate-200
            hover:bg-white/[0.05]
            transition-colors
            bg-transparent
            border-none
            cursor-pointer
          "
          onClick={handleCreateConversation}
          disabled={isCreating}
          title="New chat"
        >
          <Plus size={17} />
        </button>

        {/* CONVERSATIONS */}

        <div
          className="
            flex-1
            w-full
            overflow-y-auto
            px-2.5
            pb-2
            pt-5
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >

          {conversations.map((conv) => {

            const isActive =
              selectedConversation?._id ===
              conv?._id;

            return (

              <div
                key={conv?._id}
                onClick={() =>
                  handleSelectConversation(conv)
                }
                className={`
                  flex
                  items-center
                  justify-center
                  cursor-pointer
                  mb-0.5
                  px-2
                  py-2.5
                  rounded-[10px]
                  border

                  ${
                    isActive
                      ? "bg-indigo-500/10 border-indigo-500/[0.18]"
                      : "bg-transparent border-transparent hover:bg-white/[0.05]"
                  }
                `}
              >

                <div
                  className={`
                    flex
                    items-center
                    justify-center
                    shrink-0
                    w-[28px]
                    h-[28px]
                    rounded-lg

                    ${
                      isActive
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "bg-white/[0.05] text-slate-500"
                    }
                  `}
                >
                  <MessageSquare size={13} />
                </div>

              </div>

            );

          })}

        </div>

        {/* USER */}

        <div className="relative shrink-0">

          {userData?.avatar &&
          !imageError ? (

            <img
              className="
                w-9 h-9
                rounded-[10px]
                object-cover
                border-2
                border-indigo-500/25
              "
              src={userData.avatar}
              alt="user"
              onError={() =>
                setImageError(true)
              }
            />

          ) : (

            <div
              className="
                w-9 h-9
                rounded-[10px]
                bg-white/[0.06]
                flex
                items-center
                justify-center
              "
            >
              <User
                size={15}
                className="text-slate-400"
              />
            </div>

          )}

        </div>

      </div>

    );
  }

  // ============================================================
  // DESKTOP SIDEBAR
  // ============================================================

  return (
    <>
      {/* ======================================================
          DESKTOP
      ======================================================= */}

      <div
        className="
          hidden
          lg:block
          w-[270px]
          h-screen
          shrink-0
          bg-[#0d0f14]
          border-r
          border-white/[0.06]
        "
      >
        <SidebarContent />
      </div>

      {/* ======================================================
          MOBILE MENU BUTTON
      ======================================================= */}

      <button
        type="button"
        onClick={() =>
          setMobileOpen(true)
        }
        className="
          lg:hidden
          fixed
          top-4
          left-4
          z-40
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-xl
          bg-[#0d0f14]
          border
          border-white/[0.08]
          text-slate-300
          hover:text-white
          hover:bg-white/[0.08]
          shadow-lg
          cursor-pointer
        "
        title="Open sidebar"
      >
        <Menu size={19} />
      </button>

      {/* ======================================================
          MOBILE OVERLAY
      ======================================================= */}

      {mobileOpen && (

        <div
          className="
            lg:hidden
            fixed
            inset-0
            z-40
            bg-black/60
            backdrop-blur-sm
          "
          onClick={() =>
            setMobileOpen(false)
          }
        />

      )}

      {/* ======================================================
          MOBILE DRAWER
      ======================================================= */}

      <div
        className={`
          lg:hidden
          fixed
          inset-y-0
          left-0
          z-50
          w-[86vw]
          max-w-[320px]
          bg-[#0d0f14]
          border-r
          border-white/[0.06]
          transition-transform
          duration-250
          ease-in-out

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <SidebarContent mobile />
      </div>

    </>
  );
}

export default SideBar;