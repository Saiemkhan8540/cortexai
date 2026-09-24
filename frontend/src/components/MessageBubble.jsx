import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, X, Check, Copy } from "lucide-react";
import { apiUrl } from "../../utils/axios";

import {
  Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";

import {
  oneDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";


function MessageBubble({
  role,
  content,
  images: rawImages = [],
}) {

  const images = rawImages.map(apiUrl);

  const isUser = role === "user";

  const [lightBox, setLightBox] = useState(null);
  const [copiedCode, setCopiedCode] = useState("");

  console.log("🖼️ MessageBubble images:", images);


  // =====================================================
  // COPY CODE
  // =====================================================

  const copyCode = async (code) => {

    try {

      await navigator.clipboard.writeText(code);

      setCopiedCode(code);

      setTimeout(() => {
        setCopiedCode("");
      }, 2000);

    } catch (error) {

      console.error(
        "❌ Copy failed:",
        error
      );

    }

  };


  // =====================================================
  // REMOVE IMAGE MARKDOWN FROM AI RESPONSE
  // =====================================================
  //
  // Backend already sends images separately through:
  //
  // images: [...]
  //
  // But AI response also contains:
  //
  // ![Generated Image](URL)
  //
  // If we don't remove it, Markdown renders the
  // same image one more time.
  //
  // =====================================================

  let cleanContent = content || "";


  // Remove Markdown images
  cleanContent = cleanContent.replace(
    /!\[[^\]]*\]\([^)]+\)/g,
    ""
  );


  // Remove Download Image markdown links
  cleanContent = cleanContent.replace(
    /\[Download Image\]\([^)]+\)/gi,
    ""
  );


  // Remove expiration text
  cleanContent = cleanContent.replace(
    /Link expires in \d+ minutes\.?/gi,
    ""
  );


  // Remove unnecessary extra blank lines
  cleanContent = cleanContent.replace(
    /\n{3,}/g,
    "\n\n"
  ).trim();


  return (
    <>

      {/* ================================================= */}
      {/* MESSAGE */}
      {/* ================================================= */}

      <div
        className={`flex ${
          isUser
            ? "justify-end"
            : "justify-start"
        }`}
      >

        <div
          className={`w-fit max-w-[92vw] md:max-w-[72%]
          px-4 py-2.5
          rounded-2xl
          break-words
          overflow-hidden
          leading-relaxed
          ${
            isUser
              ? "bg-gradient-to-br from-indigo-500 to-violet-700 text-white rounded-tr-sm"
              : "text-slate-200 rounded-tl-sm"
          }`}
        >


          {/* ================================================= */}
          {/* GENERATED IMAGES */}
          {/* ================================================= */}

          {images.length > 0 && (

            <div className="flex flex-col gap-4 mb-4">

              {images.map((img, i) => (

                <img
                  key={`${img}-${i}`}
                  src={img}
                  alt={`Generated result ${i + 1}`}
                  loading="lazy"

                  onClick={() => {

                    console.log(
                      "🖼️ IMAGE CLICKED:",
                      img
                    );

                    setLightBox(img);

                  }}

                  onError={(e) => {

                    console.error(
                      "❌ IMAGE LOAD ERROR:",
                      img
                    );

                    e.currentTarget.style.display =
                      "none";

                  }}

                  className="
                    max-w-full
                    w-auto
                    max-h-[600px]
                    rounded-xl
                    object-contain
                    border
                    border-white/10
                    cursor-zoom-in
                    hover:opacity-90
                    transition
                    duration-200
                  "
                />

              ))}

            </div>

          )}


          {/* ================================================= */}
          {/* MARKDOWN */}
          {/* ================================================= */}

          {cleanContent && (

            <Markdown
              remarkPlugins={[remarkGfm]}

              components={{

                /* ============================= */
                /* HEADINGS */
                /* ============================= */

                h1: ({ children }) => (

                  <h1 className="text-2xl font-bold mt-5 mb-3">
                    {children}
                  </h1>

                ),

                h2: ({ children }) => (

                  <h2 className="text-xl font-semibold mt-4 mb-2">
                    {children}
                  </h2>

                ),

                h3: ({ children }) => (

                  <h3 className="text-lg font-semibold mt-3 mb-2">
                    {children}
                  </h3>

                ),


                /* ============================= */
                /* PARAGRAPH */
                /* ============================= */

                p: ({ children }) => (

                  <p className="mb-3 whitespace-pre-wrap break-words">
                    {children}
                  </p>

                ),


                /* ============================= */
                /* LIST */
                /* ============================= */

                ul: ({ children }) => (

                  <ul className="list-disc pl-5 space-y-1 my-2">
                    {children}
                  </ul>

                ),

                ol: ({ children }) => (

                  <ol className="list-decimal pl-5 space-y-1 my-2">
                    {children}
                  </ol>

                ),


                /* ============================= */
                /* TABLE */
                /* ============================= */

                table: ({ children }) => (

                  <div className="overflow-x-auto my-4">

                    <table className="min-w-full border border-white/10">
                      {children}
                    </table>

                  </div>

                ),

                th: ({ children }) => (

                  <th className="border border-white/10 px-3 py-2 text-left">
                    {children}
                  </th>

                ),

                td: ({ children }) => (

                  <td className="border border-white/10 px-3 py-2">
                    {children}
                  </td>

                ),


                /* ============================= */
                /* LINKS */
                /* ============================= */

                a: ({ href, children }) => (

                  <a
                    href={apiUrl(href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-flex
                      items-center
                      gap-1
                      text-indigo-400
                      hover:text-indigo-300
                      underline
                    "
                  >

                    {children}

                    <ExternalLink size={14} />

                  </a>

                ),


                /* ============================= */
                /* CODE */
                /* ============================= */

                code: ({
                  className,
                  children,
                }) => {

                  const value =
                    String(children)
                      .replace(/\n$/, "");


                  const language =
                    className
                      ? className.replace(
                          "language-",
                          ""
                        )
                      : "";


                  /* ============================= */
                  /* INLINE CODE */
                  /* ============================= */

                  if (!className) {

                    return (

                      <code
                        className="
                          px-1.5
                          py-0.5
                          rounded
                          bg-white/10
                          text-pink-400
                        "
                      >
                        {value}
                      </code>

                    );

                  }


                  /* ============================= */
                  /* CODE BLOCK */
                  /* ============================= */

                  return (

                    <div
                      className="
                        my-4
                        overflow-hidden
                        rounded-xl
                        border
                        border-white/10
                        bg-[#111318]
                      "
                    >

                      {/* CODE HEADER */}

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          bg-[#1b1d24]
                          border-b
                          border-white/10
                          px-4
                          py-2
                        "
                      >

                        <span className="uppercase text-xs text-slate-400">
                          {language || "code"}
                        </span>


                        <button
                          type="button"

                          className="
                            flex
                            items-center
                            gap-1
                            text-xs
                            text-slate-300
                            hover:text-white
                          "

                          onClick={() =>
                            copyCode(value)
                          }
                        >

                          {copiedCode === value ? (

                            <>
                              <Check size={14} />
                              Copied
                            </>

                          ) : (

                            <>
                              <Copy size={14} />
                              Copy
                            </>

                          )}

                        </button>

                      </div>


                      {/* SYNTAX HIGHLIGHTER */}

                      <SyntaxHighlighter
                        language={
                          language || "text"
                        }

                        style={oneDark}

                        wrapLongLines

                        showLineNumbers

                        customStyle={{
                          margin: 0,
                          padding: "16px",
                          background: "#0d1117",
                          fontSize: "13px",
                        }}
                      >
                        {value}
                      </SyntaxHighlighter>

                    </div>

                  );

                },


                /* ================================================= */
                /* IMPORTANT: MARKDOWN IMAGE */
                /* ================================================= */
                //
                // Even if some image markdown somehow remains,
                // don't render it.
                //
                img: () => null,

              }}
            >
              {cleanContent}
            </Markdown>

          )}

        </div>

      </div>


      {/* ================================================= */}
      {/* LIGHTBOX */}
      {/* ================================================= */}

      {lightBox && (

        <div
          className="
            fixed
            inset-0
            z-[9999]
            bg-black/80
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-6
          "

          onClick={() =>
            setLightBox(null)
          }
        >

          {/* CLOSE BUTTON */}

          <button
            type="button"

            className="
              absolute
              top-5
              right-5
              text-white/80
              hover:text-white
              bg-white/10
              hover:bg-white/20
              rounded-full
              p-2
              cursor-pointer
              z-[10000]
            "

            onClick={(e) => {

              e.stopPropagation();

              setLightBox(null);

            }}
          >

            <X size={24} />

          </button>


          {/* BIG IMAGE */}

          <img
            src={lightBox}
            alt="Preview"

            className="
              max-w-[90vw]
              max-h-[85vh]
              rounded-2xl
              border
              border-white/10
              shadow-2xl
              object-contain
            "

            onClick={(e) =>
              e.stopPropagation()
            }
          />

        </div>

      )}

    </>
  );
}


export default MessageBubble;