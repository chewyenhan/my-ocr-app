import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Sparkles, 
  RotateCcw, 
  ExternalLink, 
  HelpCircle, 
  BookOpen,
  Award,
  ArrowRight,
  TrendingUp,
  Scale,
  BrainCircuit,
  Volume2,
  FileCheck,
  Mic,
  MicOff
} from "lucide-react";
import { synth } from "./utils/audioSynth";
import { speaker } from "./utils/textToSpeech";
import { AudioControlPanel } from "./components/AudioControlPanel";
import { LEVELS_DATA, GameLevel, GameOption } from "./types";

export default function App() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [unlockedMedals, setUnlockedMedals] = useState<number[]>([]);
  const [activeOverlay, setActiveOverlay] = useState<{
    show: boolean;
    result: "success" | "fail";
    title: string;
    body: string;
    philosopher: string;
    concept: string;
    quotes?: string;
  } | null>(null);
  
  const [victoryState, setVictoryState] = useState<boolean>(false);
  const [hoveredOptionIdx, setHoveredOptionIdx] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Auto-speak level description when level changes
  useEffect(() => {
    if (isPlaying && !activeOverlay && !victoryState) {
      const currentLevel = LEVELS_DATA[currentLevelIdx];
      if (voiceEnabled) {
        // Add a small delay to let UI render first
        setTimeout(() => {
          speaker.speakLevel(currentLevel.title, currentLevel.description);
        }, 500);
      }
    }
  }, [currentLevelIdx, isPlaying, activeOverlay, victoryState, voiceEnabled]);

  const startMission = () => {
    synth.playClick();
    setIsPlaying(true);
    setCurrentLevelIdx(0);
    setUnlockedMedals([]);
    setActiveOverlay(null);
    setVictoryState(false);
  };

  const handleOptionHover = () => {
    synth.playHover();
  };

  const selectOption = (opt: GameOption) => {
    // Play associated high-fidelity synthesized audio based on standard feedback
    if (opt.result === "success") {
      synth.playSuccess();
      setActiveOverlay({
        show: true,
        result: "success",
        title: opt.title,
        body: opt.body,
        philosopher: opt.philosopher,
        concept: opt.concept,
        quotes: opt.quotes
      });
      // Speak the result
      if (voiceEnabled) {
        setTimeout(() => {
          speaker.speakResult(opt.title, opt.body, opt.philosopher);
        }, 500);
      }
    } else {
      synth.playFailure();
      setActiveOverlay({
        show: true,
        result: "fail",
        title: opt.title,
        body: opt.body,
        philosopher: opt.philosopher,
        concept: opt.concept,
        quotes: opt.quotes
      });
      // Speak the result
      if (voiceEnabled) {
        setTimeout(() => {
          speaker.speakResult(opt.title, opt.body, opt.philosopher);
        }, 500);
      }
    }
  };

  const handleNextStep = () => {
    synth.playClick();
    if (!activeOverlay) return;

    if (activeOverlay.result === "success") {
      const updatedMedals = [...unlockedMedals];
      if (!updatedMedals.includes(currentLevelIdx + 1)) {
        updatedMedals.push(currentLevelIdx + 1);
        setUnlockedMedals(updatedMedals);
      }

      const nextIdx = currentLevelIdx + 1;
      if (nextIdx < LEVELS_DATA.length) {
        setCurrentLevelIdx(nextIdx);
        setActiveOverlay(null);
      } else {
        // Play epic orchestration when completing the whole puzzle
        synth.playVictory();
        setVictoryState(true);
        setActiveOverlay(null);
        // Speak victory message
        if (voiceEnabled) {
          setTimeout(() => {
            speaker.speakVictory();
          }, 500);
        }
      }
    } else {
      // Time loop rewind
      setActiveOverlay(null);
    }
  };

  const resetEverything = () => {
    synth.playClick();
    speaker.stop();
    setIsPlaying(false);
    setCurrentLevelIdx(0);
    setUnlockedMedals([]);
    setActiveOverlay(null);
    setVictoryState(false);
  };

  const currentLevel: GameLevel = LEVELS_DATA[currentLevelIdx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Decorative ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-indigo-500/30 rounded-2xl blur-sm animate-pulse" />
              <div className="relative w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white border border-indigo-400">
                🛸
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black font-sans tracking-tight text-white flex items-center gap-2">
                理想号：理性的终极考验 <span className="text-sm bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full uppercase font-mono tracking-widest hidden sm:inline-block">V3.0 Pro</span>
              </h1>
              <p className="text-sm md:text-base text-slate-400 font-medium">人类文明思想火种 · 启蒙主义经典政治哲学的沙盒演绎</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Voice toggle button */}
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="p-2.5 bg-slate-800/80 hover:bg-emerald-900/30 border border-slate-700/60 hover:border-emerald-700 rounded-xl text-slate-300 hover:text-emerald-400 cursor-pointer transition-all active:scale-95 text-sm font-bold"
              title={voiceEnabled ? "关闭语音" : "启用语音"}
            >
              {voiceEnabled ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>

            {/* Medals container */}
            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl">
              <span className="text-sm font-mono font-bold text-slate-500">解锁勋章:</span>
              <div className="flex gap-2">
                <div 
                  id="med-盧梭"
                  title="让-雅克·卢梭 勋章 (社会契约)"
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all duration-500 border ${
                    unlockedMedals.includes(1) 
                      ? 'bg-amber-400/25 border-amber-400 text-amber-300 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.25)]' 
                      : 'bg-slate-900 border-slate-800 text-slate-600 filter grayscale opacity-40'
                  }`}
                >
                  📜
                </div>
                <div 
                  id="med-孟德斯鳩"
                  title="查看孟德斯鸠 勋章 (三权分立)"
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all duration-500 border ${
                    unlockedMedals.includes(2) 
                      ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.25)]' 
                      : 'bg-slate-900 border-slate-800 text-slate-600 filter grayscale opacity-40'
                  }`}
                >
                  ⚖️
                </div>
                <div 
                  id="med-亞當斯密"
                  title="亚当·斯密 勋章 (自由市场)"
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all duration-500 border ${
                    unlockedMedals.includes(3) 
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.25)]' 
                      : 'bg-slate-900 border-slate-800 text-slate-600 filter grayscale opacity-40'
                  }`}
                >
                  💰
                </div>
              </div>
            </div>

            {isPlaying && (
              <button 
                id="btn-restart-game"
                onClick={resetEverything}
                className="p-2.5 bg-slate-800/80 hover:bg-rose-955/30 border border-slate-700/60 hover:border-rose-900 rounded-xl text-slate-300 hover:text-rose-400 cursor-pointer transition-all active:scale-95 text-xs font-bold"
                title="重置到游戏主页"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center relative z-10 transition-all">
        
        {!isPlaying ? (
          /* Pre-start Launcher Screen */
          <div id="launcher-view" className="w-full max-w-3xl bg-slate-900/70 border border-slate-800/90 rounded-[3rem] p-8 md:p-12 text-center relative overflow-hidden backdrop-blur-xl shadow-2xl">
            
            {/* Visual ambient circles */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="text-sm font-mono tracking-[0.3em] font-black text-indigo-400 uppercase bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
                A CIVILIZATION SURVIVAL GAME
              </span>

              <div className="text-9xl my-8 select-none filter drop-shadow-[0_15px_30px_rgba(99,102,241,0.25)] animate-bounce duration-[2500ms]">
                🛸
              </div>

              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-xl mx-auto">
                重塑文明之火的<br />
                <span className="bg-gradient-to-r from-amber-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">理性的终极考验</span>
              </h2>

              <p className="mt-5 text-lg md:text-xl text-slate-300 max-w-xl mx-auto leading-relaxed font-medium">
                当一艘搭载着人类文明种子的探索飞船“理想号”在蛮荒遥远的未开发异星紧急迫降，在极端的生存重压下，你该如何构筑新世界的权力、底线法则与生机？
              </p>

              {/* Game guidelines */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
                  <div className="text-3xl mb-1.5">📜</div>
                  <h4 className="text-lg font-bold text-slate-100 font-sans">1. 缔结契约</h4>
                  <p className="text-base text-slate-400 mt-1 leading-relaxed">抵御野蛮法则，与千万生灵签订不可分割的普世公民权力契约。</p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
                  <div className="text-3xl mb-1.5">⚖️</div>
                  <h4 className="text-lg font-bold text-slate-100 font-sans">2. 牵制利权</h4>
                  <p className="text-base text-slate-400 mt-1 leading-relaxed">打破强权垄断之笼，精妙分拆权力以平衡求得公义的长久驻留。</p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
                  <div className="text-3xl mb-1.5">💰</div>
                  <h4 className="text-lg font-bold text-slate-100 font-sans">3. 唤醒市场</h4>
                  <p className="text-base text-slate-400 mt-1 leading-relaxed">让那只"无形之手"流淌在滩头，以自由流动激活全岛勃勃生机。</p>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  id="btn-play-now"
                  onClick={startMission}
                  onMouseEnter={() => synth.playHover()}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-2xl px-10 py-5 rounded-2xl cursor-pointer shadow-[0_10px_25px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 text-center transition-all duration-200"
                >
                  开启理智征途 🚀
                </button>
              </div>
            </div>
          </div>
        ) : victoryState ? (
          /* Epic Victory Finale Screen */
          <div id="victory-view" className="w-full max-w-3xl bg-slate-900/85 border-2 border-amber-500/50 rounded-[3rem] p-8 md:p-12 text-center backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden animate-fadeIn">
            
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

            <span className="text-sm font-mono tracking-[0.3em] font-extrabold text-amber-400 uppercase bg-amber-500/10 px-5 py-2 rounded-full border border-amber-500/30">
              MISSION COMPLETED AWARD
            </span>

            <div className="text-10xl my-8 select-none filter drop-shadow-[0_20px_40px_rgba(245,158,11,0.4)] animate-pulse">
              👑
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-amber-305 font-sans tracking-tight">
              启蒙文明领航者
            </h2>
            
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              恭喜指挥官！你凭借卓越的理想、契约与理性精神重塑了飞船幸存者的秩序——不仅战胜了严酷的物质荒岛，更避开了家长制偏见、官僚死结与管制盲区。
            </p>

            {/* Final Achievements Recap */}
            <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl max-w-xl mx-auto text-left mt-8 space-y-4">
              <h3 className="font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Award className="w-5 h-5 text-amber-500" /> 解锁思想法典
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📜</span>
                  <div>
                    <strong className="text-slate-100 text-sm block">让-雅克·卢梭的《社会契约论》</strong>
                    <span className="text-xs text-slate-400">“每个人都毫无保留地将自身奉献给公意，由于奉献是同等的，反而无人感到隶属于他人。”</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚖️</span>
                  <div>
                    <strong className="text-slate-100 text-sm block">孟德斯鸠的《论法的精神》</strong>
                    <span className="text-xs text-slate-400">“立法权当归属于全民，司法裁驳则不容依附任何私利，三权相倚平衡，人身之自由方不危殆。”</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">💰</span>
                  <div>
                    <strong className="text-slate-100 text-sm block">亚当·斯密的《国富论》</strong>
                    <span className="text-xs text-slate-400">“自由价格如同一盏万古明灯。引导私心者自发地为同伴奉献最高的水准，繁盛随之诞生。”</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4 justify-center">
              <button
                id="btn-restart-epic"
                onClick={startMission}
                className="bg-amber-550 hover:bg-amber-600 text-slate-950 font-black text-lg px-10 py-4 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
              >
                重新开始史诗征服
              </button>
              <button
                id="btn-back-home"
                onClick={resetEverything}
                className="bg-slate-800 hover:bg-slate-700 text-white font-black text-lg px-10 py-4 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                返回大厅
              </button>
            </div>
          </div>
        ) : (
          /* Active Gameplay Screen */
          <div id="gameplay-core-panel" className="w-full max-w-4xl bg-slate-900/60 border border-slate-800/80 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl relative flex flex-col">
            
            {/* Visual Portal Display Area */}
            <div 
              className="relative h-64 flex flex-col justify-center items-center overflow-hidden transition-all duration-700"
              style={{ background: currentLevel.bg }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
              
              {/* Giant Responsive Emoji */}
              <div className="relative z-10 text-[7rem] md:text-[8rem] select-none filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform cursor-grab">
                {currentLevel.emoji}
              </div>

              {/* Mission label */}
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-slate-950/70 py-1.5 px-3 rounded-full border border-slate-800 text-xs font-mono tracking-widest text-indigo-400">
                <BrainCircuit className="w-3.5 h-3.5 shrink-0" />
                <span>{currentLevel.tag}</span>
              </div>
            </div>

            {/* Text & options contents box */}
            <div className="p-8 md:p-10">
              
              <div className="mb-6">
                <span className="text-sm font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 uppercase tracking-widest inline-block mb-3">
                  理想考验 0{currentLevel.id} / 0{LEVELS_DATA.length}
                </span>
                <h3 id="current-title" className="text-3xl md:text-4xl font-black text-white leading-tight">
                  {currentLevel.title}
                </h3>
              </div>

              <p id="current-desc" className="text-base md:text-lg text-slate-300 leading-relaxed font-normal bg-slate-950/40 p-5 rounded-2xl border border-slate-805/40 mb-8">
                {currentLevel.description}
              </p>

              {/* Options lists panel */}
              <div id="options-stack" className="space-y-4">
                {currentLevel.options.map((opt, oIdx) => {
                  const isHovered = hoveredOptionIdx === oIdx;
                  return (
                    <button
                      key={oIdx}
                      id={`option-btn-${oIdx}`}
                      onClick={() => selectOption(opt)}
                      onMouseEnter={() => {
                        setHoveredOptionIdx(oIdx);
                        handleOptionHover();
                      }}
                      onMouseLeave={() => setHoveredOptionIdx(null)}
                      className={`w-full text-left p-5 md:p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                        isHovered 
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.06)] translate-y-[-2px]' 
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      {/* Option Index Badge */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0 border ${
                        isHovered 
                          ? 'bg-indigo-500 text-white border-indigo-400' 
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </div>

                      <div className="flex-1">
                        <p className={`font-medium transition-colors text-base md:text-lg ${
                          isHovered ? 'text-white' : 'text-slate-200'
                        }`}>
                          {opt.text}
                        </p>
                      </div>

                      <ArrowRight className={`w-4 h-4 mt-1.5 transition-all ${
                        isHovered ? 'text-indigo-400 translate-x-1 opacity-100' : 'text-slate-600 opacity-60'
                      }`} />
                    </button>
                  );
                })}
              </div>

            </div>

            {/* FEEDBACK OVERLAY PORTAL (Elegant absolute screen blockade within wrapper) */}
            {activeOverlay?.show && (
              <div id="feedback-overlay" className="absolute inset-0 bg-slate-950/98 z-30 flex flex-col justify-center items-center p-6 md:p-10 text-center animate-fadeIn">
                <div className="max-w-2xl mx-auto space-y-6">
                
                  {/* Status Indicator */}
                  <div className="flex justify-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg border ${
                      activeOverlay.result === "success"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse"
                        : "bg-rose-500/25 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    }`}>
                      {activeOverlay.result === "success" ? "✨" : "⚠️"}
                    </div>
                  </div>

                  <h3 className={`text-3xl md:text-4xl font-black ${
                    activeOverlay.result === "success" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {activeOverlay.title}
                  </h3>

                  {/* Body description */}
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-left">
                    <p className="text-slate-200 text-base md:text-lg leading-relaxed font-sans font-medium">
                      {activeOverlay.body}
                    </p>
                  </div>

                  {/* Philosophic context card */}
                  <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/40 text-left max-w-xl mx-auto">
                    <div className="flex items-center gap-2 text-sm font-mono font-bold text-slate-400 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>理智之魂: {activeOverlay.philosopher}</span>
                    </div>
                    <div className="text-indigo-400 font-bold text-base md:text-lg tracking-wide mb-1.5 uppercase">
                      对应学说思想: {activeOverlay.concept}
                    </div>
                    {activeOverlay.quotes && (
                      <em className="text-slate-400 text-base md:text-lg pl-3 border-l border-indigo-500/40 block italic font-serif leading-relaxed mt-1">
                        {activeOverlay.quotes}
                      </em>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex justify-center">
                    <button
                      id="feedback-action-btn"
                      onClick={handleNextStep}
                      onMouseEnter={() => synth.playHover()}
                      className={`px-10 py-4 rounded-xl text-lg font-black tracking-wider cursor-pointer shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                        activeOverlay.result === "success"
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
                          : "bg-slate-800 hover:bg-slate-700 text-white hover:text-slate-100 hover:shadow-[0_8px_20px_rgba(30,41,59,0.3)]"
                      }`}
                    >
                      {activeOverlay.result === "success" 
                        ? (currentLevelIdx === LEVELS_DATA.length - 1 ? "完成考验，破茧成蝶 🌟" : "开启下一段思想磨炼 ➔") 
                        : "⏳ 触发时间回溯，重新睿智严判"}
                    </button>
                  </div>

                </div>
              </div>
            )}
            
          </div>
        )}

      </main>

      {/* Persistent Bottom Controllers: Integrated Sound Center */}
      <footer className="mt-8 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-5 z-20">
        <div className="max-w-4xl mx-auto">
          <AudioControlPanel />
          <div className="text-center mt-3 text-[10px] font-mono text-slate-500 tracking-wider">
            理想号 3.0 CLI SENSORS • AI DECK ACTIVE • UTC: 2026 • AUTHORIZED PLAYBACK ONLY
          </div>
        </div>
      </footer>

    </div>
  );
}
