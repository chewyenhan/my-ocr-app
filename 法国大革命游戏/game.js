// ==========================================
// 1. 核心状态与初始化 (已同步所有 story.js 数值)
// ==========================================
const gameState = {
    role: '', 
    hunger: 50, 
    anger: 50,           // 愤怒值：影响 AI 的烦躁程度
    revolution: 20,      // 革命值：影响 AI 的恐慌程度
    royalAuthority: 80,  // 王权值：影响 AI 的傲慢程度
    publicSupport: 30,   // 声望值
    choiceHistory: []    // 关键选择记录，用于结局复盘
};

let customApiKey = ""; let gData = []; let cIdx = -1; let aiCnt = 0;
let speechVolume = 0.8;
let speakSeq = 0;

// ==========================================
// 2. 本地音乐与音效控制 (已修复滑条无效问题)
// ==========================================
function controlBGM(action = 'start') {
    const bgm = document.getElementById('bg-music');
    if (!bgm) return;
    
    if (action === 'start') {
        const sliderVal = document.getElementById('vol-drum').value;
        // 使用平方映射让低音量控制更细腻，并将上限限制在 30% 防止盖过人声
        bgm.volume = Math.pow(parseFloat(sliderVal), 2) * 0.3; 
        bgm.play().catch(e => console.log("等待激活"));
    } else {
        bgm.pause();
        bgm.currentTime = 0;
    }
}

// 实时监听滑块：解决调不动音量以及音量突变的问题
document.getElementById('vol-drum').addEventListener('input', function() {
    const bgm = document.getElementById('bg-music');
    if (bgm) {
        // 同步应用平方映射和上限限制
        bgm.volume = Math.pow(parseFloat(this.value), 2) * 0.3; 
    }
});

// ==========================================
// 2. 本地音效控制 (使用系统内置 Web Audio 生成音效)
// ==========================================
function playEffect() {
    const vol = document.getElementById('vol-drum').value;
    if (vol <= 0) return;
    
    // 使用内置合成器发出“滴”声，无需加载任何 wav/mp3 文件
    createBeep(vol);
}

// 新增：系统内置音效合成器 (不依赖外部文件)
function createBeep(volume) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // 设置音效特征
        oscillator.type = 'sine'; // 正弦波，声音较清脆
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 频率 800Hz
        gainNode.gain.setValueAtTime(volume * 0.2, audioCtx.currentTime); // 音量
        
        // 快速淡出，形成点击感
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1); // 持续 0.1 秒
    } catch (e) {
        console.log("Web Audio API 不支持或被拦截");
    }
}

// 语音：实时音量 + 防止“连点下一步”导致音量异常
function speak(txt) {
    const slider = document.getElementById('vol-speech');
    const v = slider ? parseFloat(slider.value) : speechVolume;
    speechVolume = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : speechVolume;
    if (speechVolume <= 0) return;

    // 某些浏览器在 cancel() 后立刻 speak() 会出现音量忽大忽小的 bug
    const seq = ++speakSeq;
    window.speechSynthesis.cancel();
    setTimeout(() => {
        if (seq !== speakSeq) return;
        const u = new SpeechSynthesisUtterance(txt.replace(/<[^>]*>?/gm, ''));
        u.lang = 'zh-CN';
        u.volume = speechVolume;
        window.speechSynthesis.speak(u);
    }, 60);
}

// 让“语音”滑条像鼓点滑条一样实时生效
document.getElementById('vol-speech')?.addEventListener('input', function() {
    const v = parseFloat(this.value);
    speechVolume = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : speechVolume;
    showToast?.(`🔊 语音音量：${Math.round(speechVolume * 100)}%`, 900);
});

