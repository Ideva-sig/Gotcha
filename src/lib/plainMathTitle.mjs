// Browser tab titles are plain text; do not leave Markdown/LaTeX delimiters in them.
const superscripts = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻" };
const commands = { pi: "π", theta: "θ", alpha: "α", beta: "β", Delta: "Δ", times: "×", cdot: "·", leq: "≤", geq: "≥", ne: "≠", infty: "∞" };

function plainFormula(formula) {
  let text = formula;
  // Resolve simple fractions before stripping braces and commands.
  while (/\\(?:dfrac|tfrac|frac)\{[^{}]*\}\{[^{}]*\}/.test(text)) {
    text = text.replace(/\\(?:dfrac|tfrac|frac)\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
  }
  text = text.replace(/\\(?:text|mathrm|operatorname)\{([^{}]*)\}/g, "$1");
  text = text.replace(/\\([a-zA-Z]+)/g, (_, name) => commands[name] ?? name);
  text = text.replace(/\^\{([0-9+\-]+)\}|\^([0-9])/g, (_, group, digit) =>
    [...(group ?? digit)].map((char) => superscripts[char]).join(""));
  return text.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
}

export function plainMathTitle(title) {
  return String(title).replace(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g, (_, display, inline) => plainFormula(display ?? inline));
}
