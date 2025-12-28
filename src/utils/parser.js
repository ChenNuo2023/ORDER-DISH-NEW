import { generateId } from "./id.js";

const clean = (s) =>
  (s || "")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

const isHeaderLine = (line) => {
  return (
    /^(核心标签|食材准备|食材|主料|配料|调料|详细做法|做法概览|做法|步骤|关键小贴士|小贴士|提示|注意|锦囊)\s*$/.test(
      line
    ) || /^(🛒|🧂|👨‍🍳|💡|⚠️|❗️)/.test(line)
  );
};

const parseStepStart = (line) => {
  let m = line.match(/^([一二三四五六七八九十]+)[、.]\s*(.+)$/);
  if (m) return { kind: "SECTION", title: clean(m[2]) };

  m = line.match(/^(\d{1,2})\s*[.、)]\s*(.+)$/);
  if (m) return { kind: "STEP", title: clean(m[2]) };

  m = line.match(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*(.+)$/);
  if (m) return { kind: "STEP", title: clean(m[1]) };

  return null;
};

const pushTipLine = (arr, line) => {
  const t = clean(line).replace(
    /^(💡|⚠️|❗️|小贴士|关键小贴士|注意|提示)[:：]?\s*/,
    ""
  );
  if (t) arr.push(t);
};

export function parseRecipeText(rawText) {
  let lines = rawText
    .split("\n")
    .map((l) => clean(l))
    .filter(Boolean)
    .filter((l) => !/^[—\-_=]{3,}$/.test(l));

  let title = "";
  let subtitle = "";
  let meta = [];
  let ingredientGroups = [];
  let sections = [];
  let tips = [];

  let state = "UNKNOWN"; // META | ING | STEPS | TIPS
  let currentIngCategory = "清单";

  let currentSection = { id: generateId(), title: "步骤", items: [] };
  let currentStepItem = null;

  // 标题/简介识别
  if (lines.length > 0) {
    const first = lines[0];
    if (first.length <= 30 && !/[:：]/.test(first) && !isHeaderLine(first)) {
      title = first.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5]+/, "").trim();
      lines.shift();

      let desc = [];
      while (
        lines.length > 0 &&
        !isHeaderLine(lines[0]) &&
        !parseStepStart(lines[0])
      ) {
        if (/[:：]/.test(lines[0]) || /[|｜]/.test(lines[0])) break;
        desc.push(lines.shift());
      }
      subtitle = desc.join("\n").trim();
    }
  }

  const ensureIngGroup = (category) => {
    let g = ingredientGroups.find((x) => x.category === category);
    if (!g) {
      g = { category, items: [] };
      ingredientGroups.push(g);
    }
    return g;
  };

  const ensureSectionPushed = () => {
    if (currentSection?.items?.length) sections.push(currentSection);
  };

  const startNewSection = (t) => {
    ensureSectionPushed();
    currentSection = { id: generateId(), title: t || "步骤", items: [] };
    currentStepItem = null;
  };

  const startNewStep = (t, initialDesc = "") => {
    currentStepItem = {
      id: generateId(),
      name: t || "",
      price: "",
      desc: clean(initialDesc)
    };
    currentSection.items.push(currentStepItem);
  };

  const appendToCurrentStep = (text) => {
    const t = clean(text);
    if (!t) return;
    if (!currentStepItem) startNewStep("", t);
    else currentStepItem.desc = currentStepItem.desc ? currentStepItem.desc + "\n" + t : t;
  };

  lines.forEach((rawLine) => {
    const line = clean(rawLine);

    // 模块切换
    if (/^(核心标签)$/.test(line)) { state = "META"; return; }
    if (/^(食材准备|食材|主料|配料|调料)$/.test(line) || /^(🛒|🧂)/.test(line)) { state = "ING"; return; }
    if (/^(详细做法|做法概览|做法|步骤)$/.test(line) || /^(👨‍🍳|🍳|🔥)/.test(line)) { state = "STEPS"; return; }
    if (/^(关键小贴士|小贴士|提示|注意|锦囊)$/.test(line) || /^(💡|⚠️|❗️)/.test(line)) { state = "TIPS"; return; }

    // META
    if (state === "META") {
      if (/[|｜]/.test(line)) {
        line.split(/[|｜]/).map(clean).filter(Boolean).forEach((part) => meta.push(part));
      } else {
        meta.push(line);
      }
      return;
    }

    // TIPS
    if (state === "TIPS") {
      pushTipLine(tips, line);
      return;
    }

    // ING
    if (state === "ING") {
      // 分类标题
      if (!/[:：]/.test(line) && line.length <= 12 && !line.startsWith("-")) {
        currentIngCategory = line.replace(/[:：]/g, "").trim() || currentIngCategory;
        return;
      }

      const bullet = line.replace(/^[-•·]\s*/, "");
      const m = bullet.match(/^([^:：]{1,20})[:：]\s*(.+)$/);
      if (m && m[1] && m[2]) {
        const cat = clean(m[1]);
        const val = clean(m[2]);
        if (/^(主料|配料|调料|必选|可选)$/.test(cat)) {
          currentIngCategory = cat;
          const arr = val.split(/[,，]/).map(clean).filter(Boolean);
          ensureIngGroup(currentIngCategory).items.push(...arr);
        } else {
          ensureIngGroup(currentIngCategory).items.push(`${cat}：${val}`);
        }
      } else {
        ensureIngGroup(currentIngCategory).items.push(bullet);
      }
      return;
    }

    // STEPS / UNKNOWN
    if (state === "STEPS" || state === "UNKNOWN") {
      const stepStart = parseStepStart(line);
      if (stepStart) {
        if (stepStart.kind === "SECTION") startNewSection(stepStart.title);
        else startNewStep(stepStart.title, "");
        return;
      }

      const mOld = line.match(/^第?\s*(\d{1,2})\s*步[:：]?\s*(.*)$/);
      if (mOld) {
        startNewStep(clean(mOld[2]) || `步骤 ${mOld[1]}`, "");
        return;
      }

      // 抽取火候/时间到 badge（price）
      const heatTimeRegex =
        /(大火|中火|小火|微火|猛火|文火|转.*?火|油温.*?成热|(\d+)\s*(分钟|min|m|秒|s)|约\s*\d+\s*(分钟|秒))/g;
      const hits = line.match(heatTimeRegex);
      if (hits && currentStepItem && !currentStepItem.price) {
        currentStepItem.price = hits.join(" ");
      }

      appendToCurrentStep(line);
      return;
    }
  });

  ensureSectionPushed();

  return { title, subtitle, meta, ingredientGroups, sections, tips };
}