// ==========================================
// 3. AI 动态性格构建 (已优化：数值直接决定国王态度)
// ==========================================
function buildKingPrompt(playerInput) {
    let mood = "";
    // 逻辑：优先判断革命程度，其次判断王权，最后判断愤怒
    if (gameState.revolution >= 100) {
        mood = "【极度恐慌】你发现暴民已经包围凡尔赛。你虽然坐在王座上，但手在发抖，说话充满威胁但其实心虚。";
    } else if (gameState.royalAuthority >= 80) {
        mood = "【极其傲慢冷酷】你依然坚信朕即国家。你视眼前的平民代表为垃圾，语气充满高高在上的嘲讽。";
    } else if (gameState.anger >= 80) {
        mood = "【极其烦躁】你被连日的请愿吵得头疼，你根本不在乎饥荒，只想快点要到钱去打猎。";
    } else {
        mood = "【疲惫且厌倦】你对国家的乱象感到无力。";
    }

    return `你扮演1789年的法王路易十六。面对的是一名【${gameState.role}】代表。
背景数据：革命值:${gameState.revolution}, 王权值:${gameState.royalAuthority}, 愤怒值:${gameState.anger}。
当前心态：${mood}。
玩家说：${playerInput}
要求：严禁脱离18世纪国王身份，回复50字内。`;
}

// ==========================================
// 4. 游戏引擎逻辑
// ==========================================
function startGroup(i) {
    cIdx = i; aiCnt = 0;
    controlBGM('start');
    playEffect();

    // 初始化数值重置 (增加默认值)
    gameState.role = ''; gameState.hunger = 50; gameState.anger = 50;
    gameState.revolution = 20; gameState.royalAuthority = 80; gameState.publicSupport = 30;
    gameState.choiceHistory = [];

    document.getElementById('choice-area').style.display = 'block'; 
    document.getElementById('ai-area').style.display = 'none';
    document.getElementById('chat-box').innerHTML = '';
    document.getElementById('final-revolt').style.display = 'none';
    const inp = document.getElementById('ai-input');
    if (inp) {
        inp.disabled = false;
        inp.placeholder = "质问国王...";
    }
    const sendBtn = document.getElementById('ai-send-btn');
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.style.opacity = '';
        sendBtn.style.cursor = '';
    }
    document.getElementById('show-gname').innerText = `当前代表：${gData[i].name}`;
    
    updateStatusDisplay();
    runScene("START"); 
    showP('p-game');
}

// ==========================================
// 4.x 课堂反馈：Toast + 关键选择记录
// ==========================================
let toastTimer = null;
function showToast(html, ms = 1600) {
    const el = document.getElementById('custom-toast');
    if (!el) return;
    el.innerHTML = html;
    el.style.display = 'block';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.display = 'none'; }, ms);
}

function snapshotCoreStats() {
    return {
        hunger: gameState.hunger,
        anger: gameState.anger,
        revolution: gameState.revolution,
        royalAuthority: gameState.royalAuthority,
        publicSupport: gameState.publicSupport
    };
}

function diffStats(before, after) {
    const keys = ['revolution', 'royalAuthority', 'anger', 'publicSupport', 'hunger'];
    const d = {};
    keys.forEach(k => d[k] = (after[k] ?? 0) - (before[k] ?? 0));
    return d;
}

function formatDelta(label, v, emoji) {
    if (!v) return "";
    const sign = v > 0 ? "+" : "";
    return `${emoji}${label}${sign}${v}`;
}

function isSignificantChoice(d) {
    return Math.abs(d.revolution) >= 10 || Math.abs(d.royalAuthority) >= 10 || Math.abs(d.anger) >= 15;
}

function recordChoice({ sceneId, choiceText, deltas }) {
    gameState.choiceHistory.push({
        t: choiceText,
        sid: sceneId,
        at: Date.now(),
        d: deltas
    });
    // 防止无限增长：保留最近 30 条足够复盘
    if (gameState.choiceHistory.length > 30) gameState.choiceHistory.shift();
}

