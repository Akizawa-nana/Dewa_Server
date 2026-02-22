const GAS_URL = "https://script.google.com/macros/s/AKfycbwsq8vd69zZf5FsTUxfa26PS7mB3n8jJEuRJ_Xck68XRZvExMIW3gRxxCDU7KLiyHKH/exec";
const SUI_IMG = "https://i0.wp.com/kizakurasui.jp/wp-content/uploads/2019/03/-e1552528466283.png";
let currentRentData = [];
let currentFaqData = [];

// データの初期読み込み
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
    }).catch(err => console.error("車両リストの取得に失敗しました:", err));

  fetch(GAS_URL + "?mode=faqlist")
    .then(res => res.json())
    .then(faqs => {
      currentFaqData = faqs;
      showFaqMenu();
    }).catch(err => console.error("FAQの取得に失敗しました:", err));
}

// チャット開閉
function toggleChat() {
  const win = document.getElementById('chat-window');
  const bubble = document.getElementById('chat-bubble');
  const isOpening = (win.style.display === 'none' || win.style.display === '');
  win.style.display = isOpening ? 'flex' : 'none';
  if (isOpening) {
    bubble.classList.add('chat-open');
    scrollToBottom();
  } else {
    bubble.classList.remove('chat-open');
  }
}

// FAQメニュー描画
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
  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "← 他の質問をする";
  backBtn.onclick = () => { backBtn.remove(); showFaqMenu(nextArea); };
  nextArea.appendChild(backBtn);
}

function scrollToBottom() { const c = document.getElementById('chat-content'); if(c) c.scrollTop = c.scrollHeight; }

// タブ切り替え
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab, .tab-content").forEach(el => el.classList.remove("active"));
    tab.classList.add("active");
    const target = document.getElementById(tab.dataset.tab);
    if(target) target.classList.add("active");
  });
});

// テーマ切り替え
function toggleTheme() {
  document.body.classList.toggle('theme-clean');
  document.body.classList.toggle('theme-akita');
  updateThemeUI();
}

function loadTheme() {
  const saved = localStorage.getItem('selectedTheme');
  if (saved === 'theme-akita') {
    document.body.classList.remove('theme-clean');
    document.body.classList.add('theme-akita');
  }
  updateThemeUI();
}

function updateThemeUI() {
  const isAkita = document.body.classList.contains('theme-akita');
  document.querySelectorAll('.theme-only-akita').forEach(e => e.style.display = isAkita ? 'block' : 'none');
  document.querySelectorAll('.theme-only-clean').forEach(e => e.style.display = isAkita ? 'none' : 'block');
  localStorage.setItem('selectedTheme', isAkita ? 'theme-akita' : 'theme-clean');
}

// 料金計算
function calculateFee() {
  const m = document.getElementById("returnMcid").value.trim();
  const n = document.getElementById("returnCarSelect").value;
  const t = currentRentData.find(i => i.number == n);
  if (t && t.mcid === m) {
    const lastDate = new Date(t.lastDate);
    const days = Math.max(1, Math.ceil(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24)));
    document.getElementById("feeDetail").innerHTML = `車種: ${t.car}<br>期間: ${days}日間`;
    document.getElementById("feeTotal").innerText = `合計: ${days * t.price}円`;
    document.getElementById("calcResult").style.display = "block";
  } else {
    alert("MCIDが一致しません。");
  }
}

// --- フォーム送信共通処理 ---
async function handleFormSubmit(form, mode) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerText;
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerText = "送信中...";

    const params = new URLSearchParams(new FormData(form));
    params.append("mode", mode);

    const response = await fetch(GAS_URL, {
      method: "POST",
      body: params
    });

    const result = await response.text();
    if (result.includes("Error")) {
      alert("エラーが発生しました: " + result);
    } else {
      alert("処理が完了しましたぃ！");
      if (mode === 'return') location.reload();
      form.reset();
    }
  } catch (err) {
    alert("通信エラーが発生しました。");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
  }
}

// 各イベントリスナー
document.getElementById("buildForm").onsubmit = function(e) { e.preventDefault(); handleFormSubmit(this, "build"); };
document.getElementById("rentForm").onsubmit = function(e) { e.preventDefault(); handleFormSubmit(this, "rent"); };
document.getElementById("returnForm").onsubmit = function(e) { e.preventDefault(); handleFormSubmit(this, "return"); };

// 管理フォーム（HTMLに存在する場合のみ実行）
const manageForm = document.getElementById("manageForm");
if (manageForm) {
  manageForm.onsubmit = function(e) { e.preventDefault(); handleFormSubmit(this, "manage"); };
}

document.getElementById("userInput").onkeypress = (e) => { if (e.key === "Enter") handleSend(); };

// 初期化実行
loadTheme();
loadData();
