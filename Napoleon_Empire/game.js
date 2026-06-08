let groups = [];
let currentGroup = 0;
let apiKey = '';
let selectedModel = '';
let bgmAudio = null;

function toggleModal(show) {
    document.getElementById('guide-modal').style.display = show ? 'flex' : 'none';
}

function showToast(msg) {
    const toast = document.getElementById('custom-toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

function showPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

async function detectModels() {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) { showToast("请输入API Key"); return; }
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        const models = data.models.filter(m => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'));
        const sel = document.getElementById('model-select');
        sel.innerHTML = '';
        models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name.replace('models/', '');
            opt.textContent = m.displayName || m.name;
            sel.appendChild(opt);
        });
        sel.style.display = 'block';
        apiKey = key;
        showToast("模型加载成功！");
    } catch (e) {
        showToast("检测失败，请检查网络或Key");
    }
}

function initAll() {
    const sel = document.getElementById('model-select');
    if (sel.style.display === 'block') {
        selectedModel = sel.value;
    }
    initAudio();
    showPanel('p-setup');
}

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
            state: { army: 100, morale: 100, wealth: 50, order: 50, alliance: 0, dev: 0 },
            done: false
        });
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
    if (allDone) {
        list.innerHTML += `<h3 style="color:#c9a44c; margin-top:30px;">全部玩家已完成历史扮演！</h3>`;
    }
}

function updateStatBar(g) {
    document.getElementById('show-gname').textContent = g.name;
    document.getElementById('show-stat').textContent = `兵力:${g.state.army} 历史偏离度:${g.state.dev}`;
}

function startGame(idx) {
    currentGroup = idx;
    showPanel('p-game');
    document.getElementById('ai-chat-area').style.display = 'none';
    document.getElementById('end-btn').style.display = 'none';
    renderNode();
}

function renderNode() {
    const g = groups[currentGroup];
    const node = script[g.node];
    updateStatBar(g);
    
    document.getElementById('scene-img-area').innerHTML = node.img ? `<img src="${node.img}" style="max-width:100%; height:200px; border-radius:10px; border:2px solid #c9a44c;">` : '';
    document.getElementById('story-text').innerHTML = node.text;
    
    speakText(node.text);
    
    const ca = document.getElementById('choices-area');
    ca.innerHTML = '';
    
    if (node.choices) {
        node.choices.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'sys-btn';
            btn.textContent = c.text;
            btn.onclick = () => {
                if (c.effect) {
                    for (let k in c.effect) g.state[k] += c.effect[k];
                }
                g.node = c.target;
                renderNode();
            };
            ca.appendChild(btn);
        });
    } else if (node.ai_eval) {
        if (apiKey && selectedModel) {
            startAIEval();
        } else {
            const btn = document.createElement('button');
            btn.className = 'sys-btn';
            btn.textContent = "结束剧情 (未配置API)";
            btn.onclick = () => { g.done = true; document.getElementById('end-btn').style.display = 'block'; };
            ca.appendChild(btn);
        }
    } else if (node.end) {
        g.done = true;
        document.getElementById('end-btn').style.display = 'block';
    }
}

function startAIEval() {
    document.getElementById('ai-chat-area').style.display = 'flex';
    document.getElementById('chat-history').innerHTML = `<p style="color:#c9a44c;">历史学家正在评估你的选择...</p>`;
    requestAIEval();
}

