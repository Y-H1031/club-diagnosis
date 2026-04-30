// =========================
// 設定（GASのウェブアプリURL）
// =========================
const GAS_URL = "https://script.google.com/macros/s/AKfycby2ahYII6RHYIgUSmy8UYcySScaa0aqaKjFAGPq0XcslhtOUX7HL3_cDPzu_fe4-qdreQ/exec";

let selectedType = "all";
let chartInstances = []; // 複数のグラフを管理する配列

// =========================
// クラブのデータ (50個規模を想定)
// =========================
const clubs = [
  { name: "水泳部", type: "sports", data: [1, 3, 4, 4, 5, 3] },
  { name: "テニスサークルA", type: "sports", data: [3, 2, 2, 2, 2, 4] },
  { name: "テニスサークルB", type: "sports", data: [5, 4, 3, 3, 3, 2] },
  { name: "ボランティア部A", type: "volunteer", data: [2, 3, 1, 3, 3, 1] },
  { name: "ボランティア部B", type: "volunteer", data: [3, 4, 2, 2, 2, 1] },
  { name: "ボランティア部C", type: "volunteer", data: [4, 3, 1, 1, 1, 2] },
  { name: "写真部", type: "culture", data: [1, 2, 2, 3, 2, 5] },
  { name: "軽音部", type: "culture", data: [2, 2, 4, 4, 3, 4] },
  { name: "美術部", type: "culture", data: [5, 4, 1, 2, 1, 3] },
  { name: "サッカー部", type: "sports", data: [1, 1, 5, 5, 5, 4] },
  { name: "演劇部", type: "culture", data: [3, 3, 4, 4, 4, 2] }
  // ... 実際にはここに50個記述します
];

// =========================
// UIイベント設定
// =========================
["q_atmos", "q_rel"].forEach(id => {
  const slider = document.getElementById(id);
  const span = document.getElementById(id + "Val");
  if(slider && span) {
    slider.addEventListener("input", () => { span.textContent = slider.value; });
  }
});

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
// すべての項目が5段階（1〜5）になったため、最大差分はすべて「4」になります。
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

  // 過去のグラフを破棄
  chartInstances.forEach(chart => chart.destroy());
  chartInstances = [];

  // 1. ユーザーの回答を取得
  const user = [
    Number(document.getElementById("q_place").value),
    Number(document.getElementById("q_gender").value),
    Number(document.getElementById("q_freq").value),
    Number(document.getElementById("q_atmos").value),
    Number(document.getElementById("q_rel").value),
    Number(document.getElementById("q_cost").value)
  ];

  // 2. 重みの配列を作成
  const weights = [1, 1, 1, 1, 1, 1];
  checkedBoxes.forEach(box => {
    weights[Number(box.value)] = 3; 
  });

  // 3. 全クラブのスコアを計算
  let allScoredClubs = clubs.map(c => ({
    name: c.name,
    type: c.type,
    score: score(user, c.data, weights),
    data: c.data
  }));

  let results = [];

  // 4. 要件に合わせたフィルタリングと並び替え
  if (selectedType === "volunteer") {
    // ボランティア志望の場合：Top3はボランティア、4位以降は無差別
    let volClubs = allScoredClubs.filter(c => c.type === "volunteer").sort((a, b) => b.score - a.score);
    let otherClubs = allScoredClubs.filter(c => c.type !== "volunteer").sort((a, b) => b.score - a.score);
    
    results = volClubs.slice(0, 3).concat(otherClubs);
    results = results.slice(0, 10); // 上位10個に絞る

  } else if (selectedType === "all") {
    // 希望なしの場合：全体からTop10
    results = allScoredClubs.sort((a, b) => b.score - a.score).slice(0, 10);
  } else {
    // 運動部・文化部の場合：そのタイプの中からTop10
    results = allScoredClubs.filter(c => c.type === selectedType).sort((a, b) => b.score - a.score).slice(0, 10);
  }

  // 5. GASへ送信するデータの作成 (Top10を動的に生成)
  const sendData = {
    type: selectedType,
    ans_place: user[0],
    ans_gender: user[1],
    ans_freq: user[2],
    ans_atmos: user[3],
    ans_rel: user[4],
    ans_cost: user[5]
  };
  for (let i = 0; i < 10; i++) {
    sendData[`rank${i+1}_name`] = results[i] ? results[i].name : "";
    sendData[`rank${i+1}_score`] = results[i] ? results[i].score.toFixed(1) : "";
  }

  // 6. 画面にHTML要素を書き出す（Top10のカードとキャンバス）
  if (results.length === 0) {
    resultDiv.innerHTML = `<div class="result-card">該当するクラブがありません。</div>`;
  } else {
    resultDiv.innerHTML = results.map((r, i) => {
      let rankText = `${i + 1}位`;
      if (i === 0) rankText = "🏆 第1希望";
      if (i === 1) rankText = "✨ 第2希望";
      if (i === 2) rankText = "✨ 第3希望";

      return `
        <div class="result-card">
          <span style="color: #666; font-size: 0.9em;">${rankText}</span><br>
          <strong style="font-size: 1.4em; display: inline-block; margin: 10px 0;">${r.name}</strong><br>
          マッチ度: <strong style="color: #007bff; font-size: 1.2em;">${r.score.toFixed(0)}%</strong>
          <div style="margin-top: 15px;">
            <canvas id="chart-${i}"></canvas>
          </div>
        </div>
      `;
    }).join("");

    // 7. 各キャンバスにグラフを描画する
    results.forEach((r, i) => {
      const ctx = document.getElementById(`chart-${i}`).getContext("2d");
      const chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['活動場所', '男女比', '活動頻度', '雰囲気', '人間関係', '費用'],
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
            r: {
              min: 0,
              max: 5,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
      chartInstances.push(chart);
    });
  }

  // 8. GASへのデータ送信処理
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