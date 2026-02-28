const GAS_URL = "https://script.google.com/macros/s/AKfycbzh3BU8YQ2oHcuWT3CW96_k-OxbGICrxfaMUegU6K1O5e-GWJe_vYysqV_llFIuPZMP/exec";
const SUI_IMG = "https://i0.wp.com/kizakurasui.jp/wp-content/uploads/2019/03/-e1552528466283.png";
let currentRentData = [];
let currentFaqData = [];

// --- 隠し要素：僕からのメッセージ（コンソール） ---
// 文字列をエスケープして直接の検索を回避
console.log(
  "%c\u541b\u3001\u3053\u3093\u306a\u3068\u3053\u308d\u3067\u4f55\u3092\u63a2\u3057\u3066\u3044\u308b\u3093\u3060\u3044\uff1f \u7b54\u3048\u306f\u3053\u3053\u306b\u306f\u306a\u3044\u3088\u3002 \uff0f\u4eba\u25d5 \u203f\u203f \u25d5\u4eba\uff3c",
  "color: #ff004c; font-weight: bold; font-size: 1.2em; border: 1px solid #ff004c; padding: 5px; border-radius: 5px;"
);

// --- ユーティリティ・表示制御 ---

function toggleLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.style.display = show ? "flex" : "none";
    document.body.classList.toggle('no-scroll', show);
  }
}

function loadData() {
  fetch(GAS_URL + "?mode=carlist").then(res => res.json()).then(list => {
    currentRentData = list;
    const s1 = document.getElementById("carSelect"), s2 = document.getElementById("returnCarSelect"), tb = document.getElementById("statusTable");
    if(!s1 || !s2 || !tb) return;
    s1.innerHTML = ""; s2.innerHTML = ""; tb.innerHTML = "";
    list.forEach(item => {
      if(item.status === "\u8cb8\u51fa\u4e2d") { // 貸出中
        s2.innerHTML += `<option value="${item.number}">${item.number} (${item.car})</option>`;
      } else {
        s1.innerHTML += `<option value="${item.number}">${item.number} (${item.car}) - ${item.price}\u5186</option>`;
      }
      tb.innerHTML += `<tr><td>${item.number}</td><td>${item.car}</td><td><span class="status-badge ${item.status==='\u8cb8\u51fa\u4e2d'?'status-busy':'status-vacant'}">${item.status}</span></td></tr>`;
    });
  });

  fetch(GAS_URL + "?mode=faqlist").then(res => res.json()).then(faqs => { 
    currentFaqData = faqs; 
    showFaqMenu(); 
  });
}

// --- チャットボット機能 ---

function toggleChat() {
  const win = document.getElementById('chat-window'), bubble = document.getElementById('chat-bubble');
  const isOpening = (win.style.display === 'none' || win.style.display === '');
  win.style.display = isOpening ? 'flex' : 'none';
  if(isOpening) { bubble.classList.add('chat-open'); scrollToBottom(); }
  else { bubble.classList.remove('chat-open'); }
}

function showFaqMenu(targetContainer = null) {
  const area = targetContainer || document.getElementById("faq-area");
  area.innerHTML = "";
  const categories = [...new Set(currentFaqData.map(f => f.category || "\u305d\u306e\u4ed6"))];
  categories.forEach(cat => {
    const b = document.createElement("button");
    b.className = "faq-btn category-btn";
    b.textContent = "\ud83d\udcc1 " + cat;
    b.onclick = () => showQuestionsByCategory(cat, targetContainer);
    area.appendChild(b);
  });
  scrollToBottom();
}

function showQuestionsByCategory(cat, targetContainer) {
  const area = targetContainer || document.getElementById("faq-area");
  area.innerHTML = `<div style="padding:5px; font-size:0.85em; color:#888; border-left:3px solid var(--sui-pink); margin-bottom:8px;">\u30ab\u30c6\u30b4\u30ea: ${cat}</div>`;
  currentFaqData.filter(f => (f.category || "\u305d\u306e\u4ed6") === cat).forEach(f => {
    const b = document.createElement("button");
    b.className = "faq-btn"; b.textContent = "\ud83d\udccb " + f.question;
    b.onclick = () => askChat(f.question);
    area.appendChild(b);
  });
  const back = document.createElement("button");
  back.className = "back-btn"; back.textContent = "\u2190 \u5206\u985e\u4e00\u89a7\u3078\u623b\u308b";
  back.onclick = () => showFaqMenu(targetContainer);
  area.appendChild(back);
  scrollToBottom();
}

