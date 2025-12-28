import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Trash2,
  ChefHat,
  Flame,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Lightbulb,
  PlayCircle,
  X,
  Layers,
  Sparkles,
  Palette,
  Scroll,
  BookOpen,
  Star,
  History,
  Award
} from "lucide-react";

import { THEMES } from "./config/themes.js";
import { LEVELS } from "./config/levels.js";
import { generateId } from "./utils/id.js";
import { loadMenus, saveMenus, loadXP, saveXP, resetXP } from "./utils/storage.js";
import { parseRecipeText } from "./utils/parser.js";

import LevelModal from "./components/LevelModal.jsx";
import CheckInCard from "./components/CheckInCard.jsx";
import Timer from "./components/Timer.jsx";
import HeatDisplay from "./components/HeatDisplay.jsx";

export default function App() {
  const [currentThemeKey, setCurrentThemeKey] = useState("emerald");
  const [rawText, setRawText] = useState("");
  const [isCooking, setIsCooking] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const [menuTitle, setMenuTitle] = useState("");
  const [menuSubtitle, setMenuSubtitle] = useState("");
  const [meta, setMeta] = useState([]); // ✅ 核心标签
  const [ingredientGroups, setIngredientGroups] = useState([]);
  const [sections, setSections] = useState([]);
  const [tips, setTips] = useState([]);
  const [savedMenus, setSavedMenus] = useState([]);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    setSavedMenus(loadMenus());
    setTotalXP(loadXP());
  }, []);

  const getCurrentLevelInfo = (xp) => {
    let accumulatedXP = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      if (level.max === Infinity || xp < accumulatedXP + level.max) {
        return {
          ...level,
          currentLevelXP: xp - accumulatedXP,
          nextLevelXP: level.max
        };
      }
      accumulatedXP += level.max;
    }
    return LEVELS[LEVELS.length - 1];
  };
  const currentLevel = getCurrentLevelInfo(totalXP);

  const handleGainXP = (amount) => {
    const newXP = totalXP + amount;
    setTotalXP(newXP);
    saveXP(newXP);
  };

  const handleResetXP = () => {
    setTotalXP(0);
    resetXP();
  };

  const resetEditor = () => {
    setMenuTitle("");
    setMenuSubtitle("");
    setMeta([]);
    setIngredientGroups([]);
    setSections([]);
    setTips([]);
    setRawText("");
    setIsCooking(false);
    setShowCheckIn(false);
    setCurrentStepIndex(0);
  };

  const saveMenuToHistory = (menuObj) => {
    if (!menuObj?.title) return;
    const newMenu = {
      id: generateId(),
      title: menuObj.title,
      subtitle: menuObj.subtitle,
      meta: menuObj.meta || [],
      ingredients: menuObj.ingredientGroups || [],
      sections: menuObj.sections || [],
      tips: menuObj.tips || [],
      timestamp: Date.now()
    };

    setSavedMenus((prev) => {
      const filtered = prev.filter((m) => m.title !== newMenu.title);
      const updated = [newMenu, ...filtered].slice(0, 20);
      saveMenus(updated);
      return updated;
    });
  };

  const loadMenuFromHistory = (menu) => {
    setMenuTitle(menu.title);
    setMenuSubtitle(menu.subtitle || "");
    setMeta(menu.meta || []);
    setIngredientGroups(menu.ingredients || []);
    setSections(menu.sections || []);
    setTips(menu.tips || []);
  };

  const deleteMenuFromHistory = (e, id) => {
    e.stopPropagation();
    setSavedMenus((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveMenus(updated);
      return updated;
    });
  };

  const cookingFlow = useMemo(() => {
    const flow = [];
    if (menuTitle) {
      flow.push({
        type: "INTRO",
        name: menuTitle,
        desc: menuSubtitle || "绝世名菜，由此开启",
        sectionTitle: "秘籍总纲"
      });
    }
    if (ingredientGroups.length > 0) {
      flow.push({
        type: "PREP",
        name: "备料阶段",
        desc: "工欲善其事，必先利其器。请检查以下食材。",
        sectionTitle: "准备工作"
      });
    }
    sections.forEach((section) => {
      section.items.forEach((item) => {
        let seconds = 0;
        const timeMatch = ((item.price || "") + (item.desc || "")).match(/(\d+)\s*(分钟|min|m|秒|s)/);
        if (timeMatch) {
          const val = parseInt(timeMatch[1], 10);
          const unit = timeMatch[2];
          if (unit.startsWith("分") || unit === "min" || unit === "m") seconds = val * 60;
          else seconds = val;
        }
        flow.push({ type: "STEP", ...item, sectionTitle: section.title, timerSeconds: seconds });
      });
    });
    return flow;
  }, [sections, ingredientGroups, menuTitle, menuSubtitle]);

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.lang = "zh-CN";
    window.speechSynthesis.speak(u);
  };

  const parseTextToMenu = () => {
    if (!rawText.trim()) return;
    const parsed = parseRecipeText(rawText);

    if (parsed.title) setMenuTitle(parsed.title);
    if (parsed.subtitle) setMenuSubtitle(parsed.subtitle);
    setMeta(parsed.meta || []);
    setIngredientGroups(parsed.ingredientGroups || []);
    setSections(parsed.sections || []);
    setTips(parsed.tips || []);

    if (parsed.title) saveMenuToHistory(parsed);
  };

  const startCooking = () => {
    if (cookingFlow.length > 0) {
      setCurrentStepIndex(0);
      setIsCooking(true);
      setShowIngredientsModal(false);
      setShowTipsModal(false);
      setShowCheckIn(false);
    }
  };

  const handleFinish = () => setShowCheckIn(true);
  const handleTimerComplete = () => {
    if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    speak("大厨，火候到了！");
  };

  const currentTheme = THEMES[currentThemeKey] || THEMES.emerald;
  const currentStep = cookingFlow[currentStepIndex] || {};

  return (
    <div
      className="w-full flex flex-col md:flex-row font-sans overflow-hidden bg-stone-100 relative"
      style={{
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxSizing: "border-box"
      }}
    >
      {/* 编辑区 */}
      {!isCooking && (
        <div className="w-full md:w-[400px] lg:w-[450px] bg-white shadow-xl z-20 border-b md:border-r border-stone-200 h-[45vh] md:h-full relative flex flex-col shrink-0">
          <div className="pt-2 pb-2 px-3 md:pt-6 md:pb-4 md:px-6 bg-stone-900 text-stone-200 shrink-0 shadow-lg z-20 relative">
            <div className="flex justify-between items-start mb-1 md:mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="fill-amber-500 text-amber-500 animate-pulse" size={16} />
                  <h2 className="text-sm md:text-2xl font-black tracking-widest text-amber-500 uppercase">
                    每日一练 · 终成厨圣
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-stone-400 opacity-80 pl-8 hidden md:block">
                  唯有美食与爱不可辜负
                </p>
              </div>
            </div>

            <div
              onClick={() => setShowLevelModal(true)}
              className="bg-stone-800 rounded-lg md:rounded-xl p-2 md:p-3 border border-stone-700 cursor-pointer hover:bg-stone-700/80 transition-colors active:scale-95 flex items-center justify-between"
            >
              <div className="flex-1 mr-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-amber-400 text-xs md:text-lg">{currentLevel.name}</span>
                  <span className="text-[10px] md:text-xs font-mono text-stone-400">
                    {currentLevel.max === Infinity ? "∞" : `${currentLevel.currentLevelXP}/${currentLevel.nextLevelXP}`} XP
                  </span>
                </div>
                <div className="w-full bg-stone-900 rounded-full h-1 md:h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-1000"
                    style={{
                      width:
                        currentLevel.max === Infinity
                          ? "100%"
                          : `${(currentLevel.currentLevelXP / currentLevel.nextLevelXP) * 100}%`
                    }}
                  />
                </div>
              </div>
              <Award className="text-amber-500/50" size={16} />
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 relative z-10 p-2 md:p-6">
            <div className="bg-stone-100 p-1.5 md:p-4 rounded-xl md:rounded-2xl mb-2 md:mb-6 border-2 border-stone-200 shadow-sm flex flex-col gap-1.5">
              <label className="text-[10px] md:text-sm font-bold text-stone-500 flex items-center gap-1 uppercase tracking-widest">
                <Scroll size={12} /> 粘贴原文
              </label>
              <textarea
                className="w-full h-8 md:h-40 p-1.5 text-xs md:text-base bg-white border border-stone-300 rounded-lg md:rounded-xl text-stone-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none font-mono leading-relaxed"
                placeholder="粘贴..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <button
                onClick={parseTextToMenu}
                className="w-full bg-stone-900 text-white font-bold py-1.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-base hover:bg-stone-800 shadow-lg transform active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Sparkles size={14} /> 参悟秘籍
              </button>
            </div>

            <div className="space-y-1 md:space-y-6 pb-6">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest mb-0.5">
                  菜名
                </label>
                <input
                  value={menuTitle}
                  onChange={(e) => setMenuTitle(e.target.value)}
                  className="w-full font-black text-lg md:text-3xl border-b-2 border-stone-200 focus:border-amber-600 outline-none bg-transparent transition-all py-0.5 md:py-2"
                  placeholder="输入菜名"
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest mb-0.5">
                  简介
                </label>
                <textarea
                  value={menuSubtitle}
                  onChange={(e) => setMenuSubtitle(e.target.value)}
                  className="w-full text-xs md:text-lg text-stone-600 border-b border-stone-200 focus:border-amber-600 outline-none resize-none h-6 md:h-16 bg-transparent py-0.5 md:py-2"
                  placeholder="简短描述..."
                />
              </div>
            </div>

            {savedMenus.length > 0 && (
              <div className="pt-2 md:pt-6 border-t border-stone-200 pb-20">
                <h3 className="text-[10px] md:text-sm font-bold text-stone-500 mb-2 md:mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <History size={12} /> 藏经阁 ({savedMenus.length})
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {savedMenus.map((menu) => (
                    <div
                      key={menu.id}
                      onClick={() => loadMenuFromHistory(menu)}
                      className="group bg-white p-2 md:p-3 rounded-lg md:rounded-xl border border-stone-200 hover:border-amber-500 cursor-pointer shadow-sm flex justify-between items-center transition-all hover:shadow-md"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-stone-800 text-xs md:text-base truncate">{menu.title}</div>
                        <div className="text-[10px] md:text-xs text-stone-400 truncate">
                          {new Date(menu.timestamp).toLocaleDateString()} ·{" "}
                          {(menu.sections || []).reduce((acc, s) => acc + (s.items?.length || 0), 0)} 个步骤
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteMenuFromHistory(e, menu.id)}
                        className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 预览/沉浸区 */}
      <div className={`flex-1 overflow-hidden relative flex flex-col ${isCooking ? currentTheme.cook.bg : "bg-stone-100"}`}>
        {!isCooking && cookingFlow.length > 0 && (
          <div className="absolute bottom-6 md:bottom-10 right-6 md:right-10 z-30">
            <button
              onClick={startCooking}
              className="bg-stone-900 text-white px-8 py-4 md:px-10 md:py-5 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-all font-bold animate-bounce ring-4 ring-stone-900/20 text-lg md:text-xl"
            >
              <PlayCircle size={24} /> 开始修炼
            </button>
          </div>
        )}

        {isCooking && (
          <div className={`absolute inset-0 z-50 ${currentTheme.cook.bg} ${currentTheme.cook.text} flex flex-col h-full w-full`}>
            <div className={`flex justify-between items-center p-4 landscape:p-2 md:p-5 shadow-md z-20 ${currentTheme.cook.card} ${currentTheme.cook.border} border-b shrink-0`}>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsCooking(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X size={24} />
                </button>
                <div className="flex flex-col">
                  <span className="font-black text-xs md:text-sm uppercase tracking-[0.2em] opacity-50">
                    步骤 {currentStepIndex + 1} / {cookingFlow.length}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {tips.length > 0 && (
                  <button
                    onClick={() => setShowTipsModal(true)}
                    className="px-4 py-2 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 flex items-center gap-2"
                  >
                    <Lightbulb size={16} /> <span className="hidden md:inline">锦囊</span>
                  </button>
                )}
                <button
                  onClick={() => setShowThemeModal(!showThemeModal)}
                  className="px-4 py-2 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 flex items-center gap-2"
                >
                  <Palette size={16} /> <span className="hidden md:inline">流派</span>
                </button>
                <button
                  onClick={() => setShowIngredientsModal(true)}
                  className="px-4 py-2 rounded-full text-sm font-bold transition-all bg-white/10 hover:bg-white/20 flex items-center gap-2"
                >
                  <ShoppingCart size={16} /> 查料
                </button>
              </div>
            </div>

            {showCheckIn && (
              <CheckInCard menuTitle={menuTitle} onClose={resetEditor} onGainXP={handleGainXP} />
            )}

            {/* 查料 */}
            {showIngredientsModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowIngredientsModal(false)} />
                <div className={`${currentTheme.cook.card} border ${currentTheme.cook.border} rounded-3xl p-6 md:p-10 shadow-2xl w-full max-w-3xl relative animate-in zoom-in-95 max-h-[85vh] overflow-hidden flex flex-col`}>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className={`text-2xl md:text-3xl font-black ${currentTheme.cook.accentText} flex items-center gap-3`}>
                      <ShoppingCart size={32} /> 备料清单
                    </h3>
                    <button onClick={() => setShowIngredientsModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                      <X size={28} />
                    </button>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {ingredientGroups.map((group, gIdx) => (
                        <div key={gIdx}>
                          <h4 className="text-sm font-bold opacity-50 uppercase tracking-widest mb-4">{group.category}</h4>
                          <div className="space-y-3">
                            {group.items.map((ing, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className={`w-2 h-2 rounded-full ${currentTheme.cook.progress}`} />
                                <span className="text-xl md:text-2xl font-medium">{ing}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 小贴士 */}
            {showTipsModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowTipsModal(false)} />
                <div className={`${currentTheme.cook.card} border ${currentTheme.cook.border} rounded-3xl p-6 md:p-10 shadow-2xl w-full max-w-3xl relative animate-in zoom-in-95 max-h-[85vh] overflow-hidden flex flex-col`}>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-black text-yellow-400 flex items-center gap-3">
                      <Lightbulb size={32} /> 秘籍锦囊
                    </h3>
                    <button onClick={() => setShowTipsModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                      <X size={28} />
                    </button>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                    <div className="space-y-4">
                      {tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/20">
                          <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2.5 shrink-0" />
                          <span className="text-xl md:text-2xl font-medium text-yellow-100 leading-relaxed">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 换肤 */}
            {showThemeModal && (
              <div className="absolute top-[80px] right-4 z-50 animate-in zoom-in-95 origin-top-right">
                <div className={`${currentTheme.cook.card} border ${currentTheme.cook.border} rounded-2xl p-4 shadow-2xl flex flex-col gap-2 min-w-[180px]`}>
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setCurrentThemeKey(key);
                        setShowThemeModal(false);
                      }}
                      className={`text-left px-4 py-3 rounded-xl text-base font-bold flex items-center gap-3 transition-colors hover:bg-white/10 ${currentThemeKey === key ? currentTheme.cook.accentText : ""}`}
                    >
                      <div className={`w-4 h-4 rounded-full ${t.cook.progress}`} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`w-full h-2 ${currentTheme.cook.card} shrink-0`}>
              <div
                className={`${currentTheme.cook.progress} h-2 transition-all duration-500`}
                style={{ width: `${((currentStepIndex + 1) / cookingFlow.length) * 100}%` }}
              />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center">
                {currentStep.type === "INTRO" && (
                  <div className="text-center space-y-8 md:space-y-12 animate-in zoom-in-95 duration-700 py-10 md:py-20 max-w-4xl mx-auto">
                    <BookOpen size={64} className={`mx-auto ${currentTheme.cook.accentText}`} />
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-stone-500 leading-tight">
                      {currentStep.name}
                    </h1>
                    <p className="text-2xl md:text-4xl font-light italic opacity-60 max-w-3xl mx-auto leading-normal">
                      “{currentStep.desc}”
                    </p>
                  </div>
                )}

                {currentStep.type === "PREP" && (
                  <div className="w-full max-w-5xl mx-auto pb-20 animate-in slide-in-from-bottom-8">
                    <div className="mb-8 md:mb-12 text-center">
                      <h2 className="text-3xl md:text-5xl font-black mb-4 flex items-center justify-center gap-4">
                        <ShoppingCart size={40} /> 备料阶段
                      </h2>
                      <p className="opacity-50 text-lg md:text-xl">请确认所有食材已就位</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      {ingredientGroups.map((group, gIdx) => (
                        <div key={gIdx} className={`${currentTheme.cook.card} p-6 md:p-8 rounded-[2rem] border ${currentTheme.cook.border}`}>
                          <h3 className={`text-sm font-bold ${currentTheme.cook.accentText} uppercase mb-6 tracking-widest`}>
                            {group.category}
                          </h3>
                          <div className="space-y-3 md:space-y-4">
                            {group.items.map((ing, i) => (
                              <div key={i} className="flex items-center gap-4 text-xl md:text-2xl p-3 md:p-4 rounded-2xl bg-white/5">
                                <div className={`w-3 h-3 rounded-full ${currentTheme.cook.progress}`} />
                                <span className="font-bold">{ing}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep.type === "STEP" && (
                  <div className="w-full h-full flex flex-col md:justify-center max-w-5xl mx-auto pb-10">
                    <div className="flex flex-col landscape:flex-row gap-6 md:gap-10 items-stretch landscape:items-center landscape:h-[70vh] landscape:md:h-[60vh] w-full">
                      <div className={`${currentTheme.cook.card} w-full landscape:w-3/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl border ${currentTheme.cook.border} relative flex flex-col transition-all overflow-hidden landscape:h-full`}>
                        <div className="relative z-10 shrink-0">
                          <div className="flex justify-between items-start mb-6">
                            <span className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-black tracking-widest uppercase border border-white/10 bg-white/5 ${currentTheme.cook.accentText}`}>
                              {currentStep.sectionTitle}
                            </span>
                            {currentStep.price && (
                              <div className="scale-90 origin-top-right md:scale-100">
                                <HeatDisplay heatText={currentStep.price} />
                              </div>
                            )}
                          </div>
                          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                            {currentStep.name || `招式 ${currentStepIndex}`}
                          </h2>
                          <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent mb-6" />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                          <p className="text-2xl md:text-4xl lg:text-4xl opacity-90 leading-relaxed font-normal whitespace-pre-line">
                            {currentStep.desc}
                          </p>
                        </div>
                      </div>

                      {currentStep.timerSeconds > 0 && (
                        <div className="shrink-0 w-full landscape:w-2/5 flex items-center justify-center">
                          <Timer
                            key={currentStepIndex}
                            initialSeconds={currentStep.timerSeconds}
                            onComplete={handleTimerComplete}
                            colorClass={currentTheme.cook.accentText}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`p-4 landscape:p-2 md:p-6 pb-8 landscape:pb-4 md:pb-10 ${currentTheme.cook.card} border-t ${currentTheme.cook.border} flex gap-4 md:gap-6 shrink-0`}>
              <button
                onClick={() => setCurrentStepIndex((curr) => Math.max(0, curr - 1))}
                disabled={currentStepIndex === 0}
                className={`p-5 landscape:p-3 md:p-6 rounded-3xl flex-1 flex items-center justify-center transition-all bg-white/5 ${currentStepIndex === 0 ? "opacity-30" : "hover:bg-white/10 active:scale-95"}`}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={currentStepIndex === cookingFlow.length - 1 ? handleFinish : () => setCurrentStepIndex((curr) => curr + 1)}
                className={`flex-[3] ${currentTheme.cook.primary} ${currentTheme.cook.primaryHover} text-white p-5 landscape:p-3 md:p-6 rounded-3xl font-black text-xl md:text-3xl transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 ring-4 ring-white/10`}
              >
                {currentStepIndex === cookingFlow.length - 1 ? "修炼完成" : currentStep.type === "INTRO" ? "查看备料" : currentStep.type === "PREP" ? "开始修炼" : "下一式"}
                {currentStepIndex !== cookingFlow.length - 1 && <ChevronRight size={32} />}
              </button>
            </div>
          </div>
        )}

        {showLevelModal && <LevelModal totalXP={totalXP} onClose={() => setShowLevelModal(false)} onReset={handleResetXP} />}

        {/* 编辑器右侧预览区（简化展示：含 meta/食材/步骤/锦囊） */}
        {!isCooking && (
          <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 md:p-10 lg:p-16 flex justify-center">
            {menuTitle ? (
              <div className={`w-full max-w-4xl min-h-[80vh] p-8 md:p-16 shadow-2xl relative bg-white rounded-xl ${currentTheme.preview.text} ${currentTheme.preview.bg} mb-20`}>
                <div className={`w-full flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 ${currentTheme.preview.border} pb-8 md:pb-12 mb-8 md:mb-12`}>
                  <div className="space-y-6 w-full">
                    <div className="inline-block px-4 py-1.5 bg-stone-800 text-white text-xs md:text-sm font-black uppercase tracking-[0.3em]">
                      秘籍卷轴
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">{menuTitle}</h1>
                    <p className="opacity-70 text-lg md:text-2xl italic leading-relaxed border-l-4 border-amber-500 pl-6 whitespace-pre-line">
                      {menuSubtitle}
                    </p>
                  </div>
                  <div className="opacity-10 hidden md:block">
                    <ChefHat size={150} />
                  </div>
                </div>

                {meta.length > 0 && (
                  <div className="mb-10 p-6 md:p-8 rounded-3xl border bg-stone-50/50 border-stone-200">
                    <h3 className="font-black mb-4 text-base md:text-lg uppercase tracking-widest text-stone-700">核心标签</h3>
                    <div className="flex flex-wrap gap-2">
                      {meta.map((m, i) => (
                        <span key={i} className="px-3 py-1 rounded-full text-xs md:text-sm font-bold bg-stone-800 text-white/90">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ingredientGroups.length > 0 && (
                  <div className="mb-10 md:mb-16 p-6 md:p-10 rounded-3xl border bg-stone-50/50 border-stone-200">
                    <h3 className="font-black mb-6 md:mb-8 flex items-center gap-3 text-base md:text-lg uppercase tracking-widest text-amber-800 border-b border-stone-200 pb-4">
                      <ShoppingCart size={24} /> 备料清单
                    </h3>
                    <div className="space-y-8 md:space-y-10">
                      {ingredientGroups.map((group, gIdx) => (
                        <div key={gIdx}>
                          <h4 className="text-xs font-black opacity-40 uppercase mb-4 tracking-widest flex items-center gap-2">
                            <Layers size={14} /> {group.category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.items.map((ing, i) => (
                              <div key={i} className="flex items-center gap-4 py-2 border-b border-stone-100 border-dashed">
                                <div className="w-2 h-2 rounded-full bg-stone-300 shrink-0" />
                                <span className="text-lg md:text-xl font-medium opacity-80">{ing}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-10 md:space-y-16">
                  {sections.map((section, sIdx) => (
                    <div key={section.id}>
                      <h3 className="flex items-center gap-4 font-black text-2xl md:text-3xl mb-6 md:mb-8">
                        <span className="bg-stone-800 text-white w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-base md:text-lg shadow-lg">
                          {sIdx + 1}
                        </span>
                        {section.title}
                      </h3>
                      <div className="grid grid-cols-1 gap-8 pl-5 md:pl-6 border-l-2 border-stone-200 ml-5 md:ml-6">
                        {section.items.map((item, idx) => (
                          <div key={item.id} className="relative pb-8 last:pb-0">
                            <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-3 gap-2">
                              <h4 className="font-black text-xl md:text-2xl opacity-90">{item.name || `第 ${idx + 1} 招`}</h4>
                              {item.price && (
                                <span className={`self-start md:self-auto text-xs md:text-sm font-black px-3 py-1 rounded-full flex items-center gap-1 ${currentTheme.preview.badge}`}>
                                  <Flame size={14} /> {item.price}
                                </span>
                              )}
                            </div>
                            <p className="text-lg md:text-xl opacity-70 leading-loose font-light whitespace-pre-line">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {tips.length > 0 && (
                  <div className="mt-16 p-8 bg-yellow-50/50 rounded-3xl border border-yellow-200">
                    <h3 className="font-black text-2xl text-amber-600 mb-6 flex items-center gap-3">
                      <Lightbulb size={28} /> 秘籍锦囊
                    </h3>
                    <ul className="space-y-4">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex gap-4 text-stone-600 text-lg leading-relaxed">
                          <span className="text-amber-400 font-bold">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-300 py-20">
                <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Scroll size={48} className="text-stone-400" />
                </div>
                <h3 className="text-xl md:text-3xl font-black uppercase tracking-widest text-center px-4 mb-2 text-stone-400">
                  请在左侧粘贴秘籍
                </h3>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
