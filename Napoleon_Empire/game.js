let groups = [];
let currentGroup = 0;
let selectedModel = 'gemini-2.0-flash';
let bgmAudio = null;
let audioCtx = null;
let currentSysPrompt = '';

let customApiKey = 'worker'; // Worker 模式，无需手动输入 Key

// 【核心设定：保留原有 API 链接】
const WORKER_URL = 'https://napoleon-ai.chewyenhan.workers.dev';

// UI Navigation
function showPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function initAll() {
    detectModels();
    initAudio();
    showPanel('p-setup');
}

// Player Management
function goNaming() {
    const c = parseInt(document.getElementById('g-count').value);
    const cont = document.getElementById('name-container');
    cont.innerHTML = '';
    for (let i = 0; i < c; i++) {
        cont.innerHTML += `<input type="text" id="gname-${i}" class="group-input" placeholder="玩家 ${i+1}" style="margin: 10px;">`;
    }
    showPanel('p-naming');
}

function saveGroups() {
    const c = parseInt(document.getElementById('g-count').value);
    groups = [];
    for (let i = 0; i < c; i++) {
        const val = document.getElementById(`gname-${i}`).value || `玩家 ${i+1}`;
        groups.push({ 
            name: val, 
            node: "START", 
            state: { 
                army: 100, morale: 100, wealth: 50, order: 50, alliance: 0, 
                dev: 0, score: 0, chatTurns: 0, ending: "", endingVerdict: 'failure', lastChoice: ""
            }, 
            done: false 
        });
    }
    renderMenu();
    showPanel('p-menu');
}

function renderMenu() {
    const list = document.getElementById('group-list');
    list.innerHTML = '';
    groups.forEach((g, idx) => {
        const btn = document.createElement('button');
        btn.className = 'sys-btn';
        btn.style.background = g.done ? '#4a2e15' : '#8b1c1c';
        btn.textContent = `${g.name} ${g.done ? '(已完成)' : '进入时代'}`;
        btn.onclick = () => { if (!g.done) startGame(idx); };
        list.appendChild(btn);
    });
    document.getElementById('leaderboard-btn').style.display = groups.length > 0 ? 'block' : 'none';
}

function startGame(idx) {
    currentGroup = idx;
    showPanel('p-game');
    renderNode();
}

function returnToMenu() {
    renderMenu();
    showPanel('p-menu');
}

// Rendering Logic
function renderNode() {
    const g = groups[currentGroup];
    const node = script[g.node];
    updateStatBar(g);

    document.getElementById('view-ending-btn').style.display = 'none';
    document.getElementById('chat-input-area').style.display = 'flex';
    document.getElementById('ai-chat-area').style.display = 'none';

    const storyText = document.getElementById('story-text');
    storyText.style.backgroundImage = node.img ? `url(${node.img})` : '';
    storyText.innerHTML = `<div>${node.text}</div>`;
    speakText(node.text);
    
    const ca = document.getElementById('choices-area');
    ca.innerHTML = '';
    
    if (node.choices) {
        node.choices.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'sys-btn';
            btn.textContent = c.text;
            btn.onclick = () => {
                g.state.lastChoice = c.text; // 记录最后抉择
                if (c.effect) {
                    let msg = "";
                    const map = { army: "军队", morale: "士气", wealth: "财富", order: "秩序", alliance: "同盟", dev: "偏离", score: "分" };
                    Object.keys(c.effect).forEach(k => {
                        if (g.state.hasOwnProperty(k)) {
                            g.state[k] += c.effect[k];
                            if(c.effect[k] !== 0) msg += `${map[k]}${c.effect[k]>0?'+':''}${c.effect[k]} `;
                        }
                    });
                    if(msg) showToast(msg);
                }
                g.node = c.target;
                renderNode();
            };
            ca.appendChild(btn);
        });
    } else if (node.ai_eval) {
        requestAIEval();
    }
}

function updateStatBar(g) {
    document.getElementById('show-gname').textContent = g.name;
    const dynamicStats = ['stat-army', 'stat-morale', 'stat-wealth', 'stat-order', 'stat-alliance'];
    dynamicStats.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 军官显军队，法官显财富/秩序，同盟显士气/同盟
    if (g.node.startsWith('officer')) {
        showStat('stat-army', 'show-army', g.state.army);
    } else if (g.node.startsWith('judge')) {
        showStat('stat-wealth', 'show-wealth', g.state.wealth);
        showStat('stat-order', 'show-order', g.state.order);
    } else if (g.node.startsWith('coalition')) {
        showStat('stat-morale', 'show-morale', g.state.morale);
        showStat('stat-alliance', 'show-alliance', g.state.alliance);
    }

    document.getElementById('show-dev').textContent = g.state.dev;
    document.getElementById('show-score').textContent = g.state.score;
    document.getElementById('show-dev').style.color = g.state.dev > 50 ? '#ff4444' : '#c9a44c';
}

function showStat(pId, sId, val) {
    const p = document.getElementById(pId);
    const s = document.getElementById(sId);
    if (p && s) {
        p.style.display = 'block';
        s.textContent = Math.max(0, val);
    }
}

