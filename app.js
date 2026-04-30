// =========================
// 設定（GASのウェブアプリURL）
// =========================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxLWDqFFRD-fegXOuDYZ9Dnnt5SuX6VGPUAXu57glcuQt03Tx-_NQ2wdZgk74h9JfnLJA/exec";

let selectedType = "all";
let chartInstances = []; 

// =========================
// クラブのデータ (新しい順番に対応)
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
  { name: "軟式野球部", type: "culture", data: [2, 4, 3, 2, 1, 4] },
  { name: "エコの民", type: "volunteer", data: [3, 3, 1, 1, 1, 1] },
  { name: "武蔵野大学合気道部", type: "sports", data: [3, 1, 3, 2, 2, 3] }
  // ... ここに50個のデータを追加してください
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

  // 1. ユーザーの回答を取得（新しい順番に合わせる）
  const user = [
    Number(document.getElementById("q_gender").value), // 0: 男女比
    Number(document.getElementById("q_place").value),  // 1: 場所
    Number(document.getElementById("q_freq").value),   // 2: 頻度
    Number(document.getElementById("q_atmos").value),  // 3: 雰囲気
    Number(document.getElementById("q_rel").value),    // 4: 人間関係
    Number(document.getElementById("q_cost").value)    // 5: 費用
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
    let volClubs = allScoredClubs.filter(c => c.type === "volunteer").sort((a, b) => b.score - a.score);
    let otherClubs = allScoredClubs.filter(c => c.type !== "volunteer").sort((a, b) => b.score - a.score);
    results = volClubs.slice(0, 3).concat(otherClubs);
    results = results.slice(0, 10);
  } else if (selectedType === "all") {
    results = allScoredClubs.sort((a, b) => b.score - a.score).slice(0, 10);
  } else {
    results = allScoredClubs.filter(c => c.type === selectedType).sort((a, b) => b.score - a.score).slice(0, 10);
  }

  // 5. GASへ送信するデータの作成（インデックス番号に注意）
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

  // 6. 画面にHTML要素を書き出す
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

    // 7. グラフの描画（ラベルの順序も変更）
    results.forEach((r, i) => {
      const ctx = document.getElementById(`chart-${i}`).getContext("2d");
      const chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['男女比', '活動場所', '活動頻度', '雰囲気', '人間関係', '費用'],
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