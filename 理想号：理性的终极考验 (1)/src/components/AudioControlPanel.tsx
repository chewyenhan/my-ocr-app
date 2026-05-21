import React, { useState, useEffect, useRef } from "react";
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  HelpCircle, 
  Sparkles, 
  FolderOpen, 
  Music,
  Disc,
  Volume1
} from "lucide-react";
import { synth } from "../utils/audioSynth";

// Define some cool copyright-free synthesizer loops for direct play in the simulator
const DEFAULTS_BGM = [
  {
    id: "ambient-1",
    name: "太空漫步 Galactic Horizon (Synth Loop)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
  },
  {
    id: "ambient-2",
    name: "理性彼岸 Chronos Orbit (Relax Ambient)",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
  {
    id: "ambient-3",
    name: "文明火种 Sparks of Enlightenment",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  }
];

interface AudioControlPanelProps {
  onVolumeChange?: (v: number) => void;
}

export const AudioControlPanel: React.FC<AudioControlPanelProps> = ({ onVolumeChange }) => {
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem("game-volume");
    return saved !== null ? parseFloat(saved) : 0.4;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedTrackUrl, setSelectedTrackUrl] = useState<string>(DEFAULTS_BGM[0].url);
  const [trackName, setTrackName] = useState<string>(DEFAULTS_BGM[0].name);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showHelper, setShowHelper] = useState<boolean>(false);
  const [customPathText, setCustomPathText] = useState<string>("C:\\Users\\User\\Desktop\\AIgames\\my_game\\assets\\audio");
  const [customFileSelected, setCustomFileSelected] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previousVolume = useRef<number>(volume);

  // Initialize and keep audio volume synchronized
  useEffect(() => {
    // Sync initial synthesizer volume
    synth.setVolume(isMuted ? 0 : volume);
    
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    
    if (onVolumeChange) {
      onVolumeChange(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  // Handle play/pause toggle
  const togglePlay = () => {
    synth.playClick();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.warn("Autoplay was prevented. Click again to play.", err);
          // Try to trigger with user interaction
          audioRef.current?.play();
          setIsPlaying(true);
        });
    }
  };

  // Change BGM Track source
  const changeTrack = (url: string, name: string, isCustom = false) => {
    synth.playClick();
    setTrackName(name);
    setSelectedTrackUrl(url);
    setCustomFileSelected(isCustom);
    
    if (audioRef.current) {
      audioRef.current.src = url;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  };

  // Handle custom file upload (highly secure browser alternative)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      changeTrack(objectUrl, `📂 本地: ${file.name}`, true);
      // Automatically play when file is imported
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }, 100);
    }
  };

  // Switch sound mute status
  const toggleMute = () => {
    synth.playClick();
    if (isMuted) {
      setIsMuted(false);
      synth.setVolume(volume);
    } else {
      setIsMuted(true);
      synth.setVolume(0);
    }
  };

  // Real-time slider volume adjustments
  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    localStorage.setItem("game-volume", val.toString());
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Helper tips trigger click SFX
  const toggleHelp = () => {
    synth.playClick();
    setShowHelper(!showHelper);
  };

  return (
    <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 shadow-2xl text-slate-100 max-w-full overflow-hidden shrink-0">
      
      {/* Invisible HTML5 Audio back-end */}
      <audio 
        ref={audioRef} 
        src={selectedTrackUrl} 
        loop 
        preload="auto"
      />

      {/* Title with soundwave logo */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
            <Music className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <span className="text-xs font-mono tracking-widest text-indigo-400 font-semibold block">SOUND SYSTEM</span>
            <span className="text-sm font-bold text-slate-250 font-sans">音效与原声音乐控制台</span>
          </div>
        </div>
        
        <button 
          onClick={toggleHelp} 
          title="使用说明"
          className="p-1 px-2.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-slate-200 transition-all font-mono text-xs flex items-center gap-1 cursor-pointer border border-slate-700/40"
        >
          <HelpCircle className="w-3.5 h-3.5" /> 说明
        </button>
      </div>

      {/* Main Row: Control Buttons and Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* Playback Controls */}
        <div className="md:col-span-4 flex items-center gap-3">
          <button
            onClick={togglePlay}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.35)]' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(99,102,241,0.35)]'
            }`}
            title={isPlaying ? "暂停音乐" : "播放音乐"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-slate-950 font-bold" />
            ) : (
              <Play className="w-5 h-5 text-white translate-x-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Disc className={`w-3.5 h-3.5 text-indigo-400 shrink-0 ${isPlaying ? 'animate-spin' : ''}`} />
              <span className="text-xs font-mono font-semibold text-slate-400 truncate">当前选定：</span>
            </div>
            <div className="text-sm text-slate-100 font-medium truncate font-sans" title={trackName}>
              {trackName}
            </div>
          </div>
        </div>

        {/* Volume management */}
        <div className="md:col-span-4 flex items-center gap-3.5 bg-slate-950/40 px-4 py-3 rounded-2xl border border-slate-800/60">
          <button 
            onClick={toggleMute}
            className="text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            title={isMuted ? "取消静音" : "静音"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-500" />
            ) : volume < 0.35 ? (
              <Volume1 className="w-5 h-5 text-indigo-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </button>
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-slate-500">
              <span>音量音效</span>
              <span className="font-bold text-slate-300">{isMuted ? "MUTE" : `${Math.round(volume * 100)}%`}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume} 
              onChange={handleVolumeSlider}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors"
            />
          </div>
        </div>

        {/* Local music connector */}
        <div className="md:col-span-4 flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              synth.playClick();
              fileInputRef.current?.click();
            }}
            className="flex-1 bg-slate-800 hover:bg-slate-700/90 text-slate-200 border border-slate-700/60 px-3.5 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>导入本地音频文件</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="audio/*" 
            className="hidden" 
          />
        </div>

      </div>

      {/* Preset tracks & helper dashboard */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mr-1">预设音轨 Presets:</span>
          {DEFAULTS_BGM.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTrack(t.url, t.name)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all cursor-pointer ${
                selectedTrackUrl === t.url && !customFileSelected
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm"
                  : "bg-slate-800/50 hover:bg-slate-800 text-slate-400 border-transparent hover:text-slate-300"
              }`}
            >
              {t.id === "ambient-1" ? "🪐 轨道" : t.id === "ambient-2" ? "⚖️ 理性" : "🔥 火种"}
            </button>
          ))}
        </div>

        {/* Beautiful soundwave graphics simulation based on playing status */}
        {isPlaying && (
          <div className="flex justify-between items-end h-5 gap-[3px] bg-slate-950/25 px-5 py-1.5 rounded-xl border border-slate-900">
            {Array.from({ length: 32 }).map((_, i) => {
              // Creating a simulated responsive visualizer stream using animation delays
              const randomDelay = Math.random() * 0.8;
              const randomHeight = 20 + Math.random() * 80;
              return (
                <div 
                  key={i}
                  className="bg-indigo-500/80 hover:bg-indigo-400 w-full rounded-t-sm transition-all"
                  style={{
                    height: `${isPlaying ? randomHeight : 10}%`,
                    animation: isPlaying ? `pulseHeight 1.2s ease-in-out infinite alternate` : 'none',
                    animationDelay: `${randomDelay}s`
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Informative helper explaining browser path security policies */}
      {showHelper && (
        <div className="mt-4 p-4 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs leading-relaxed text-slate-300 animate-fadeIn">
          <h4 className="font-bold text-slate-100 flex items-center gap-1.5 mb-2 font-sans text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            为什么不能自动播放电脑本地绝对路径？
          </h4>
          <p className="mb-2">
            出于**安全隐私保护限制**，现代浏览器禁止网页加载 `C:\Users\...` 这种您的本机绝度路径（报错: <code className="text-orange-400 bg-slate-900 px-1 py-0.5 rounded">Not allowed to load local resource</code>）。
          </p>
          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 mb-2 font-mono">
            <span className="text-slate-400 block font-semibold text-[10px]">💡 处理您本机的 BGM 音频：</span>
            <div className="text-slate-300 text-[11px] list-decimal list-inside space-y-1">
              <div>1. 点击右侧 **“导入本地音频文件”** 按钮。</div>
              <div>2. 浏览到 <span className="text-amber-300">{customPathText}</span>。</div>
              <div>3. 选中该目录下的音乐文件即可立即开始安全播放！</div>
            </div>
          </div>
          <p className="text-slate-400 text-[10px]">
            *提示: 系统已集成了高精度的 **Web Audio API 模拟音效发声器**，游戏原生的按键、答对、答错及通关音效一律由引擎实时生成，百分百离线可用，无需加载任何音频文件！
          </p>
        </div>
      )}

      {/* Styled animation keyframe support */}
      <style>{`
        @keyframes pulseHeight {
          0% { height: 15%; }
          100% { height: 100%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
