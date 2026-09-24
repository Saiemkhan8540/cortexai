import pptxgen from "pptxgenjs";

// =========================================
// COLORS
// =========================================

const COLORS = {
  primary: "4F46E5",
  secondary: "0F172A",
  white: "FFFFFF",
  black: "111827",
  text: "334155",
  muted: "94A3B8",
  border: "CBD5E1",
  light: "F8FAFC",
  blue: "60A5FA",
  lightBlue: "DBEAFE",
};


// =========================================
// GENERATE PPT
// =========================================

export const generatePpt = async (data) => {

  const ppt = new pptxgen();

  // -----------------------------------------
  // PRESENTATION SETTINGS
  // -----------------------------------------

  ppt.layout = "LAYOUT_WIDE";

  ppt.author = "CortexAI";
  ppt.title = data?.title || "CortexAI Presentation";
  ppt.subject = data?.title || "CortexAI Presentation";
  ppt.company = "CortexAI";
  ppt.lang = "en-US";

  // -----------------------------------------
  // THEME
  // -----------------------------------------

  ppt.theme = {
    headFontFace: "Aptos",
    bodyFontFace: "Aptos",
    lang: "en-US",
  };


  // =========================================
  // COVER SLIDE
  // =========================================

  addCover(ppt, data);


  // =========================================
  // CONTENT SLIDES
  // =========================================

  const slides = Array.isArray(data?.slides)
    ? data.slides
    : [];

  slides.forEach((slideData, index) => {

    addContentSlide(
      ppt,
      slideData?.title || `Slide ${index + 1}`,
      Array.isArray(slideData?.points)
        ? slideData.points
        : [],
      index + 1,
      slides.length
    );

  });


  // =========================================
  // THANK YOU SLIDE
  // =========================================

  addThankYou(ppt);


  // =========================================
  // RETURN PPT BUFFER
  // =========================================

  const buffer = await ppt.write({
    outputType: "nodebuffer",
  });

  return buffer;
};


// =========================================
// COVER SLIDE
// =========================================

const addCover = (ppt, data) => {

  const slide = ppt.addSlide();

  slide.background = {
    color: COLORS.primary,
  };


  // -----------------------------------------
  // TOP ACCENT BAR
  // -----------------------------------------

  slide.addShape(ppt.ShapeType.rect, {

    x: 0,
    y: 0,

    w: 13.33,
    h: 0.18,

    fill: {
      color: COLORS.blue,
    },

    line: {
      color: COLORS.blue,
    },

  });


  // -----------------------------------------
  // TITLE
  // -----------------------------------------

  slide.addText(
    data?.title || "CortexAI Presentation",
    {

      x: 0.7,
      y: 1.7,

      w: 12,
      h: 1,

      align: "center",
      valign: "mid",

      color: COLORS.white,

      bold: true,
      fontFace: "Aptos",

      fontSize: 28,

      margin: 0,

      fit: "shrink",

    }
  );


  // -----------------------------------------
  // SUBTITLE
  // -----------------------------------------

  if (data?.subtitle) {

    slide.addText(
      data.subtitle,
      {

        x: 1,
        y: 3,

        w: 11.33,
        h: 0.8,

        align: "center",
        valign: "mid",

        color: COLORS.lightBlue,

        fontFace: "Aptos",

        fontSize: 16,

        margin: 0,

        fit: "shrink",

      }
    );

  }


  // -----------------------------------------
  // BRAND
  // -----------------------------------------

  slide.addText(
    "CortexAI",
    {

      x: 0.6,
      y: 6.9,

      w: 2,
      h: 0.25,

      fontSize: 10,

      fontFace: "Aptos",

      color: COLORS.lightBlue,

      margin: 0,

    }
  );

};


// =========================================
// CONTENT SLIDE
// =========================================

const addContentSlide = (
  ppt,
  title,
  points,
  page,
  total
) => {

  const slide = ppt.addSlide();


  // -----------------------------------------
  // BACKGROUND
  // -----------------------------------------

  slide.background = {
    color: COLORS.white,
  };


  // -----------------------------------------
  // TITLE
  // -----------------------------------------

  slide.addText(
    title,
    {

      x: 0.6,
      y: 0.35,

      w: 10.8,
      h: 0.55,

      align: "left",
      valign: "mid",

      color: COLORS.primary,

      bold: true,

      fontFace: "Aptos",

      fontSize: 24,

      margin: 0,

      fit: "shrink",

    }
  );


  // -----------------------------------------
  // TOP LINE
  // -----------------------------------------

  slide.addShape(
    ppt.ShapeType.line,
    {

      x: 0.6,
      y: 1,

      w: 12.1,
      h: 0,

      line: {

        color: COLORS.border,

        width: 1.2,

      },

    }
  );


  // -----------------------------------------
  // BULLET POINTS
  // -----------------------------------------

  const visiblePoints = Array.isArray(points)
    ? points.slice(0, 6)
    : [];


  visiblePoints.forEach((point, index) => {

    const y = 1.35 + index * 0.78;


    // Bullet circle
    slide.addShape(
      ppt.ShapeType.ellipse,
      {

        x: 0.75,
        y: y + 0.15,

        w: 0.13,
        h: 0.13,

        fill: {

          color: COLORS.primary,

        },

        line: {

          color: COLORS.primary,

        },

      }
    );


    // Bullet text
    slide.addText(
      String(point),
      {

        x: 1.05,
        y,

        w: 11.2,
        h: 0.55,

        color: COLORS.text,

        fontFace: "Aptos",

        fontSize: 17,

        breakLine: false,

        margin: 0,

        fit: "shrink",

        valign: "mid",

      }
    );

  });


  // -----------------------------------------
  // PAGE NUMBER
  // -----------------------------------------

  slide.addText(
    `${page} / ${total}`,
    {

      x: 11.5,
      y: 6.9,

      w: 1.2,
      h: 0.25,

      align: "right",

      fontSize: 10,

      color: COLORS.muted,

      fontFace: "Aptos",

      margin: 0,

    }
  );


  // -----------------------------------------
  // FOOTER
  // -----------------------------------------

  slide.addText(
    "CortexAI",
    {

      x: 0.6,
      y: 6.9,

      w: 2,
      h: 0.25,

      fontSize: 10,

      color: COLORS.muted,

      fontFace: "Aptos",

      margin: 0,

    }
  );

};


// =========================================
// THANK YOU SLIDE
// =========================================

const addThankYou = (ppt) => {

  const slide = ppt.addSlide();


  // -----------------------------------------
  // BACKGROUND
  // -----------------------------------------

  slide.background = {
    color: COLORS.secondary,
  };


  // -----------------------------------------
  // TITLE
  // -----------------------------------------

  slide.addText(
    "Thank You",
    {

      x: 0,
      y: 2.2,

      w: 13.33,
      h: 0.8,

      align: "center",
      valign: "mid",

      fontSize: 34,

      bold: true,

      fontFace: "Aptos",

      color: COLORS.white,

      margin: 0,

    }
  );


  // -----------------------------------------
  // FOOTER
  // -----------------------------------------

  slide.addText(
    "Generated by CortexAI",
    {

      x: 0,
      y: 6.9,

      w: 13.33,
      h: 0.25,

      align: "center",

      color: COLORS.muted,

      fontSize: 10,

      fontFace: "Aptos",

      margin: 0,

    }
  );

};