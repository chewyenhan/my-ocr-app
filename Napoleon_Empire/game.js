let groups = [];
let currentGroup = 0;
let apiKey = ''; // 兼容旧代码，Worker 模式下不需要
let selectedModel = 'gemini-2.0-flash';
let bgmAudio = null;
let audioCtx = null;
let currentSysPrompt = '';

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

// Player/Group Management
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
        groups.push({ name: val, node: "START", state: { army: 100, morale: 100, wealth: 50, order: 50, alliance: 0, dev: 0, chatTurns: 0, ending: "", score: 0, endingVerdict: 'failure' }, done: false });
    }
    renderMenu();
    showPanel('p-menu');
}

function renderMenu() {
    const list = document.getElementById('group-list');
    list.innerHTML = '';
    let allDone = true;
    groups.forEach((g, idx) => {
        if (!g.done) allDone = false;
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

// Game Node Rendering
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
                if (c.effect) Object.keys(c.effect).forEach(k => g.state[k] += c.effect[k]);
                g.node = c.target;
                renderNode();
            };
            ca.appendChild(btn);
        });
    } else if (node.ai_eval) {
        requestAIEval();
    }
}

// AI Interaction
function requestAIEval() {
    const g = groups[currentGroup];
    const dev = g.state.dev;
    let difficultyContext = dev <= 20 ? "【简单难度】你对他充满好感。" : dev <= 60 ? "【困难难度】你对他充满怀疑。" : "【地狱难度】你对他充满愤怒。";
    let roleContext = {
        "officer": "你是面临退位的拿破仑。",
        "judge": "你是维也纳会议的保守派巨头梅特涅。",
        "coalition": "你是决定民族命运的大国君主沙皇亚历山大。"
    }[script[g.node].ai_role];
    currentSysPrompt = `${roleContext} 学生的历史偏离度为：${dev}。${difficultyContext} 
    请根据他的发言，用50字内中文回复。
    当这是第三次（最后一次）发言时，你必须给出最终判决，判决需包含两部分：
    1. 面向学生的结局描述，格式为【结局：XXX】。
    2. 一个机器可读的分类标签，格式为 [verdict:success] 或 [verdict:failure]。
    示例：【结局：你捍卫了法治之光！】[verdict:success]`;
    
    document.getElementById('choices-area').innerHTML = '';
    document.getElementById('ai-chat-area').style.display = 'flex';
    document.getElementById('chat-history').innerHTML = `<p style="color:#c9a44c;"><b>系统：</b><br>历史的终局已至。你的历史偏离度为 ${dev}。你有三次发言机会，开始你的陈述！</p>`;
    document.getElementById('chat-input').disabled = false;
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

    // 实时读取用户选择的模型
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
        
        if (g.state.chatTurns >= 3) {
            const verdictMatch = reply.match(/\[verdict:(success|failure)\]/);
            g.endingVerdict = verdictMatch ? verdictMatch[1] : 'failure';
            g.ending = reply.replace(/\[verdict:(success|failure)\]/, '').trim();
            history.innerHTML += `<p style="color:#f4ecd8;"><b>AI 回应：</b><br>${g.ending}</p>`;
            document.getElementById('chat-input-area').style.display = 'none';
            document.getElementById('view-ending-btn').style.display = 'block';
        } else {
            history.innerHTML += `<p style="color:#f4ecd8;"><b>AI 回应：</b><br>${reply}</p>`;
            input.disabled = false; input.focus();
        }
        speakText(reply);
    } catch (e) {
        document.getElementById('ai-thinking').remove();
        history.innerHTML += `<p style="color:red;">AI请求失败。</p>`;
        g.ending = "AI 请求失败，无法获得结局。";
        document.getElementById('view-ending-btn').style.display = 'block';
    }
}

