import React from "react";

const S = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" {...p}>{children}</svg>
);

export const IconHome = (p) => (
  <S {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></S>
);
export const IconTrips = (p) => (
  <S {...p}><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 106 5.3L3 8" /><path d="M12 7v5l3 2" /></S>
);
export const IconPlan = (p) => (
  <S {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8.5 6H15a4 4 0 010 8H9a4 4 0 00-4 4" /></S>
);
export const IconMap = (p) => (
  <S {...p}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></S>
);
export const IconClock = (p) => (
  <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>
);
export const IconFile = (p) => (
  <S {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /></S>
);
export const IconRoute = (p) => (
  <S {...p}><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h6a4 4 0 000-8H10a4 4 0 010-8h4" /></S>
);
export const IconFuel = (p) => (
  <S {...p}><path d="M3 21h10V5a2 2 0 00-2-2H5a2 2 0 00-2 2z" /><path d="M13 9h3a2 2 0 012 2v6a2 2 0 004 0V8l-4-4" /><path d="M6 8h4" /></S>
);
export const IconGauge = (p) => (
  <S {...p}><path d="M12 14l4-4" /><circle cx="12" cy="14" r="8" /><path d="M12 6V4M5 14H3M21 14h-2" /></S>
);
export const IconCalendar = (p) => (
  <S {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></S>
);
export const IconPin = (p) => (
  <S {...p}><path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></S>
);
export const IconNav = (p) => (
  <S {...p}><path d="M3 11l18-8-8 18-2-8-8-2z" /></S>
);
export const IconFlag = (p) => (
  <S {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></S>
);
export const IconCheck = (p) => (
  <S {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></S>
);
export const IconArrow = (p) => (
  <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>
);
export const IconChevron = (p) => (
  <S {...p}><path d="M9 6l6 6-6 6" /></S>
);
export const IconChevronLeft = (p) => (
  <S {...p}><path d="M15 6l-6 6 6 6" /></S>
);
export const IconZoomIn = (p) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4M11 8v6M8 11h6" /></S>
);
export const IconZoomOut = (p) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4M8 11h6" /></S>
);
export const IconExpand = (p) => (
  <S {...p}><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" /></S>
);
export const IconPrint = (p) => (
  <S {...p}><path d="M6 9V3h12v6" /><rect x="6" y="13" width="12" height="8" /><path d="M6 17H3v-5a2 2 0 012-2h14a2 2 0 012 2v5h-3" /></S>
);
export const IconPdf = (p) => (
  <S {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h1.5a1.5 1.5 0 010 3H9zM9 13v5M15 13h-2v5M13 15.5h1.5" /></S>
);
