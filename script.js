const GAS_URL = "https://script.google.com/macros/s/AKfycbzh3BU8YQ2oHcuWT3CW96_k-OxbGICrxfaMUegU6K1O5e-GWJe_vYysqV_llFIuPZMP/exec";
const SUI_IMG = "https://i0.wp.com/kizakurasui.jp/wp-content/uploads/2019/03/-e1552528466283.png";
let currentRentData = [];
let currentFaqData = [];

// 追加：ローディング表示切り替え関数
function toggleLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.style.display = show ? "flex" : "none";
  }
}

// データの初期読み込み
function loadData() {
  fetch(GAS_URL + "?mode=carlist").then(res => res.json()).then(list => {
    currentRentData = list;
    const s1 = document.getElementById("carSelect"); 
    const s2 = document.getElementById("returnCarSelect"); 
    const tb = document.getElementById("statusTable");
    if(!s1 || !s2 || !tb) return;
    s1.innerHTML = ""; s2.innerHTML = ""; tb.innerHTML = "";
    list.forEach(item => {
      if(item.status === "貸出中") {
        s2.innerHTML += `<option value="${item.number}">${item.number} (${item.car})</option>`;
      } else {
        s1.innerHTML += `<option value="${item.number}">${item.number} (${item.car}) - ${item.price}円</option>`;
      }
      tb.innerHTML += `<tr><td>${item.number}</td><td>${item.car}</td><td><span class="status-badge ${item.status==='貸出中'?'status-busy':'status-vacant'}">${item.status}</span></td></tr>`;
    });
  });

  fetch(GAS_URL + "?mode=faqlist").then(res => res.json()).then(faqs => { 
    currentFaqData = faqs; 
    showFaqMenu(); 
  });
}

// チャット開閉
function toggleChat() {
  const win = document.getElementById('chat-window');
  const bubble = document.getElementById('chat-bubble');
  const isOpening = (win.style.display === 'none' || win.style.display === '');
  win.style.display = isOpening ? 'flex' : 'none';
  if(isOpening) {
    bubble.classList.add('chat-open');
    scrollToBottom();
  } else {
    bubble.classList.remove('chat-open');
  }
}

// FAQメニュー描画
function showFaqMenu(targetContainer = null) {
  const area = targetContainer || document.getElementById("faq-area");
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

// 分類別質問表示
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
  mainFaqArea.innerHTML = "";
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
  if(!text) return;
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
  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "← 他の質問をする";
  backBtn.onclick = () => { backBtn.remove(); showFaqMenu(nextArea); };
  nextArea.appendChild(backBtn);
}

function scrollToBottom() { const c = document.getElementById('chat-content'); c.scrollTop = c.scrollHeight; }

// タブ切り替え
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab, .tab-content").forEach(el => el.classList.remove("active"));
    tab.classList.add("active"); 
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// 管理・報告フォーム入力切り替え
function toggleManageFields() {
  const type = document.getElementById("reportType").value;
  const buildFields = document.getElementById("buildFields");
  const carFields = document.getElementById("carFields");
  if(!buildFields || !carFields) return;
  if (type === "accident") {
    buildFields.style.display = "none";
    carFields.style.display = "block";
  } else {
    buildFields.style.display = "block";
    carFields.style.display = "none";
  }
}

// テーマ切り替え
function toggleTheme() {
  document.body.classList.toggle('theme-clean'); 
  document.body.classList.toggle('theme-akita');
  const isAkita = document.body.classList.contains('theme-akita');
  document.querySelectorAll('.theme-only-akita').forEach(e => e.style.display = isAkita ? 'block' : 'none');
  document.querySelectorAll('.theme-only-clean').forEach(e => e.style.display = isAkita ? 'none' : 'block');
  const theme = isAkita ? 'theme-akita' : 'theme-clean';
  localStorage.setItem('selectedTheme', theme);
}

