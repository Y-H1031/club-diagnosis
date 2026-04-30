// =========================
// 設定（GASのウェブアプリURL）
// =========================
const GAS_URL = "https://script.google.com/macros/s/AKfycbw2jfFXKA9WjBtwg8H8vkd7-ZWcOdXk5r_sz1vPPXtqS2dbBDZkRraxOvQu8XmK91kE/exec";

let selectedType = "all";
let chartInstances = []; 

// =========================
// クラブのデータ (ご提供いただいた数値をそのまま保持)
// data: [男女比, 活動場所, 頻度, 雰囲気, 人間関係, 費用]
// =========================
const clubs = [
  { name: "武蔵野大学水泳部", type: "sports", data: [3, 3, 2, 3, 2, 4] },
  { name: "武蔵野大学お笑いサークルMOS", type: "culture", data: [3, 4, 3, 1, 2, 1] },
  { name: "武蔵野大学紅茶研究部", type: "culture", data: [3, 3, 1, 1, 1, 2] },
  { name: "ネイル同好会<nailer>", type: "culture", data: [5, 5, 1, 1, 1, 2] },
  { name: "武蔵野大学弓道部紫月会", type: "sports", data: [3, 2, 3, 2, 2, 5] },
  { name: "学生団体CREATORS ", type: "culture", data: [3, 3, 1, 1, 2, 5] },
  { name: "放課後秘密基地たまごまなぼ", type: "volunteer", data: [3, 1, 1, 1, 1, 1] },
  { name: "男子バスケットボール部", type: "sports", data: [1, 1, 4, 5, 2, 5] },
  { name: "軟式野球部", type: "sports", data: [2, 4, 3, 2, 1, 4] },
  { name: "エコの民", type: "volunteer", data: [3, 3, 1, 1, 1, 1] },
  { name: "武蔵野大学合気道部", type: "sports", data: [3, 1, 3, 2, 2, 3] },
  { name: "硬式庭球部", type: "sports", data: [3, 1, 3, 2, 2, 4] },
  { name: "漣", type: "sports", data: [3, 3, 2, 3, 3, 5] },
  { name: "武蔵野大学バドミントン部", type: "sports", data: [3, 1, 4, 3, 2, 5] },
  { name: "武蔵野大学漫画研究部", type: "culture", data: [4, 3, 5, 2, 1, 3] },
  { name: "フィギュアスケート同好会", type: "sports", data: [5, 3, 1, 3, 1, 5] },
  { name: "ソフトテニス部", type: "sports", data: [3, 1, 4, 3, 3, 4] },
  { name: "武蔵野大学ソサイチサークル", type: "sports", data: [2, 1, 3, 3, 3, 1] },
  { name: "サイクリングクラブ", type: "sports", data: [1, 4, 1, 2, 1, 2] },
  { name: "武蔵野大学マンドリンクラブ", type: "culture", data: [5, 2, 3, 2, 2, 5] },
  { name: "清談会", type: "culture", data: [3, 5, 2, 4, 3, 1] },
  { name: "こどもボランティア部", type: "volunteer", data: [4, 3, 1, 2, 2, 1] },
  { name: "Dance Club Alpha", type: "sports", data: [4, 1, 3, 4, 3, 3] },
  { name: "和太鼓隼", type: "sports", data: [4, 1, 3, 3, 1, 4] },
  { name: "写真技術研究部", type: "culture", data: [3, 3, 1, 1, 1, 3] },
  { name: "コドモノセカイ", type: "culture", data: [2, 1, 1, 1, 1, 2] },
  { name: "サブカル研究部", type: "culture", data: [2, 4, 1, 1, 2, 1] },
  { name: "ハワイアンクラブ", type: "culture", data: [3, 1, 1, 2, 1, 3] },
  { name: "武蔵野大学管弦楽団", type: "culture", data: [4, 1, 2, 2, 1, 3] },
  { name: "美術部", type: "culture", data: [4, 2, 1, 1, 1, 1] },
  { name: "武蔵野大学K-POPカバーダンスサークル", type: "culture", data: [4, 3, 2, 3, 1, 3] },
  { name: "書道部", type: "culture", data: [5, 1, 4, 2, 2, 4] },
  { name: "BohPJ同好会", type: "culture", data: [2, 5, 1, 5, 3, 1] },
  { name: "武蔵野大学おさがりモンスター", type: "culture", data: [5, 1, 2, 2, 2, 1] },
  { name: "卓球部", type: "sports", data: [3, 1, 5, 3, 2, 1] },
  { name: "文学研究部", type: "culture", data: [4, 3, 1, 2, 2, 1] },
  { name: "武蔵野大学ボードゲーム同好会いるでぃ", type: "culture", data: [3, 3, 4, 1, 2, 2] },
  { name: "情報部", type: "culture", data: [1, 4, 1, 1, 1, 1] },
  { name: "武蔵野大学放送研究部", type: "culture", data: [2, 2, 3, 3, 2, 4] },
  { name: "武蔵野大学ウインドアンサンブル", type: "culture", data: [4, 1, 3, 3, 2, 3] },
  { name: "武蔵野大学裏千家茶道部", type: "culture", data: [4, 1, 2, 2, 1, 4] },
  { name: "料理同好会", type: "culture", data: [3, 3, 1, 1, 1, 2] },
  { name: "武蔵野大学 バレーボール部", type: "sports", data: [3, 1, 3, 4, 3, 3] },
  { name: "演劇研究部def’s drop", type: "culture", data: [3, 3, 4, 4, 2, 3] },
  { name: "Hand Language Club ", type: "culture", data: [4, 3, 3, 1, 1, 2] },
  { name: "駅伝部", type: "sports", data: [2, 3, 4, 2, 2, 2] },
  { name: "武蔵野大学 武蔵野生の遊び場", type: "culture", data: [2, 3, 2, 1, 1, 1] },
  { name: "アカペラサークルMAM", type: "culture", data: [4, 2, 3, 1, 1, 4] },
  { name: "武蔵野大学音楽部ルンビニー合唱団", type: "culture", data: [3, 1, 4, 3, 1, 2] },
  { name: "武蔵野大学サッカー部", type: "sports", data: [1, 1, 5, 5, 5, 5] },
  { name: "お茶同好会", type: "culture", data: [3, 3, 1, 1, 1, 3] }
];