function askChat(q) {
  const content = document.getElementById('chat-content');
  document.getElementById("faq-area").innerHTML = "";
  content.innerHTML += `<div style="width:100%; display:flex; margin-bottom:10px;"><div class="msg msg-user">${q}</div></div>`;
  const faq = currentFaqData.find(f => f.question === q);
  setTimeout(() => {
    const rId = "res-" + Date.now();
    content.innerHTML += `<div class="msg-container"><img src="${SUI_IMG}" class="bot-icon"><div class="msg-bot">${faq ? faq.answer : '\u3059\u307f\u307e\u305b\u3093\u3001\u308f\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002'}</div></div><div id="${rId}" style="margin-left:53px; margin-bottom:20px;"></div>`;
    addBackButton(rId); scrollToBottom();
  }, 600);
}

function handleSend() {
  const input = document.getElementById("userInput"), text = input.value.trim(); 
  if(!text) return;

  // 難読化されたトリガー判定 (契約, 奇跡, 魔法少女)
  const _v = [33530, 32004, 22855, 36321, 39764, 27861, 23569, 22899];
  if(_v.some((_, i) => i % 2 === 0 && text.includes(String.fromCharCode(_v[i], _v[i+1])))) {
    setTimeout(() => { window.location.href = "\x34\x30\x34\x2e\x68\x74\x6d\x6c"; }, 500);
    return;
  }

  const content = document.getElementById('chat-content');
  content.innerHTML += `<div style="width:100%; display:flex; margin-bottom:10px;"><div class="msg msg-user">${text}</div></div>`;
  input.value = "";
  setTimeout(() => {
    const rId = "res-send-" + Date.now();
    content.innerHTML += `<div class="msg-container"><img src="${SUI_IMG}" class="bot-icon"><div class="msg-bot">\u300c${text}\u300d\u3067\u3059\u306d\u3002\u30b2\u30fc\u30c8\u30a6\u30a7\u30a4\u304b\u3089\u9078\u3076\u304b\u30b9\u30bf\u30c3\u30d5\u306b\u304a\u5c0b\u306d\u304f\u3060\u3055\u3044\uff01</div></div><div id="${rId}" style="margin-left:53px; margin-bottom:20px;"></div>`;
    addBackButton(rId); scrollToBottom();
  }, 800);
}

function addBackButton(id) {
  const area = document.getElementById(id), btn = document.createElement("button");
  btn.className = "back-btn"; btn.textContent = "\u2190 \u4ed6\u306e\u8cea\u554f\u3092\u3059\u308b";
  btn.onclick = () => { btn.remove(); showFaqMenu(area); };
  area.appendChild(btn);
}

function scrollToBottom() { const c = document.getElementById('chat-content'); c.scrollTop = c.scrollHeight; }

// --- UI・テーマ制御 ---

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab, .tab-content").forEach(el => el.classList.remove("active"));
    tab.classList.add("active"); document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

function toggleManageFields() {
  const type = document.getElementById("reportType").value;
  const bF = document.getElementById("buildFields"), cF = document.getElementById("carFields");
  if(!bF || !cF) return;
  bF.style.display = (type === "build_info") ? "block" : "none";
  cF.style.display = (type === "accident") ? "block" : "none";
}

function toggleTheme() {
  // 1/100の確率で発動する介入
  if (Math.floor(Math.random() * 0x64) === (0x7 ^ 0x2)) { 
    window.location.href = String.fromCharCode(0x34, 0x30, 0x34, 0x2e, 0x68, 0x74, 0x6d, 0x6c);
    return;
  }
  document.body.classList.toggle('theme-clean'); document.body.classList.toggle('theme-akita');
  const isA = document.body.classList.contains('theme-akita');
  localStorage.setItem('selectedTheme', isA ? 'theme-akita' : 'theme-clean');
  applyThemeUI(isA);
}

function applyThemeUI(isA) {
  document.querySelectorAll('.theme-only-akita').forEach(e => e.style.display = isA ? 'block' : 'none');
  document.querySelectorAll('.theme-only-clean').forEach(e => e.style.display = isA ? 'none' : 'block');
}