// AI Interaction (Unified logic with original fetch structure)
function requestAIEval() {
    const g = groups[currentGroup];
    const s = g.state;
    let roleName = "", roleDesc = "", winCrit = "", playerIdentity = "";

    if (script[g.node].ai_role === "officer") {
        roleName = "威灵顿公爵";
        playerIdentity = "你是法兰西第一帝国的高级军官（法国人）。";
        if (s.lastChoice.includes('拒绝回归')) {
            roleDesc = "你拒绝了百日王朝回归，但作为曾经追随拿破仑的法军将领，你正面对威灵顿的政治审查。";
            winCrit = "你必须证明你拒绝回归是出于对和平的理性和对法兰西未来的责任感，而非单纯的背叛或恐惧。";
        } else {
            roleDesc = "你是滑铁卢战败被俘的法军死硬派将领，正站在联军统帅面前。";
            winCrit = "你必须通过展现职业军人的荣誉、对国家的热爱以及在战争中对文明底线的坚守（如不虐待俘虏等）来赢得尊重。";
        }
    } else if (script[g.node].ai_role === "judge") {
        roleName = "梅特涅";
        playerIdentity = "你是法兰西帝国的内政官员，负责法典与秩序。";
        roleDesc = "你在维也纳会议面对极端仇视革命的保守派巨头梅特涅。";
        winCrit = s.lastChoice.includes('保护') ? "说服他《民法典》是稳定欧洲秩序的基石，而非动乱之源。" : "证明你的行政才华是恢复波旁王朝统治不可或缺的工具。";
    } else {
        roleName = "亚历山大一世";
        playerIdentity = "你是被法军占领区的民族独立运动领袖（非法国人，追求自由）。";
        roleDesc = "你在冬宫面对自诩为'欧洲救世主'的俄国沙皇。";
        winCrit = s.lastChoice.includes('完全独立') ? "用你人民的巨大牺牲和民族自决的正义性，迫使沙皇承认你们的独立权。" : "在确保民族生存的前提下进行务实外交，争取最大程度的自治。";
    }

    g.currentRoleName = roleName;
    let diff = s.dev <= 20 ? "【简单难度】" : s.dev <= 60 ? "【困难难度】" : "【地狱难度】";
    
    currentSysPrompt = `你是历史人物${roleName}。
    【背景】：${roleDesc}
    【玩家身份】：${playerIdentity}
    【玩家状态】：军队${s.army}, 财富${s.wealth}, 士气${s.morale}, 历史偏离度${s.dev}。${diff}
    
    【核心判定逻辑】：
    1. 严禁改变玩家的国籍和基本立场！
    2. 只有当玩家表现出符合其身份的高尚品德（如军官的荣誉、民族斗士的骨气、法官对法律的坚守）时，才可判定为 [verdict:success]。
    3. 如果玩家表现出卑微乞怜（如当狗、求饶）、反人类暴行、或完全背弃其支线的初衷，必须判定为 [verdict:failure]！
    4. 胜利条件：${winCrit}。
    
    请根据以上逻辑回复（50字内），第3次发言给出【结局：XXX】及 [verdict:success/failure] 标签。`;
    
    document.getElementById('ai-chat-area').style.display = 'flex';
    document.getElementById('chat-history').innerHTML = `<p style="color:#c9a44c;">历史终局已至，你面对<b>${roleName}</b>。开始陈述！</p>`;
    document.getElementById('chat-input').disabled = false;
    document.getElementById('chat-input-area').style.display = 'flex';
    document.getElementById('chat-input').focus();
}

async function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim(); if (!msg) return;
    const g = groups[currentGroup];
    input.value = ''; g.state.chatTurns++;
    const history = document.getElementById('chat-history');
    history.innerHTML += `<p style="color:#fff;"><b>你 (${g.state.chatTurns}/3)：</b><br>${msg}</p>`;
    history.scrollTop = history.scrollHeight;

    const model = document.getElementById('model-select').value || selectedModel;
    let turnPrompt = g.state.chatTurns < 3 ? `这是第 ${g.state.chatTurns} 次发言。请追问或驳斥他。` : `这是最后一次发言。请给出最终判决。`;
    
    input.disabled = true;
    history.innerHTML += `<p style="color:#c9a44c;" id="ai-thinking"><i>...</i></p>`;
    
    try {
        const res = await fetch(`${WORKER_URL}/gemini`, {
            method: 'POST', 
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ 
                model: model,
                system_instruction: { parts: [{ text: currentSysPrompt }] }, 
                contents: [{ role: 'user', parts: [{ text: `玩家发言是：“${msg}”。${turnPrompt}` }] }] 
            })
        });
        const data = await res.json();
        const reply = data.candidates[0].content.parts[0].text;
        document.getElementById('ai-thinking').remove();
        
        const roleName = g.currentRoleName || "对方";

        if (g.state.chatTurns >= 3) {
            const verdictMatch = reply.match(/\[verdict:(success|failure)\]/);
            g.endingVerdict = verdictMatch ? verdictMatch[1] : 'failure';
            g.ending = reply.replace(/\[verdict:(success|failure)\]/, '').trim();
            history.innerHTML += `<p style="color:#f4ecd8;"><b>${roleName}：</b><br>${g.ending}</p>`;
            document.getElementById('chat-input-area').style.display = 'none';
            document.getElementById('view-ending-btn').style.display = 'block';
        } else {
            history.innerHTML += `<p style="color:#f4ecd8;"><b>${roleName}：</b><br>${reply}</p>`;
            input.disabled = false; input.focus();
        }
        speakText(reply);
    } catch (e) {
        document.getElementById('ai-thinking').remove();
        history.innerHTML += `<p style="color:red;">AI请求失败，请检查网络或刷新重试。</p>`;
        g.ending = "AI 请求失败。";
        document.getElementById('view-ending-btn').style.display = 'block';
    }
}