function loadTheme() {
  const saved = localStorage.getItem('selectedTheme');
  if (saved === 'theme-akita') {
    document.body.classList.remove('theme-clean');
    document.body.classList.add('theme-akita');
  }
  const isAkita = document.body.classList.contains('theme-akita');
  document.querySelectorAll('.theme-only-akita').forEach(e => e.style.display = isAkita ? 'block' : 'none');
  document.querySelectorAll('.theme-only-clean').forEach(e => e.style.display = isAkita ? 'none' : 'block');
}

// 料金計算
function calculateFee() {
  const m = document.getElementById("returnMcid").value; 
  const n = document.getElementById("returnCarSelect").value;
  const t = currentRentData.find(i => i.number == n);
  if(t && t.mcid === m) {
    const days = Math.max(1, Math.ceil(Math.abs(new Date() - new Date(t.lastDate))/(1000*60*60*24)));
    document.getElementById("feeDetail").innerHTML = `車種: ${t.car}<br>期間: ${days}日間`;
    document.getElementById("feeTotal").innerText = `合計: ${days * t.price}円`;
    document.getElementById("calcResult").style.display = "block";
  } else { alert("MCIDが一致しません。"); }
}

// --- フォーム送信処理（ここを大幅修正） ---

// 1. 建築申請
document.getElementById("buildForm").onsubmit = function(e) { 
  e.preventDefault(); 
  toggleLoading(true); // 表示開始
  const d = new URLSearchParams(new FormData(this));
  d.append("mode","build");
  fetch(GAS_URL, {method:"POST", body: d})
    .then(() => {
      toggleLoading(false); // 表示終了
      alert("申請完了だすぃ！");
      this.reset();
    })
    .catch(() => {
      toggleLoading(false);
      alert("エラーが発生しました");
    });
};

// 2. レンタル開始
document.getElementById("rentForm").onsubmit = function(e) { 
  e.preventDefault(); 
  toggleLoading(true); // 表示開始
  const d = new URLSearchParams(new FormData(this)); 
  d.append("mode","rent"); 
  fetch(GAS_URL, {method:"POST", body:d})
    .then(r=>r.text())
    .then(t => {
      toggleLoading(false); // 表示終了
      if(t.includes("Error")) {
        alert("2台までですだすぃ！");
      } else {
        alert("レンタル開始！安全運転でね！");
        location.reload();
      }
    })
    .catch(() => {
      toggleLoading(false);
      alert("エラーが発生しました");
    });
};

// 3. 返却確定
document.getElementById("returnForm").onsubmit = function(e) { 
  e.preventDefault(); 
  toggleLoading(true); // 表示開始
  const d = new URLSearchParams(); 
  d.append("mode","return"); 
  d.append("mcid", document.getElementById("returnMcid").value); 
  d.append("number", document.getElementById("returnCarSelect").value); 
  fetch(GAS_URL, {method:"POST", body:d})
    .then(() => {
      toggleLoading(false); // 表示終了
      alert("返却完了！お疲れさまだすぃ！");
      location.reload();
    })
    .catch(() => {
      toggleLoading(false);
      alert("エラーが発生しました");
    });
};

// 4. 管理報告
document.getElementById("manageForm").onsubmit = function(e) {
  e.preventDefault();
  toggleLoading(true); // 表示開始
  const d = new URLSearchParams(new FormData(this));
  d.append("mode", "manage");
  fetch(GAS_URL, {method: "POST", body: d})
    .then(() => {
      toggleLoading(false); // 表示終了
      alert("報告を送信しました。ありがとうだすぃ！");
      this.reset();
      if(typeof toggleManageFields === "function") toggleManageFields();
    })
    .catch(() => {
      toggleLoading(false);
      alert("送信エラーだすぃ...");
    });
};

document.getElementById("userInput").onkeypress = (e) => { if(e.key==="Enter") handleSend(); };

// 初期化実行
window.onload = () => {
  loadTheme();
  loadData();
};
