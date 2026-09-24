import React, { useEffect, useMemo, useState } from "react";

import {
  Code2,
  Copy,
  Eye,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";

import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "motion/react";

function Artifact() {
  // ============================================================
  // REDUX
  // ============================================================

  const { artifacts = [] } = useSelector(
    (state) => state.message
  );

  // ============================================================
  // STATE
  // ============================================================

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [tab, setTab] = useState("code");
  const [activeFile, setActiveFile] = useState(0);

  // ============================================================
  // GET CURRENT ARTIFACT
  // ============================================================

  const artifact = artifacts?.[0];

  const files = artifact?.files || [];

  // ============================================================
  // FIND FILES
  // ============================================================

  const htmlFile = useMemo(
    () =>
      files.find(
        (file) =>
          file?.name?.toLowerCase() === "index.html"
      ),
    [files]
  );

  const cssFile = useMemo(
    () =>
      files.find(
        (file) =>
          file?.name?.toLowerCase() === "style.css"
      ),
    [files]
  );

  const jsFile = useMemo(
    () =>
      files.find(
        (file) =>
          file?.name?.toLowerCase() === "script.js"
      ),
    [files]
  );

  // ============================================================
  // RESET WHEN NEW ARTIFACT ARRIVES
  // ============================================================

  useEffect(() => {
    setActiveFile(0);
    setTab("code");
  }, [artifact?.id]);

  // ============================================================
  // CURRENT FILE
  // ============================================================

  const currentFile =
    files?.[activeFile] || files?.[0];

  // ============================================================
  // PREVIEW DOCUMENT
  // ============================================================

  const previewDoc = useMemo(() => {
    if (!htmlFile) {
      return "";
    }

    const html = htmlFile?.content || "";
    const css = cssFile?.content || "";
    const javascript = jsFile?.content || "";

    // ----------------------------------------------------------
    // FULL HTML DOCUMENT
    // ----------------------------------------------------------

    if (
      html.toLowerCase().includes("<!doctype") ||
      html.toLowerCase().includes("<html")
    ) {
      return html
        .replace(
          /<\/head>/i,
          `<style>${css}</style></head>`
        )
        .replace(
          /<\/body>/i,
          `<script>${javascript}</script></body>`
        );
    }

    // ----------------------------------------------------------
    // BODY HTML
    // ----------------------------------------------------------

    return `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<style>

${css}

</style>

</head>

<body>

${html}

<script>

${javascript}

</script>

</body>

</html>
`;
  }, [htmlFile, cssFile, jsFile]);

  // ============================================================
  // COPY CODE
  // ============================================================

  const handleCopy = async () => {
    if (!currentFile?.content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        currentFile.content
      );

      console.log(
        "✅ Code copied successfully"
      );
    } catch (error) {
      console.error(
        "❌ Copy failed:",
        error
      );
    }
  };

  // ============================================================
  // CLOSE MOBILE
  // ============================================================

  const closeMobile = () => {
    setMobileOpen(false);
  };

  // ============================================================
  // NO ARTIFACT
  // ============================================================

  if (!artifacts?.length || !files?.length) {
    return null;
  }

  // ============================================================
  // ARTIFACT CONTENT
  // ============================================================

  const ArtifactContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full min-h-0">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div
        className="
          h-14
          min-h-14
          px-3
          border-b
          border-white/[0.06]
          flex
          items-center
          gap-2
          shrink-0
        "
      >

        {/* Desktop collapse */}

        {!mobile && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="
              hidden lg:flex
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
              shrink-0
            "
            title="Collapse"
          >
            <PanelRightClose size={16} />
          </button>
        )}

        {/* Mobile close */}

        {mobile && (
          <button
            type="button"
            onClick={closeMobile}
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
              shrink-0
            "
            title="Close"
          >
            <X size={17} />
          </button>
        )}

        {/* Icon */}

        <div
          className="
            flex
            items-center
            justify-center
            w-7 h-7
            rounded-md
            bg-indigo-500/10
            border
            border-indigo-500/20
            shrink-0
          "
        >
          <Code2
            size={14}
            className="text-indigo-400"
          />
        </div>

        {/* Title */}

        <div
          className="
            text-[13px]
            font-medium
            text-slate-200
            truncate
            flex-1
            min-w-0
          "
        >
          {artifact?.title || "Generated Project"}
        </div>

        {/* Copy */}

        <button
          type="button"
          onClick={handleCopy}
          title="Copy code"
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
            shrink-0
          "
        >
          <Copy size={15} />
        </button>

        {/* CODE / PREVIEW */}

        <div
          className="
            flex
            items-center
            gap-1
            bg-white/[0.04]
            border
            border-white/[0.06]
            p-1
            rounded-lg
            shrink-0
          "
        >

          {/* CODE */}

          <button
            type="button"
            onClick={() => setTab("code")}
            className={`
              flex
              items-center
              gap-1.5
              px-2
              sm:px-2.5
              py-1.5
              text-[10px]
              sm:text-[11px]
              font-medium
              rounded-md
              transition-colors
              border-none
              cursor-pointer

              ${
                tab === "code"
                  ? "bg-indigo-500 text-white"
                  : "bg-transparent text-slate-500 hover:text-slate-200"
              }
            `}
          >
            <Code2 size={12} />

            <span>Code</span>
          </button>

          {/* PREVIEW */}

          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`
              flex
              items-center
              gap-1.5
              px-2
              sm:px-2.5
              py-1.5
              text-[10px]
              sm:text-[11px]
              font-medium
              rounded-md
              transition-colors
              border-none
              cursor-pointer

              ${
                tab === "preview"
                  ? "bg-indigo-500 text-white"
                  : "bg-transparent text-slate-500 hover:text-slate-200"
              }
            `}
          >
            <Eye size={12} />

            <span>Preview</span>
          </button>

        </div>

      </div>

      {/* ======================================================
          FILE TABS
      ======================================================= */}

      {tab === "code" && (
        <div
          className="
            flex
            h-10
            min-h-10
            border-b
            border-white/[0.06]
            overflow-x-auto
            shrink-0
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >

          {files.map((file, index) => (
            <button
              key={`${file?.name}-${index}`}
              type="button"
              onClick={() => setActiveFile(index)}
              className={`
                relative
                px-3
                sm:px-4
                py-2.5
                text-[10px]
                sm:text-[11px]
                font-medium
                whitespace-nowrap
                transition-colors
                duration-150
                border-none
                border-r
                border-white/[0.04]
                bg-transparent
                cursor-pointer

                ${
                  activeFile === index
                    ? "text-indigo-400"
                    : "text-slate-500 hover:text-slate-300"
                }
              `}
            >

              {file?.name}

              {activeFile === index && (
                <div
                  className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-[2px]
                    bg-indigo-500
                    rounded-t-full
                  "
                />
              )}

            </button>
          ))}

        </div>
      )}

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <div className="flex-1 min-h-0 overflow-hidden">

        {/* ====================================================
            CODE
        ===================================================== */}

        {tab === "code" && (
          <div
            className="
              h-full
              overflow-auto
              bg-[#080a0f]
              [scrollbar-width:thin]
            "
          >

            {currentFile ? (

              <div
                className="
                  min-w-max
                  py-3
                  font-mono
                  text-[11px]
                  sm:text-[12px]
                  leading-6
                "
              >

                {String(
                  currentFile?.content || ""
                )
                  .split("\n")
                  .map((line, index) => (

                    <div
                      key={index}
                      className="
                        flex
                        min-h-[24px]
                        hover:bg-white/[0.025]
                      "
                    >

                      {/* LINE NUMBER */}

                      <span
                        className="
                          w-10
                          sm:w-12
                          shrink-0
                          px-2
                          sm:px-3
                          text-right
                          select-none
                          text-slate-700
                        "
                      >
                        {index + 1}
                      </span>

                      {/* CODE */}

                      <code
                        className="
                          px-2
                          sm:px-3
                          whitespace-pre
                          text-slate-300
                        "
                      >
                        {line || " "}
                      </code>

                    </div>

                  ))}

              </div>

            ) : (

              <div
                className="
                  h-full
                  flex
                  items-center
                  justify-center
                  text-slate-600
                  text-sm
                "
              >
                No file selected
              </div>

            )}

          </div>
        )}

        {/* ====================================================
            PREVIEW
        ===================================================== */}

        {tab === "preview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="h-full bg-white"
          >

            {htmlFile ? (

              <iframe
                title="Generated project preview"
                srcDoc={previewDoc}
                className="
                  w-full
                  h-full
                  border-0
                  bg-white
                "
                sandbox="allow-scripts"
              />

            ) : (

              <div
                className="
                  h-full
                  flex
                  items-center
                  justify-center
                  bg-[#080a0f]
                  text-slate-500
                  text-sm
                "
              >
                index.html not found
              </div>

            )}

          </motion.div>
        )}

      </div>

    </div>
  );

  // ============================================================
  // COLLAPSED DESKTOP PANEL
  // ============================================================

  if (collapsed) {
    return (
      <>
        <motion.div
          initial={{ width: 48 }}
          animate={{ width: 48 }}
          transition={{
            duration: 0.25,
            ease: "easeInOut",
          }}
          className="
            hidden
            lg:flex
            h-full
            shrink-0
            border-l
            border-white/[0.06]
            bg-[#0d0f14]
            items-start
            justify-center
            pt-4
          "
        >

          <button
            type="button"
            onClick={() => setCollapsed(false)}
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
          >
            <PanelRightOpen size={16} />
          </button>

        </motion.div>

        {/* MOBILE ARTIFACT BUTTON */}

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="
            lg:hidden
            fixed
            bottom-24
            right-4
            z-40
            flex
            items-center
            justify-center
            w-11
            h-11
            rounded-xl
            bg-indigo-600
            hover:bg-indigo-500
            text-white
            shadow-lg
            border-none
            cursor-pointer
          "
        >
          <Code2 size={18} />
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMobile}
                className="
                  lg:hidden
                  fixed
                  inset-0
                  z-40
                  bg-black/60
                  backdrop-blur-sm
                "
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  duration: 0.25,
                  ease: "easeInOut",
                }}
                className="
                  lg:hidden
                  fixed
                  inset-y-0
                  right-0
                  z-50
                  w-[92vw]
                  max-w-[420px]
                  bg-[#0d0f14]
                  border-l
                  border-white/[0.06]
                  overflow-hidden
                "
              >
                <ArtifactContent mobile />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ============================================================
  // DESKTOP + MOBILE
  // ============================================================

  return (
    <>
      {/* ======================================================
          DESKTOP ARTIFACT
      ======================================================= */}

      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{
          width: 450,
          opacity: 1,
        }}
        transition={{
          duration: 0.25,
          ease: "easeInOut",
        }}
        className="
          hidden
          lg:flex
          h-full
          border-l
          border-white/[0.06]
          bg-[#0d0f14]
          flex-col
          overflow-hidden
          shrink-0
        "
      >
        <ArtifactContent />
      </motion.div>

      {/* ======================================================
          MOBILE ARTIFACT BUTTON
      ======================================================= */}

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="
          lg:hidden
          fixed
          bottom-24
          right-4
          z-40
          flex
          items-center
          justify-center
          w-11
          h-11
          rounded-xl
          bg-indigo-600
          hover:bg-indigo-500
          text-white
          shadow-lg
          border-none
          cursor-pointer
        "
        title="Open generated project"
      >
        <Code2 size={18} />
      </button>

      {/* ======================================================
          MOBILE DRAWER
      ======================================================= */}

      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* OVERLAY */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="
                lg:hidden
                fixed
                inset-0
                z-40
                bg-black/60
                backdrop-blur-sm
              "
            />

            {/* DRAWER */}

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                duration: 0.25,
                ease: "easeInOut",
              }}
              className="
                lg:hidden
                fixed
                inset-y-0
                right-0
                z-50
                w-[92vw]
                max-w-[420px]
                bg-[#0d0f14]
                border-l
                border-white/[0.06]
                overflow-hidden
              "
            >
              <ArtifactContent mobile />
            </motion.div>

          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Artifact;