function runScene(sid) {
    if(sid === "MENU") { 
        controlBGM('stop'); 
        gData[cIdx].done = true; 
        renderMenu(); 
        showP('p-menu'); 
        return; 
    }

    const s = script[sid];
    if(!s) return;

    const txt = document.getElementById('story-text');
    const area = document.getElementById('choice-area');
    const imgArea = document.getElementById('scene-img-area'); 

    // --- 📢 图片逻辑：只显示原图（不叠加表情层） ---
    if (imgArea && s.img) {
        imgArea.innerHTML = ''; // 只有当新场景有【明确新图】时，才清空并换图
        const imgEl = document.createElement('img');
        imgEl.src = s.img;
        imgEl.className = 'scene-img';
        // 如果加载失败，在控制台报错，方便你调试
        imgEl.onerror = () => console.error("图片加载失败，请检查路径:", imgEl.src);
        imgArea.appendChild(imgEl);
    }
    // 如果 s.img 不存在，我们就不清空 innerHTML，这样上一关的角色图会一直留着
    
    if(sid === "AI_KING") {
        playEffect();
        txt.innerHTML = `<b>【最终对峙：凡尔赛宫】</b><br>你作为 <b>${gameState.role}</b> 代表站在路易十六面前。`;
        document.getElementById('choice-area').style.display = 'none';
        document.getElementById('ai-area').style.display = 'flex';
        speak("路易十六冷冷地开口：朕的旨意就是法律。你们这些卑微的平民，到底想要什么？");
        // 没有配置 API 时，允许课堂演示直接进入巴士底狱与结局
        if (!customApiKey) {
            const fr = document.getElementById('final-revolt');
            fr.innerText = "⚠️ 未设置API：直接进入巴士底狱（课堂演示）";
            fr.style.display = 'block';
        }
    } else if (sid === "ENDING") {
        playEffect();
        txt.innerHTML = buildEndingHtml();
        speak(txt.innerText || "历史的命运已经写下。");
        document.getElementById('choice-area').style.display = 'block';
        document.getElementById('ai-area').style.display = 'none';
        area.innerHTML = '';
        s.btns.forEach(b => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = b.t;
            btn.onclick = () => {
                playEffect();
                if(b.effect) b.effect();
                updateStatusDisplay();
                runScene(b.next);
            };
            area.appendChild(btn);
        });
    } else {
        // 离开国王对话区时，恢复普通剧情布局
        document.getElementById('choice-area').style.display = 'block';
        document.getElementById('ai-area').style.display = 'none';
        const fr = document.getElementById('final-revolt');
        if (fr) {
            fr.innerText = "🔥 无法沟通，发动武装起义！";
            fr.style.display = 'none';
        }
        txt.innerHTML = s.text;
        speak(s.text);
        area.innerHTML = '';
        
        s.btns.forEach(b => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = b.t;
            btn.onclick = () => {
                playEffect();
                const before = snapshotCoreStats();
                if(b.effect) b.effect();
                const after = snapshotCoreStats();
                const d = diffStats(before, after);

                // 记录与反馈（让学生看到“选择→后果”）
                recordChoice({ sceneId: sid, choiceText: b.t, deltas: d });
                const parts = [
                    formatDelta('革命', d.revolution, '🔥'),
                    formatDelta('王权', d.royalAuthority, '👑'),
                    formatDelta('愤怒', d.anger, '💢'),
                    formatDelta('声望', d.publicSupport, '⭐'),
                ].filter(Boolean);
                if (parts.length) {
                    const hint = isSignificantChoice(d)
                        ? "<div style='margin-top:6px; opacity:0.9;'>关键抉择已记录（结局会复盘）</div>"
                        : "";
                    showToast(`<b>选择后果</b><br>${parts.join(' ｜ ')}${hint}`);
                }
                updateStatusDisplay();
                runScene(b.next); 
            };
            area.appendChild(btn);
        });
    }
}