function loadTheme() {
  const s = localStorage.getItem('selectedTheme') || 'theme-clean';
  document.body.classList.remove('theme-clean', 'theme-akita');
  document.body.classList.add(s); applyThemeUI(s === 'theme-akita');
}

function calculateFee() {
  const m = document.getElementById("returnMcid").value, n = document.getElementById("returnCarSelect").value;
  const t = currentRentData.find(i => i.number == n);
  if(t && t.mcid === m) {
    const days = Math.max(1, Math.ceil(Math.abs(new Date() - new Date(t.lastDate))/(864e5)));
    document.getElementById("feeDetail").innerHTML = `\u8eca\u7a2e: ${t.car}<br>\u671f\u9593: ${days}\u65e5\u9593`;
    document.getElementById("feeTotal").innerText = `\u5408\u8a08: ${days * t.price}\u5186`;
    document.getElementById("calcResult").style.display = "block";
  } else { alert("MCID\u304c\u4e00\u81f4\u3057\u307e\u305b\u3093\u3002"); }
}

// --- フォーム送信処理 ---

document.getElementById("buildForm").onsubmit = function(e) { 
  e.preventDefault(); toggleLoading(true);
  const fd = new URLSearchParams(new FormData(this));
  
  // 難読化された座標・用途チェック (魔女 / 0,0,0)
  const _u = fd.get("purpose"), _co = fd.get("coords");
  const _ck = (s) => s.split('').map(x => x.charCodeAt(0)).reduce((a, b) => a + b, 0) === 40722;
  const _cz = !/[1-9]/.test(_co) && _co.includes('0');

  if(_ck(_u) || _cz) {
    setTimeout(() => { window.location.href = "\x34\x30\x34\x2e\x68\x74\x6d\x6c"; }, 1000);
    return;
  }

  fd.append("mode","build");
  fetch(GAS_URL, {method:"POST", body: fd}).then(() => {
    toggleLoading(false); alert("\u7533\u8acb\u5b8c\u4e86\u3060\u3059\u3043\uff01"); this.reset();
  }).catch(() => { toggleLoading(false); alert("\u30a8\u30e9\u30fc"); });
};

document.getElementById("rentForm").onsubmit = function(e) { 
  e.preventDefault(); toggleLoading(true);
  const fd = new URLSearchParams(new FormData(this)); fd.append("mode","rent"); 
  fetch(GAS_URL, {method:"POST", body:fd}).then(r=>r.json()).then(res => {
    toggleLoading(false);
    if(res.status === "error") alert(res.message + "\u3060\u3059\u3043\uff01");
    else { alert("\u30ec\u30f3\u30bf\u30eb\u958b\u59cb\uff01"); location.reload(); }
  }).catch(() => { toggleLoading(false); alert("\u30a8\u30e9\u30fc"); });
};

document.getElementById("returnForm").onsubmit = function(e) { 
  e.preventDefault(); toggleLoading(true);
  const fd = new URLSearchParams(); fd.append("mode","return"); 
  fd.append("mcid", document.getElementById("returnMcid").value); 
  fd.append("number", document.getElementById("returnCarSelect").value); 
  fetch(GAS_URL, {method:"POST", body:fd}).then(() => {
    toggleLoading(false); alert("\u8fd4\u5374\u5b8c\u4e86\uff01"); location.reload();
  }).catch(() => { toggleLoading(false); alert("\u30a8\u30e9\u30fc"); });
};

document.getElementById("manageForm").onsubmit = function(e) {
  e.preventDefault(); toggleLoading(true);
  const fd = new URLSearchParams(new FormData(this)); fd.append("mode", "manage");
  fetch(GAS_URL, {method: "POST", body: fd}).then(() => {
    toggleLoading(false); alert("\u5831\u544a\u3092\u9001\u4fe1\u3057\u307e\u3057\u307f\u3002"); this.reset(); toggleManageFields();
  }).catch(() => { toggleLoading(false); alert("\u30a8\u30e9\u30fc"); });
};

document.getElementById("userInput").onkeypress = (e) => { if(e.key==="Enter") handleSend(); };

window.onload = () => { loadTheme(); loadData(); };
