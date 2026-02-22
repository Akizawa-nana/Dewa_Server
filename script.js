const GAS_URL = "https://script.google.com/macros/s/AKfycbwsq8vd69zZf5FsTUxfa26PS7mB3n8jJEuRJ_Xck68XRZvExMIW3gRxxCDU7KLiyHKH/exec";
const SUI_IMG = "https://i0.wp.com/kizakurasui.jp/wp-content/uploads/2019/03/-e1552528466283.png";
let currentRentData = [];
let currentFaqData = [];

// データの初期読み込み
function loadData() {
  fetch(GAS_URL + "?mode=carlist").then(res => res.json()).then(list => {
    currentRentData = list;
    const s1 = document.getElementById("carSelect"); 
    const s2 = document.getElementById("returnCarSelect"); 
    const tb = document.getElementById("statusTable");
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
  win.style.display = (win.style.display === 'none' || win.style.display === '') ? 'flex' : 'none';
  if(win.style.display === 'flex') scrollToBottom();
}

// メニュー（質問一覧）の描画
function showFaqMenu(targetContainer = null) {
  const area = targetContainer || document.getElementById("faq-area");
  area.innerHTML = "";
  currentFaqData.forEach(f => {
    const b = document.createElement("button");
    b.className = "faq-btn";
    b.textContent = "📋 " + f.question;
    b.onclick = () => askChat(f.question);
    area.appendChild(b);
  });
  scrollToBottom();
}

// 質問を投げた時の処理
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
    const nextArea = document.getElementById(responseId);
    const backBtn = document.createElement("button");
    backBtn.className = "back-btn";
    backBtn.textContent = "← 他の質問をする";
    backBtn.onclick = () => { backBtn.remove(); showFaqMenu(nextArea); };
    nextArea.appendChild(backBtn);
    scrollToBottom();
  }, 600);
}

// 入力欄からの送信
function handleSend() {
  const input = document.getElementById("userInput"); 
  const text = input.value.trim(); 
  if(!text) return;
  const content = document.getElementById('chat-content');
  content.innerHTML += `<div style="width:100%; display:flex; margin-bottom:10px;"><div class="msg msg-user">${text}</div></div>`;
  input.value = "";
  setTimeout(() => {
    content.innerHTML += `<div class="msg-container" style="display:flex; align-items:flex-start;"><img src="${SUI_IMG}" class="bot-icon"><div class="msg msg-bot">「${text}」ですね。ボタンメニューから選ぶかスタッフにお尋ねください！</div></div>`;
    showFaqMenu();
  }, 800);
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

// テーマ切り替え
function toggleTheme() {
  document.body.classList.toggle('theme-clean'); 
  document.body.classList.toggle('theme-akita');
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

// 各種フォーム送信処理
document.getElementById("buildForm").onsubmit = function(e) { 
  e.preventDefault(); 
  fetch(GAS_URL, {method:"POST", body:new URLSearchParams(new FormData(this)).append("mode","build")}).then(() => alert("申請完了")); 
};
document.getElementById("rentForm").onsubmit = function(e) { 
  e.preventDefault(); 
  const d = new URLSearchParams(new FormData(this)); 
  d.append("mode","rent"); 
  fetch(GAS_URL, {method:"POST", body:d}).then(r=>r.text()).then(t => t.includes("Error")?alert("2台までです"):alert("レンタル開始")); 
};
document.getElementById("returnForm").onsubmit = function(e) { 
  e.preventDefault(); 
  const d = new URLSearchParams(); 
  d.append("mode","return"); 
  d.append("mcid", document.getElementById("returnMcid").value); 
  d.append("number", document.getElementById("returnCarSelect").value); 
  fetch(GAS_URL, {method:"POST", body:d}).then(() => location.reload()); 
};

document.getElementById("userInput").onkeypress = (e) => { if(e.key==="Enter") handleSend(); };

// 初期化実行
loadData();
