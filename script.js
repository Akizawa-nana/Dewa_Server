/**
 * 統合スクリプト (script.js)
 * キュゥべえエディション ／人◕ ‿‿ ◕人＼
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbzh3BU8YQ2oHcuWT3CW96_k-OxbGICrxfaMUegU6K1O5e-GWJe_vYysqV_llFIuPZMP/exec";
const SUI_IMG = "https://i0.wp.com/kizakurasui.jp/wp-content/uploads/2019/03/-e1552528466283.png";
let currentRentData = [];
let currentFaqData = [];

// 連打検知用の変数
let clickCount = 0;
let lastClickTime = 0;
const CLICK_THRESHOLD = 300; // 0.3秒以内のクリックを連打とみなす
const BURST_LIMIT = 5;       // 5回連打で発動

// --- ユーティリティ・表示制御 ---

function toggleLoading(show) {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
        overlay.style.display = show ? "flex" : "none";
        document.body.classList.toggle('no-scroll', show);
    }
}

function loadData() {
    fetch(GAS_URL + "?mode=carlist")
        .then(res => res.json())
        .then(list => {
            currentRentData = list;
            const s1 = document.getElementById("carSelect");
            const s2 = document.getElementById("returnCarSelect");
            const tb = document.getElementById("statusTable");
            if (!s1 || !s2 || !tb) return;
            
            s1.innerHTML = ""; s2.innerHTML = ""; tb.innerHTML = "";
            list.forEach(item => {
                if (item.status === "貸出中") {
                    s2.innerHTML += `<option value="${item.number}">${item.number} (${item.car})</option>`;
                } else {
                    s1.innerHTML += `<option value="${item.number}">${item.number} (${item.car}) - ${item.price}円</option>`;
                }
                tb.innerHTML += `<tr><td>${item.number}</td><td>${item.car}</td><td><span class="status-badge ${item.status === '貸出中' ? 'status-busy' : 'status-vacant'}">${item.status}</span></td></tr>`;
            });
        })
        .catch(err => console.error("Data load error:", err));

    fetch(GAS_URL + "?mode=faqlist")
        .then(res => res.json())
        .then(faqs => {
            currentFaqData = faqs;
            showFaqMenu();
        });
}

// --- チャットボット機能 ---

function toggleChat() {
    const win = document.getElementById('chat-window');
    const bubble = document.getElementById('chat-bubble');
    if (!win || !bubble) return;
    
    const isOpening = (win.style.display === 'none' || win.style.display === '');
    win.style.display = isOpening ? 'flex' : 'none';
    if (isOpening) {
        bubble.classList.add('chat-open');
        scrollToBottom();
    } else {
        bubble.classList.remove('chat-open');
    }
}

function showFaqMenu(targetContainer = null) {
    const area = targetContainer || document.getElementById("faq-area");
    if (!area) return;
    area.innerHTML = "";
    const categories = [...new Set(currentFaqData.map(f => f.category || "その他"))];
    categories.forEach(cat => {
        const b = document.createElement("button");
        b.className = "faq-btn category-btn";
        b.textContent = "📁 " + cat;
        b.onclick = () => showQuestionsByCategory(cat, targetContainer);
        area.appendChild(b);
    });
    scrollToBottom();
}

function showQuestionsByCategory(cat, targetContainer) {
    const area = targetContainer || document.getElementById("faq-area");
    area.innerHTML = `<div style="padding:5px; font-size:0.85em; color:#888; border-left:3px solid var(--sui-pink); margin-bottom:8px;">カテゴリ: ${cat}</div>`;
    const filtered = currentFaqData.filter(f => (f.category || "その他") === cat);
    filtered.forEach(f => {
        const b = document.createElement("button");
        b.className = "faq-btn";
        b.textContent = "📋 " + f.question;
        b.onclick = () => askChat(f.question);
        area.appendChild(b);
    });
    const back = document.createElement("button");
    back.className = "back-btn";
    back.textContent = "← 分類一覧へ戻る";
    back.onclick = () => showFaqMenu(targetContainer);
    area.appendChild(back);
    scrollToBottom();
}

function askChat(q) {
    const content = document.getElementById('chat-content');
    const mainFaqArea = document.getElementById("faq-area");
    if (mainFaqArea) mainFaqArea.innerHTML = "";
    
    content.innerHTML += `<div style="width:100%; display:flex; margin-bottom:10px;"><div class="msg msg-user">${q}</div></div>`;
    const faq = currentFaqData.find(f => f.question === q);
    
    setTimeout(() => {
        const responseId = "res-" + Date.now();
        content.innerHTML += `
            <div class="msg-container" style="display:flex; align-items:flex-start;">
                <img src="${SUI_IMG}" class="bot-icon">
                <div class="msg msg-bot">${faq ? faq.answer : 'すみません、わかりませんでした。'}</div>
            </div>
            <div id="${responseId}" style="margin-left:53px; margin-bottom:20px;"></div>
        `;
        addBackButton(responseId);
        scrollToBottom();
    }, 600);
}

function handleSend() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text) return;
    
    const content = document.getElementById('chat-content');
    content.innerHTML += `<div style="width:100%; display:flex; margin-bottom:10px;"><div class="msg msg-user">${text}</div></div>`;
    input.value = "";
    
    setTimeout(() => {
        const responseId = "res-send-" + Date.now();
        content.innerHTML += `
            <div class="msg-container" style="display:flex; align-items:flex-start;">
                <img src="${SUI_IMG}" class="bot-icon">
                <div class="msg msg-bot">「${text}」ですね。ボタンメニューから選ぶかスタッフにお尋ねください！</div>
            </div>
            <div id="${responseId}" style="margin-left:53px; margin-bottom:20px;"></div>
        `;
        addBackButton(responseId);
        scrollToBottom();
    }, 800);
}

function addBackButton(targetId) {
    const nextArea = document.getElementById(targetId);
    if (!nextArea) return;
    const backBtn = document.createElement("button");
    backBtn.className = "back-btn";
    backBtn.textContent = "← 他の質問をする";
    backBtn.onclick = () => { backBtn.remove(); showFaqMenu(nextArea); };
    nextArea.appendChild(backBtn);
}

function scrollToBottom() { 
    const c = document.getElementById('chat-content'); 
    if (c) c.scrollTop = c.scrollHeight; 
}

// --- UI・テーマ制御 ---

function setupTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab, .tab-content").forEach(el => el.classList.remove("active"));
            tab.classList.add("active");
            const target = document.getElementById(tab.dataset.tab);
            if (target) target.classList.add("active");
        });
    });
}

function toggleManageFields() {
    const type = document.getElementById("reportType").value;
    const buildFields = document.getElementById("buildFields");
    const carFields = document.getElementById("carFields");
    if (!buildFields || !carFields) return;
    buildFields.style.display = (type === "build_info" || type === "other") ? "block" : "none";
    carFields.style.display = (type === "accident") ? "block" : "none";
}

function toggleTheme() {
    document.body.classList.toggle('theme-clean');
    document.body.classList.toggle('theme-akita');
    const isAkita = document.body.classList.contains('theme-akita');
    localStorage.setItem('selectedTheme', isAkita ? 'theme-akita' : 'theme-clean');
    applyThemeUI(isAkita);
}

function applyThemeUI(isAkita) {
    document.querySelectorAll('.theme-only-akita').forEach(e => {
        e.style.display = isAkita ? 'block' : 'none';
    });
    document.querySelectorAll('.theme-only-clean').forEach(e => {
        e.style.display = isAkita ? 'none' : 'block';
    });
}

function loadTheme() {
    const saved = localStorage.getItem('selectedTheme') || 'theme-clean';
    document.body.classList.remove('theme-clean', 'theme-akita');
    document.body.classList.add(saved);
    applyThemeUI(saved === 'theme-akita');
}

function calculateFee() {
    const m = document.getElementById("returnMcid").value;
    const n = document.getElementById("returnCarSelect").value;
    const t = currentRentData.find(i => i.number == n);
    if (t && t.mcid === m) {
        const days = Math.max(1, Math.ceil(Math.abs(new Date() - new Date(t.lastDate)) / (1000 * 60 * 60 * 24)));
        document.getElementById("feeDetail").innerHTML = `車種: ${t.car}<br>期間: ${days}日間`;
        document.getElementById("feeTotal").innerText = `合計: ${days * t.price}円`;
        document.getElementById("calcResult").style.display = "block";
    } else { 
        alert("MCIDが一致しません。"); 
    }
}

// --- フォーム送信処理 ---

function setupForms() {
    const forms = [
        { id: "buildForm", mode: "build", msg: "建築申請を提出しました！" },
        { id: "rentForm", mode: "rent", msg: "レンタル開始！安全運転でね！" },
        { id: "returnForm", mode: "return", msg: "返却完了！お疲れさま！" },
        { id: "manageForm", mode: "manage", msg: "報告を受付ました。" }
    ];

    forms.forEach(f => {
        const formEl = document.getElementById(f.id);
        if (formEl) {
            formEl.onsubmit = function(e) {
                e.preventDefault();

                // 既存のエラー表示をクリア
                this.querySelectorAll(".error-msg").forEach(el => el.remove());
                this.querySelectorAll(".error-input").forEach(el => {
                    el.classList.remove("error-input");
                    el.style.borderColor = "";
                });

                const inputs = this.querySelectorAll("input, select, textarea");
                let isAllFilled = true;

                for (let input of inputs) {
    if (input.offsetParent !== null && !input.value.trim()) {
        isAllFilled = false;
        
        const msg = document.createElement("div");
        msg.className = "error-msg";
        // 文言は君の好きなように変えられるけど、今回は簡潔にしたよ
        msg.textContent = "この項目を入力してください。";
        
        input.classList.add("error-input");
        // もし以前のコードで input.style.borderColor を直接いじっていたら、
        // クラス管理の邪魔になるから削除しておいてね。
        input.parentNode.insertBefore(msg, input.nextSibling);
    }
}

                if (!isAllFilled) return;

                toggleLoading(true);
                const d = new URLSearchParams(new FormData(this));
                d.append("mode", f.mode);
                
                fetch(GAS_URL, { 
                    method: "POST", 
                    body: d, 
                    mode: (f.mode === "build" || f.mode === "manage" ? "no-cors" : "cors") 
                })
                .then(() => {
                    toggleLoading(false);
                    alert(f.msg);
                    this.reset();
                    if(f.id === "rentForm" || f.id === "returnForm") location.reload();
                })
                .catch(() => {
                    toggleLoading(false);
                    alert("通信エラーです。");
                });
            };
        }
    });
}

// --- 隠し機能：キュゥべえ召喚（演出強化・スマホ配慮版） ---
function summonKyubey() {
    if (document.getElementById('kyubey-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'kyubey-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 200000;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: white; font-family: 'Noto Sans JP', sans-serif;
        opacity: 0; transition: opacity 0.8s ease;
    `;

    const img = document.createElement('img');
    img.src = 'https://i.imgur.com/PMOOP0t.png';
    img.style.width = '320px';
    img.style.maxWidth = '80vw';
    img.style.filter = 'drop-shadow(0 0 20px rgba(255,255,255,0.2))';

    const text = document.createElement('div');
    text.style.textAlign = 'center';
    text.style.padding = '20px';
    text.innerHTML = `
        <h2 style="font-size:1.6em; margin-top:20px; line-height:1.4;">
            君たちはいつもそうだね。<br>
            事実をありのままに伝えると決まって同じ反応をする。
        </h2>
        <p style="font-size:1.1em; color:#ff80ab; margin-top:15px; font-weight:bold;">
            わけがわからないよ。どうして人間はそんなに<br>
            サイトのレスポンスが早いことにこだわるんだい？
        </p>
    `;

    const exitHint = document.createElement('div');
    exitHint.id = 'kyubey-exit';
    exitHint.textContent = "[ 画面をタップして契約を継続する ]";
    exitHint.style.cssText = `
        margin-top: 40px; font-size: 0.8em; opacity: 0; 
        transition: opacity 1s ease; letter-spacing: 0.2em;
        padding: 10px 20px; border: 1px solid rgba(255,255,255,0.3); border-radius: 30px;
    `;

    overlay.appendChild(img);
    overlay.appendChild(text);
    overlay.appendChild(exitHint);
    document.body.appendChild(overlay);

    setTimeout(() => overlay.style.opacity = '1', 50);

    let canClose = false;
    setTimeout(() => {
        canClose = true;
        exitHint.style.opacity = '0.6';
    }, 2000); 

    overlay.onclick = () => {
        if (!canClose) return; 
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 800);
    };
}

function setupBurstWatch() {
    document.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;
        const currentTime = Date.now();
        if (currentTime - lastClickTime < CLICK_THRESHOLD) {
            clickCount++;
        } else {
            clickCount = 1;
        }
        lastClickTime = currentTime;
        if (clickCount >= BURST_LIMIT) {
            summonKyubey();
            clickCount = 0;
        }
    });
}

function showKyubeySurprise() {
    const quotes = [
        "「僕と契約して、魔法少女になってよ！」",
        "「訊かれなかったからさ。知らなければ知らないままで、何の不都合もないからね。」",
        "「わけがわからないよ」",
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    console.log("%c／人 %c◕%c ‿‿ %c◕%c 人 ＼", "color:black;font-size:30px;", "color:red;font-size:30px;", "color:black;font-size:30px;", "color:red;font-size:30px;", "color:black;font-size:30px;");
    console.log(`%c${randomQuote}`, "color: #333; background: #fff1f0; padding: 8px; border-left: 5px solid #ff80ab;");
}

// --- 初期化実行 ---
window.onload = () => {
    loadTheme();
    loadData();
    setupTabs();
    setupForms();
    setupBurstWatch();
    showKyubeySurprise();
    
    const userIn = document.getElementById("userInput");
    if (userIn) {
        userIn.onkeypress = (e) => { if (e.key === "Enter") handleSend(); };
    }
};