function showEnding() {
    const g = groups[currentGroup];
    const isSuccess = g.endingVerdict === 'success';
    let finalScore = g.state.score;
    if (isSuccess) finalScore += 50;
    const penalty = Math.floor(g.state.dev * 0.2);
    g.state.score = Math.max(0, finalScore - penalty);
    g.done = true;

    showPanel('p-ending');
    const content = document.getElementById('ending-content');
    content.innerHTML = `
        <h1 style="color:var(--accent-color); font-size: 3.5em;">最终成绩：${g.state.score} 分</h1>
        <div class="final-ending-text">${g.ending.replace(/\n/g, '<br>')}</div>
    `;
    playEndingSound(isSuccess);
}

function showLeaderboard() {
    const content = document.getElementById('leaderboard-content');
    content.innerHTML = '';
    groups.sort((a, b) => b.state.score - a.state.score);
    groups.forEach((g, index) => {
        const entry = document.createElement('div');
        entry.style.cssText = "background:var(--panel-bg);border:1px solid var(--accent-color);border-radius:8px;padding:15px;margin-bottom:10px;";
        entry.innerHTML = `<h3 style="color:var(--accent-color);">第 ${index + 1} 名 ${g.name} - 总分: ${g.state.score}</h3><hr><p>${g.ending}</p>`;
        content.appendChild(entry);
    });
    showPanel('p-leaderboard');
}

function toggleModal(show) { document.getElementById('guide-modal').style.display = show ? 'flex' : 'none'; }
function showToast(msg) { const t = document.getElementById('custom-toast'); t.textContent = msg; t.style.display = 'block'; setTimeout(() => { t.style.display = 'none'; }, 2000); }

// Audio Utilities
function playEndingSound(isSuccess) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (isSuccess) { osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(783.99, audioCtx.currentTime + 1); } 
    else { osc.type = 'sine'; osc.frequency.setValueAtTime(120, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 1); }
    osc.start(); osc.stop(audioCtx.currentTime + 1);
}

function playUISound(type) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    if (type === 'hover') { osc.frequency.setValueAtTime(800, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); }
    else { osc.frequency.setValueAtTime(400, audioCtx.currentTime); gain.gain.setValueAtTime(0.2, audioCtx.currentTime); }
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

function speakText(txt) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const vol = parseFloat(document.getElementById('vol-speech').value);
    if (vol === 0) return;
    const cleanText = txt.replace(/<[^>]+>/g, '').replace(/【.*?】/g, '').trim();
    const u = new SpeechSynthesisUtterance(cleanText); u.lang = 'zh-CN'; u.volume = vol;
    setTimeout(() => window.speechSynthesis.speak(u), 50);
}

function initAudio() {
    if (bgmAudio) return;
    bgmAudio = new Audio('assets/1812_overture.ogg'); bgmAudio.loop = true;
    bgmAudio.volume = parseFloat(document.getElementById('vol-drum').value);
    bgmAudio.play().catch(e => console.log("Blocked"));
    document.getElementById('vol-drum').oninput = (e) => bgmAudio.volume = parseFloat(e.target.value);
    document.addEventListener('mouseover', (e) => { if(e.target.classList.contains('sys-btn') || e.target.tagName === 'INPUT') playUISound('hover'); });
    document.addEventListener('click', (e) => { if(e.target.classList.contains('sys-btn') || e.target.tagName === 'INPUT') playUISound('click'); });
}

// Model Detection
async function detectModels() {
    const sel = document.getElementById('model-select');
    const status = document.getElementById('model-status');
    try {
        const res = await fetch(`${WORKER_URL}/models`);
        const data = await res.json();
        sel.innerHTML = '';
        if (data.models) {
            data.models.forEach(m => { 
                const opt = document.createElement('option'); 
                opt.value = m.name.replace('models/', ''); 
                opt.textContent = m.displayName || m.name; 
                sel.appendChild(opt); 
            });
            if (status) status.innerText = "✅ AI 服务连接成功";
            sel.style.display = 'block';
        }
    } catch (e) {
        if (status) status.innerText = "⚠️ 使用内置线路";
        ['gemini-2.0-flash', 'gemini-1.5-pro'].forEach(m => {
            const opt = document.createElement('option'); opt.value = m; opt.textContent = m; sel.appendChild(opt);
        });
        sel.style.display = 'block';
    }
}

// 初始化
detectModels();