function buildEndingHtml() {
    const r = gameState.revolution;
    const role = gameState.role || "代表";

    // 分段阈值：给学生一个清晰的“因果”反馈
    let title = "";
    let body = "";
    let tag = "";

    if (r >= 90) {
        title = "【你的命运：滑向恐怖统治】";
        tag = "高革命值结局";
        body = `你以近乎燃烧的决心推动革命。<br>
        <span class="ending-key">代价</span>：当秩序崩坏与战争阴影逼近，社会更容易用“清洗”换取安全感。<br>
        你在新的权力机器中变得强硬——也更容易被历史吞噬。`;
    } else if (r <= 35) {
        title = "【你的命运：革命受挫】";
        tag = "低革命值结局";
        body = `你在关键节点选择了退让与自保。<br>
        <span class="ending-key">结果</span>：你没能成为推动浪潮的人，反而更容易在清算、饥荒与谣言里失去立足点。<br>
        革命爆发了，但你没有抓住它。`;
    } else {
        title = "【你的命运：摇摆的改革者】";
        tag = "中革命值结局";
        body = `你在愤怒与理性之间反复拉扯。<br>
        <span class="ending-key">结果</span>：你能参与新秩序的诞生，但也会不断面对“妥协是否背叛初心”的追问。`;
    }

    // 角色差异化一句（轻量，但能让三条主线更“像不同人”）
    let roleLine = "";
    if (role === "鞋匠") roleLine = "作为鞋匠，你最先记住的是：面包与尊严，往往只能靠斗争去争取。";
    else if (role === "业主") roleLine = "作为工商业主，你最先记住的是：没有政治权利，就没有财产安全。";
    else if (role === "律师") roleLine = "作为青年律师，你最先记住的是：宪法与权利，不能只靠祈求。";
    else roleLine = `作为${role}，你把自己的选择刻进了历史的裂缝。`;

    // 结局复盘：挑 3 条“最关键”的选择
    const sig = (gameState.choiceHistory || []).filter(x => isSignificantChoice(x.d));
    const picks = (sig.length ? sig : (gameState.choiceHistory || [])).slice(-3).reverse();
    const recap = picks.length
        ? `<div class="ending-body" style="margin-top:14px;">
            <div style="font-size:1.2em; font-weight:900; margin-bottom:8px;">你的关键选择回顾</div>
            ${picks.map(x => {
                const dd = x.d || {};
                const p = [
                    formatDelta('革命', dd.revolution, '🔥'),
                    formatDelta('王权', dd.royalAuthority, '👑'),
                    formatDelta('愤怒', dd.anger, '💢'),
                    formatDelta('声望', dd.publicSupport, '⭐'),
                ].filter(Boolean).join(' ｜ ');
                return `<div style="margin:10px 0;">
                    <div style="font-weight:900;">- ${x.t}</div>
                    <div style="opacity:0.9; font-size:1.1em;">${p || "（数值无明显变化）"}</div>
                </div>`;
            }).join('')}
          </div>`
        : "";

    return `
        <b>${title}</b><br>
        <div class="ending-meta">身份：<b>${role}</b> ｜ 当前革命值：<b>${r}</b> ｜ 标签：<b>${tag}</b></div>
        <div class="ending-body">${body}</div>
        <div class="ending-role">${roleLine}</div>
        ${recap}
        <div class="ending-tip">提示：想看到不同命运，请在前面的关键抉择中尝试让“革命值”大幅变化。</div>
    `;
}
    