function showEnding() {
    const g = groups[currentGroup];
    const isSuccess = g.endingVerdict === 'success';
    
    if (isSuccess) {
        g.state.score += 50;
        showToast(`历史性的决策！分数 +50`);
    }

    g.done = true;
    showPanel('p-ending');
    const content = document.getElementById('ending-content');
    content.innerHTML = `<div class="final-ending-text">${g.ending.replace(/\n/g, '<br>')}</div>`;
    playEndingSound(isSuccess);
}

// Leaderboard & Utils
function showLeaderboard() {
    const content = document.getElementById('leaderboard-content');
    content.innerHTML = '';
    groups.sort((a, b) => b.state.score - a.state.score);
    groups.forEach((g, index) => {
        const entry = document.createElement('div');
        entry.style.cssText = "background:var(--panel-bg);border:1px solid var(--accent-color);border-radius:8px;padding:15px;margin-bottom:10px;";
        let endingHTML = g.done ? `<div class="final-ending-text" style="font-size: 1.8em;">${g.ending.replace(/\n/g, '<br>')}</div>` : `<p><i>尚未完成历史...</i></p>`;
        const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
        const rankText = index < 3 ? `第 ${index + 1} 名` : '';
        const rankColor = rankColors[index] || 'var(--accent-color)';
        entry.innerHTML = `
            <h3 style="color:${rankColor}; margin-top:0; font-size: 1.8em;">${rankText} ${g.name} - 总分: ${g.state.score}</h3>
            <p><b>最终属性:</b> 历史偏离度:<span style="color:${g.state.dev > 50 ? 'red' : '#0f0'};">${g.state.dev}</span></p>
            <hr style="border-color: var(--accent-color);">
            <b>AI 最终判决:</b>
            ${endingHTML}
        `;
        content.appendChild(entry);
    });
    showPanel('p-leaderboard');
}

function updateStatBar(g) {
    document.getElementById('show-gname').textContent = g.name;
    document.getElementById('show-stat').textContent = `历史偏离度: ${g.state.dev} | 分数: ${g.state.score}`;
}
function toggleModal(show) { document.getElementById('guide-modal').style.display = show ? 'flex' : 'none'; }
function showToast(msg) { const t = document.getElementById('custom-toast'); t.textContent = msg; t.style.display = 'block'; setTimeout(() => { t.style.display = 'none'; }, 2000); }

// Audio
function playEndingSound(isSuccess) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (isSuccess) { osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(783.99, audioCtx.currentTime + 1); } 
    else { osc.type = 'sine'; osc.frequency.setValueAtTime(120, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 1); }
    osc.start(); osc.stop(audioCtx.currentTime + 1);
}
function speakText(txt) { if (!window.speechSynthesis) return; window.speechSynthesis.cancel(); const vol = parseFloat(document.getElementById('vol-speech').value); if (vol === 0) return; const u = new SpeechSynthesisUtterance(txt.replace(/<[^>]+>/g, '').replace(/【.*?】/g, '')); u.lang = 'zh-CN'; u.volume = vol; window.speechSynthesis.speak(u); }
function initAudio() { if (bgmAudio) return; bgmAudio = new Audio('assets/1812_overture.ogg'); bgmAudio.loop = true; bgmAudio.volume = parseFloat(document.getElementById('vol-drum').value); bgmAudio.play().catch(e => console.log("Audio autoplay blocked by browser.")); document.getElementById('vol-drum').addEventListener('input', (e) => { if(bgmAudio) bgmAudio.volume = parseFloat(e.target.value); }); }

// API Detection
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
        }
        if (sel.options.length > 0) {
            sel.selectedIndex = 0;
            selectedModel = sel.value;
            if (status) status.innerText = "✅ AI 服务连接成功";
            sel.style.display = 'block';
        } else {
            throw new Error("No models returned");
        }
    } catch (e) { 
        console.warn("模型加载失败，使用默认列表", e);
        if (status) status.innerText = "⚠️ 自动连接失败，使用内置线路";
        sel.innerHTML = '';
        ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'].forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            sel.appendChild(opt);
        });
        sel.selectedIndex = 0;
        selectedModel = sel.value;
        sel.style.display = 'block';
    }
}