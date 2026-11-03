// Ícones vetoriais da biblioteca Lucide, incluídos localmente para uso offline.
const paths = {
  "book-open": "<path d=\"M12 7v14\"/><path d=\"M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2h-3a4 4 0 0 0-4 4 4 4 0 0 0-4-4H5a2 2 0 0 0-2 2\"/>",
  "plane": "<path d=\"M17.8 19.2 16 12l4.8-4.8a2 2 0 0 0-2.8-2.8L13.2 9 6 7.2 3.8 9.4l6 3.6-2.8 2.8-2.2-.3-1.6 1.6 3.9 1.8 1.8 3.9 1.6-1.6-.3-2.2 2.8-2.8 3.6 6z\"/>",
  "briefcase-business": "<rect x=\"2\" y=\"7\" width=\"20\" height=\"14\" rx=\"2\"/><path d=\"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\"/><path d=\"M2 12h20\"/>",
  "utensils": "<path d=\"M4 3v7a3 3 0 0 0 6 0V3\"/><path d=\"M7 3v19\"/><path d=\"M20 22V3c-4 2-5 6-5 10h5\"/>",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42\"/>",
  "shopping-bag": "<path d=\"M6 7h12l1 14H5L6 7Z\"/><path d=\"M9 9V6a3 3 0 0 1 6 0v3\"/>",
  "messages-square": "<path d=\"M14 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v11l-4-3h-2a2 2 0 0 1-2-2z\"/><path d=\"M12 3H4a2 2 0 0 0-2 2v12l4-3h5a2 2 0 0 0 2-2V5a2 2 0 0 0-1-2\"/>",
  "map-pin": "<path d=\"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>",
  "code-2": "<path d=\"m16 18 6-6-6-6M8 6l-6 6 6 6m6-16-4 20\"/>",
  "arrow-right": "<path d=\"M5 12h14m-6-6 6 6-6 6\"/>",
  "check": "<path d=\"m4 12 5 5L20 6\"/>",
  "layers": "<path d=\"m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5\"/>",
  "keyboard": "<rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"/><path d=\"M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8\"/>"
};

export function createIcon(name, size = 20) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", String(size));
  icon.setAttribute("height", String(size));
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.8");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = paths[name] || paths["book-open"];
  return icon;
}