// ==========================================
// 5. API 通信与对话系统 (保持稳定)
// ==========================================
async function detectModels() {
    const keyInput = document.getElementById('api-key-input').value.trim();
    if(!keyInput) { alert("请先输入 API Key！"); return; }
    customApiKey = keyInput;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${customApiKey}`);
        const data = await response.json();
        const select = document.getElementById('model-select');
        select.innerHTML = '';
        data.models.forEach(m => {
            if(m.name.includes('gemini')) {
                const opt = document.createElement('option');
                opt.value = m.name.replace('models/', '');
                opt.text = m.displayName || m.name;
                select.appendChild(opt);
            }
        });
        select.style.display = 'inline-block';
        alert("✅ API 检测成功！");
    } catch (err) { alert("❌ 检测失败"); }
}

async function chatWithKing() {
    const inp = document.getElementById('ai-input');
    const box = document.getElementById('chat-box');
    const msg = inp.value.trim();
    if(!msg || !customApiKey) return;
    if (aiCnt >= 3) return;
    if (inp && inp.disabled) return;
    const sendBtn = document.getElementById('ai-send-btn');
    if (sendBtn && sendBtn.disabled) return;

    box.innerHTML += `<div class='msg user'><b>代表:</b> ${msg}</div>`;
    inp.value = '';
    
    const prompt = buildKingPrompt(msg);
    const model = document.getElementById('model-select').value;
    
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${customApiKey}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await resp.json();
        const replay = data.candidates[0].content.parts[0].text;
        box.innerHTML += `<div class='msg king'><b>路易十六:</b> ${replay}</div>`;
        speak(replay);
        aiCnt++;
        if (aiCnt >= 3) {
            document.getElementById('final-revolt').style.display = 'block';
            // 到达上限后，禁用继续对话，避免浪费 API
            inp.disabled = true;
            const sendBtn = document.getElementById('ai-send-btn');
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.style.opacity = '0.6';
                sendBtn.style.cursor = 'not-allowed';
            }
            inp.placeholder = "对话次数已达上限，请选择起义或返回大厅";
        }
    } catch (e) {
        box.innerHTML += `<div class='msg'>（国王沉默不语，请检查API连接）</div>`;
    }
    box.scrollTop = box.scrollHeight;
}

document.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && document.activeElement && document.activeElement.id === 'ai-input') {
        const inp = document.getElementById('ai-input');
        if (inp && !inp.disabled && aiCnt < 3) chatWithKing();
    }
});

// ==========================================
// 6. 系统底层辅助 (UI 实时刷新显示)
// ==========================================
function updateStatusDisplay() {
    const el = document.getElementById('show-stat');
    if(el) {
        // 这样可以确保你在剧情里加减的 anger 等数值能直接显示在页面顶端
        el.innerHTML = `💢愤怒:${gameState.anger} | 🔥革命:${gameState.revolution} | 👑王权:${gameState.royalAuthority}`;
    }
}

function initAll() { showP('p-setup'); }

function goNaming() {
    const count = document.getElementById('g-count').value;
    const container = document.getElementById('name-container');
    container.innerHTML = '';
    for(let i=1; i<=count; i++) {
        container.innerHTML += `<div style='margin-bottom:15px;'>玩家 ${i}: <input type='text' id='gn-${i}' class='group-input' style='width:60%;'></div>`;
    }
    showP('p-naming');
}

function saveGroups() {
    const ins = document.querySelectorAll('#name-container input');
    gData = [];
    ins.forEach(it => gData.push({ name: it.value || '匿名公民', done: false }));
    renderMenu(); showP('p-menu');
}

function renderMenu() {
    const list = document.getElementById('group-list');
    list.innerHTML = '';
    gData.forEach((g, i) => {
        const b = document.createElement('button');
        b.className = 'sys-btn';
        b.innerHTML = g.done ? `✅ ${g.name}` : `⚔️ 进入历史：【${g.name}】`;
        b.disabled = g.done;
        b.onclick = () => startGroup(i);
        list.appendChild(b);
    });
}

// --- 修正后的 game.js 底部代码 ---

// 处理回车键发送消息 (对应 index.html 中的 onkeypress)
function handleEnter(event) {
    if (event.key === "Enter") {
        const inp = document.getElementById('ai-input');
        if (inp && !inp.disabled && aiCnt < 3) chatWithKing();
    }
}

// 初始化：显示设置界面
function initAll() { 
    showP('p-setup'); 
}

// 切换面板的通用函数
function showP(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
    } else {
        console.error("找不到 ID 为 " + id + " 的面板");
    }
}

// 请确保这是文件的最后一行，后面不要再有任何符号了