// =========================
// UIイベント設定
// =========================
const checkboxes = document.querySelectorAll(".priority-chk");
checkboxes.forEach(chk => {
  chk.addEventListener("change", () => {
    const checkedCount = document.querySelectorAll(".priority-chk:checked").length;
    if (checkedCount >= 2) {
      checkboxes.forEach(box => { if (!box.checked) box.disabled = true; });
    } else {
      checkboxes.forEach(box => { box.disabled = false; });
    }
  });
});

function setType(type, btn) {
  selectedType = type;
  document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// =========================
// スコア計算ロジック
// =========================
const maxDiffs = [4, 4, 4, 4, 4, 4]; 

function score(user, club, weights) {
  let sum = 0;
  let maxPossibleScore = 0;

  for (let i = 0; i < 6; i++) {
    let diff = Math.abs(user[i] - club[i]);
    const itemScore = 1 - (diff / maxDiffs[i]); 
    sum += itemScore * weights[i];
    maxPossibleScore += weights[i];
  }
  return (sum / maxPossibleScore) * 100;
}

// =========================
// メイン処理（計算 ＆ GAS送信）
// =========================
async function calculate() {
  const btn = document.getElementById("submitBtn");
  const resultDiv = document.getElementById("result");
  const checkedBoxes = document.querySelectorAll(".priority-chk:checked");

  if (checkedBoxes.length !== 2) {
    alert("特に重視する要素を【2つ】選択してください！");
    return;
  }

  btn.disabled = true;
  btn.textContent = "診断中...";
  resultDiv.innerHTML = "";

  chartInstances.forEach(chart => chart.destroy());
  chartInstances = [];

  const user = [
    Number(document.getElementById("q_gender").value),
    Number(document.getElementById("q_place").value),
    Number(document.getElementById("q_freq").value),
    Number(document.getElementById("q_atmos").value),
    Number(document.getElementById("q_rel").value),
    Number(document.getElementById("q_cost").value)
  ];

  const weights = [1, 1, 1, 1, 1, 1];
  checkedBoxes.forEach(box => {
    weights[Number(box.value)] = 3; 
  });

  let allScoredClubs = clubs.map(c => ({
    name: c.name,
    type: c.type,
    score: score(user, c.data, weights),
    data: c.data
  }));

  let results = [];

  if (selectedType === "volunteer") {
    let volClubs = allScoredClubs.filter(c => c.type === "volunteer").sort((a, b) => b.score - a.score);
    let otherClubs = allScoredClubs.filter(c => c.type !== "volunteer").sort((a, b) => b.score - a.score);
    results = volClubs.slice(0, 3).concat(otherClubs);
    results = results.slice(0, 10);
  } else if (selectedType === "all") {
    results = allScoredClubs.sort((a, b) => b.score - a.score).slice(0, 10);
  } else {
    results = allScoredClubs.filter(c => c.type === selectedType).sort((a, b) => b.score - a.score).slice(0, 10);
  }

  const sendData = {
    type: selectedType,
    ans_gender: user[0],
    ans_place: user[1],
    ans_freq: user[2],
    ans_atmos: user[3],
    ans_rel: user[4],
    ans_cost: user[5]
  };
  for (let i = 0; i < 10; i++) {
    sendData[`rank${i+1}_name`] = results[i] ? results[i].name : "";
    sendData[`rank${i+1}_score`] = results[i] ? results[i].score.toFixed(1) : "";
  }

  if (results.length === 0) {
    resultDiv.innerHTML = `<div class="result-card">該当するクラブがありません。</div>`;
  } else {
    const labels = ['男女比', '活動場所', '活動頻度', '雰囲気', '人間関係', '費用'];

    resultDiv.innerHTML = results.map((r, i) => {
      let rankText = `${i + 1}位`;
      if (i === 0) rankText = "🏆 第1希望";
      if (i === 1) rankText = "✨ 第2希望";
      if (i === 2) rankText = "✨ 第3希望";

      // ーーー 解説文章の作成ロジック ーーー
      let goodMatches = [];
      let okMatches = [];
      let badMatches = [];
      for (let j = 0; j < 6; j++) {
        let diff = Math.abs(user[j] - r.data[j]);
        let labelText = weights[j] === 3 ? `<u>${labels[j]}（重視）</u>` : labels[j];
        if (diff <= 1) { goodMatches.push(labelText); }
        else if (diff === 2) { okMatches.push(labelText); }
        else { badMatches.push(labelText); }
      }
      let matchText = `<div style="background: #f8f9fa; padding: 12px; border-radius: 8px; font-size: 0.85em; margin: 15px 0; border: 1px solid #e0e0e0; line-height: 1.6; text-align: left;">`;
      if (goodMatches.length > 0) matchText += `<div style="color: #2e7d32;"><strong>◎ ぴったり：</strong>${goodMatches.join("、")}</div>`;
      if (okMatches.length > 0) matchText += `<div style="color: #f57c00;"><strong>△ 少しズレ：</strong>${okMatches.join("、")}</div>`;
      if (badMatches.length > 0) matchText += `<div style="color: #d32f2f;"><strong>✕ ギャップ：</strong>${badMatches.join("、")}</div>`;
      matchText += `</div>`;
      // ーーー ここまで ーーー

      return `
        <div class="result-card">
          <span style="color: #666; font-size: 0.9em;">${rankText}</span><br>
          <strong style="font-size: 1.4em; display: inline-block; margin: 10px 0;">${r.name}</strong><br>
          マッチ度: <strong style="color: #007bff; font-size: 1.2em;">${r.score.toFixed(0)}%</strong>
          
          ${matchText}

          <div style="margin-top: 10px;">
            <canvas id="chart-${i}"></canvas>
          </div>
        </div>
      `;
    }).join("");

    results.forEach((r, i) => {
      const ctx = document.getElementById(`chart-${i}`).getContext("2d");
      const chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'あなたの希望',
              data: user,
              backgroundColor: 'rgba(0, 123, 255, 0.2)',
              borderColor: 'rgba(0, 123, 255, 1)',
              borderWidth: 2,
            },
            {
              label: r.name + ' の実態',
              data: r.data,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
            }
          ]
        },
        options: {
          scales: {
            r: { min: 0, max: 5, ticks: { stepSize: 1 } }
          }
        }
      });
      chartInstances.push(chart);
    });
  }

  try {
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendData)
    });
  } catch (error) {
    console.error("送信エラー:", error);
  } finally {
    btn.disabled = false;
    btn.textContent = "診断する";
  }
}