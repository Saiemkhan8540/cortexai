import React, { useEffect } from "react";
import Nav from "./Nav";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import Artifact from "./Artifact";

import { useDispatch, useSelector } from "react-redux";

import getMessages from "../features/getMessages";
import {
  setMessages,
  setArtifacts,
} from "../redux/messageSlice";

function ChatArea() {
  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const dispatch = useDispatch();

  const { artifacts } = useSelector(
    (state) => state.message
  );

  console.log(
    "ChatArea selectedConversation:",
    selectedConversation
  );

  console.log(
    "ChatArea artifacts:",
    artifacts
  );

  useEffect(() => {
    console.log("🔥 ChatArea useEffect RUNNING");

    const getMesg = async () => {
      console.log("🔥 getMesg FUNCTION RUNNING");

      if (!selectedConversation) {
        console.log(
          "⚠️ selectedConversation is NULL/UNDEFINED"
        );

        dispatch(setMessages([]));
        dispatch(setArtifacts([]));

        return;
      }

      if (selectedConversation.title === "New Chat") {
        console.log("🆕 New Chat selected");

        dispatch(setMessages([]));
        dispatch(setArtifacts([]));

        return;
      }

      try {
        console.log(
          "🔥 Conversation ID:",
          selectedConversation._id
        );

        const data = await getMessages(
          selectedConversation._id
        );

        console.log("🔥 API RESPONSE:", data);

        const messages = Array.isArray(data)
          ? data
          : [];

        // -----------------------------------------
        // SET MESSAGES
        // -----------------------------------------

        dispatch(setMessages(messages));

        // -----------------------------------------
        // FIND LATEST ARTIFACT
        // -----------------------------------------

        const latestArtifactMessage = [
          ...messages,
        ]
          .reverse()
          .find(
            (msg) =>
              msg.artifacts &&
              msg.artifacts.length > 0
          );

        const latestArtifacts =
          latestArtifactMessage?.artifacts || [];

        console.log(
          "🎨 LATEST ARTIFACTS:",
          latestArtifacts
        );

        dispatch(
          setArtifacts(latestArtifacts)
        );

        console.log(
          "✅ Messages + Artifacts dispatched"
        );
      } catch (error) {
        console.error(
          "❌ Error fetching messages:",
          error
        );

        dispatch(setMessages([]));
        dispatch(setArtifacts([]));
      }
    };

    getMesg();
  }, [selectedConversation?._id, dispatch]);

return (
  <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

    {/* TOP NAV */}
    <Nav />

    {/* CHAT + ARTIFACT AREA */}
    <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden">

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

        {/* MESSAGES */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MessageList />
        </div>

        {/* CHAT INPUT */}
        <ChatInput />

      </div>

      {/* RIGHT ARTIFACT PANEL */}
      <Artifact />

    </div>

  </div>
);
}

export default ChatArea;










// import React, { useEffect } from 'react'
// import Nav from './Nav';
// import MessageList from './MessageList';
// import ChatInput from './ChatInput';
// import { useDispatch, useSelector } from 'react-redux';
// import getMessages from '../features/getMessages';
// import { setMessages } from '../redux/messageSlice';

// function ChatArea() {
//   const {selectedConversation} = useSelector(state=>state.conversation)
//   const dispatch=useDispatch()
//   useEffect(()=>{
//     const getMesg=async (params) => {
//       if(selectedConversation){
//         const data = await getMessages(selectedConversation?._id)
//         dispatch(setMessages(data))
//       }
//     };

//     getMesg();
//   },[selectedConversation, dispatch])
//   return (
//     <div className='flex-1 flex flex-col'>
//       <Nav/>
//       <MessageList/>
//       <ChatInput/>
//     </div>
//   )
// }

// export default ChatArea;

