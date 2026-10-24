// Kept apart from lib/theme.ts (client hooks) so the root layout, a Server
// Component, can inline the script.
export const KEY = "vp-theme";
export const QUERY = "(prefers-color-scheme: dark)";

/** Inlined in <head>: applies the saved or system theme before the first paint, so there is no flash. */
export const themeScript = `(function(){try{var p=localStorage.getItem("${KEY}");var d=p==="dark"||(p!=="light"&&matchMedia("${QUERY}").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;
