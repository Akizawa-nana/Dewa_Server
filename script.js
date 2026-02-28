/**
 * 統合スクリプト (script.js)
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbzh3BU8YQ2oHcuWT3CW96_k-OxbGICrxfaMUegU6K1O5e-GWJe_vYysqV_llFIuPZMP/exec";
const SUI_IMG = "https://i0.wp.com/kizakurasui.jp/wp-content/uploads/2019/03/-e1552528466283.png";
let currentRentData = [];
let currentFaqData = [];

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
    // 秋田テーマ専用要素の表示制御
    document.querySelectorAll('.theme-only-akita').forEach(e => {
        // blockだとデザインが崩れる場合は flex や table 等、HTMLの構造に合わせて調整してね
        e.style.display = isAkita ? 'block' : 'none';
    });

    // クリーンテーマ専用要素の表示制御
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
    const buildForm = document.getElementById("buildForm");
    if (buildForm) {
        buildForm.onsubmit = function(e) {
            e.preventDefault();
            toggleLoading(true);
            const d = new URLSearchParams(new FormData(this));
            d.append("mode", "build");
            fetch(GAS_URL, { method: "POST", body: d, mode: "no-cors" })
                .then(() => {
                    toggleLoading(false);
                    alert("建築申請を提出しました！すぐに建築を始めてOKだすぃ！");
                    this.reset();
                })
                .catch(() => {
                    toggleLoading(false);
                    alert("送信エラーだすぃ...");
                });
        };
    }

    const rentForm = document.getElementById("rentForm");
    if (rentForm) {
        rentForm.onsubmit = function(e) {
            e.preventDefault();
            toggleLoading(true);
            const d = new URLSearchParams(new FormData(this));
            d.append("mode", "rent");
            fetch(GAS_URL, { method: "POST", body: d })
                .then(r => r.json())
                .then(res => {
                    toggleLoading(false);
                    if (res.status === "error") {
                        alert(res.message + "だすぃ！");
                    } else {
                        alert("レンタル開始！安全運転でね！");
                        location.reload();
                    }
                })
                .catch(() => {
                    toggleLoading(false);
                    alert("接続エラーだすぃ...");
                });
        };
    }

    const returnForm = document.getElementById("returnForm");
    if (returnForm) {
        returnForm.onsubmit = function(e) {
            e.preventDefault();
            toggleLoading(true);
            const d = new URLSearchParams();
            d.append("mode", "return");
            d.append("mcid", document.getElementById("returnMcid").value);
            d.append("number", document.getElementById("returnCarSelect").value);
            fetch(GAS_URL, { method: "POST", body: d })
                .then(() => {
                    toggleLoading(false);
                    alert("返却完了！お疲れさまだすぃ！");
                    location.reload();
                })
                .catch(() => {
                    toggleLoading(false);
                    alert("エラーだすぃ...");
                });
        };
    }

    const manageForm = document.getElementById("manageForm");
    if (manageForm) {
        manageForm.onsubmit = function(e) {
            e.preventDefault();
            toggleLoading(true);
            const d = new URLSearchParams(new FormData(this));
            d.append("mode", "manage");
            fetch(GAS_URL, { method: "POST", body: d, mode: "no-cors" })
                .then(() => {
                    toggleLoading(false);
                    alert("報告を受付ました。運営が確認するだすぃ！");
                    this.reset();
                    toggleManageFields();
                })
                .catch(() => {
                    toggleLoading(false);
                    alert("送信エラーだすぃ...");
                });
        };
    }
}

// --- 隠しメッセージの充実 ---
function showKyubeySurprise() {
    const quotes = [
        "「僕と契約して、魔法少女になってよ！」",
        "「訊かれなかったからさ。知らなければ知らないままで、何の不都合もないからね。」",
        "「僕は、君たちの願い事をなんでも一つ叶えてあげる。何だってかまわない。どんな奇跡だって起こしてあげられるよ。」",
        "「わけがわからないよ」",
        "「僕、君たちにお願いがあって来たんだ。」",
    ];
    
    // ランダムに1つ選ぶ
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const pinkEye = "color: #ff0000; font-size: 40px; font-weight: bold;";
    const blackBody = "color: #000000; font-size: 40px; font-weight: bold;";

    // 顔文字の表示（パーツごとにスタイルを適用）
    console.log(
        "%c／人 %c◕%c ‿‿ %c◕%c 人 ＼", 
        blackBody, // ／人 
        pinkEye,   // ◕ (左目)
        blackBody, //  ‿‿ 
        pinkEye,   // ◕ (右目)
        blackBody  //  人 ＼
    );

    // 引用部分
    console.log(
        `%c${randomQuote}`, 
        "color: #333; font-size: 16px; background: #fff1f0; padding: 8px; border-left: 5px solid #ff80ab;"
    );
} // ← ここでしっかり関数を閉じています

// --- 初期化実行 (既存のものを書き換え) ---
window.onload = () => {
    loadTheme();
    loadData();
    setupTabs();
    setupForms();
    showKyubeySurprise();
    // チャットのエンターキー監視
    const userIn = document.getElementById("userInput");
    if (userIn) {
        userIn.onkeypress = (e) => { if (e.key === "Enter") handleSend(); };
    }
};