async function requestAIEval() {
    const g = groups[currentGroup];
    const node = script[g.node];
    const role = node.ai_role || "officer";
    const dev = g.state.dev;
    
    // 动态难度设定
    let difficultyContext = "";
    if (dev <= 20) {
        difficultyContext = "【简单难度】由于该玩家之前的选择非常符合历史，你对他充满好感和信任。只要他的发言有一点点合理，你就会被说服。";
    } else if (dev <= 60) {
        difficultyContext = "【困难难度】由于该玩家之前的选择偏离了历史，你对他充满怀疑和防备。你需要他给出非常完美的逻辑和辞藻，才能赢得你的认可。";
    } else {
        difficultyContext = "【地狱难度】该玩家之前的选择完全违背了历史事实，导致了灾难！你对他充满敌意和愤怒。你一开始就打算处死或流放他，除非他能给出极其天才的历史逆转思路。";
    }

    let roleContext = "";
    if (role === "officer") {
        roleContext = `你现在是面临退位绝境的拿破仑。联军兵临城下。你要对你的军官（玩家）进行终局审判。决定是带着他决一死战，还是将他流放。`;
    } else if (role === "judge") {
        roleContext = `你现在是维也纳会议上的保守派巨头（如梅特涅）。你要审判这位法国大革命的内政官员（玩家），决定是否彻底废除《拿破仑法典》。`;
    } else {
        roleContext = `你现在是大国君主（如沙皇亚历山大）。你要面对这位企图争取民族独立的起义军领袖（玩家），决定是赐予他们独立，还是彻底镇压。`;
    }

    const sysPrompt = `${roleContext}
现在有一位名为 [${g.name}] 的学生正在与你对话。
该学生的历史偏离度为：${dev}。
${difficultyContext}

请根据他的历史偏离度和他在下方输入框中的发言，用严厉、充满戏剧性的中文回复他（100字左右）。
最后必须明确给出他的最终命运（例如：【结局：法治之光长存】或【结局：帝国的陪葬品】）。`;
    
    // 开启聊天输入
    document.getElementById('ai-chat-area').style.display = 'flex';
    document.getElementById('chat-history').innerHTML = `<p style="color:#c9a44c;"><b>系统：</b><br>历史的终局已至。<br>当前你的历史偏离度为 ${dev}。<br>请在下方输入框中，用尽全力为自己的命运辩护吧！</p>`;
    
    // 绑定发送按钮事件
    window.currentSysPrompt = sysPrompt;
}

async function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    
    const g = groups[currentGroup];
    input.value = '';
    
    const history = document.getElementById('chat-history');
    history.innerHTML += `<p style="color:#fff;"><b>你：</b><br>${msg}</p>`;
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ 
                system_instruction: { parts: [{ text: window.currentSysPrompt }] },
                contents: [{ role: 'user', parts: [{ text: msg }] }] 
            })
        });
        const data = await res.json();
        const reply = data.candidates[0].content.parts[0].text;
        history.innerHTML += `<p style="color:#f4ecd8;"><b>AI 判决：</b><br>${reply}</p>`;
        speakText(reply);
        
        // 发言一次后即结束当前玩家的游戏
        document.getElementById('chat-input').disabled = true;
        g.done = true;
        document.getElementById('end-btn').style.display = 'block';
        history.scrollTop = history.scrollHeight;
    } catch (e) {
        history.innerHTML += `<p style="color:red;">AI评估请求失败。</p>`;
        g.done = true;
        document.getElementById('end-btn').style.display = 'block';
    }
}

function returnToMenu() {
    renderMenu();
    showPanel('p-menu');
}

function speakText(txt) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const vol = parseFloat(document.getElementById('vol-speech').value);
    if (vol === 0) return;
    const u = new SpeechSynthesisUtterance(txt.replace(/<[^>]+>/g, ''));
    u.lang = 'zh-CN';
    u.volume = vol;
    window.speechSynthesis.speak(u);
}

function initAudio() {
    if (bgmAudio) return;
    
    // 使用真实的古典音乐：柴可夫斯基《1812序曲》（维基共享资源公有领域音频）
    bgmAudio = new Audio('https://upload.wikimedia.org/wikipedia/commons/b/b5/1812_Overture.ogg');
    bgmAudio.loop = true;
    bgmAudio.volume = parseFloat(document.getElementById('vol-drum').value);
    
    bgmAudio.play().catch(e => console.log("浏览器限制了自动播放，需用户交互后恢复"));
    
    document.getElementById('vol-drum').addEventListener('input', (e) => {
        if(bgmAudio) bgmAudio.volume = parseFloat(e.target.value);
    });
}