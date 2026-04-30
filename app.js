// =========================
// 設定（GASのウェブアプリURLを貼り付けてください）
// =========================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxLWDqFFRD-fegXOuDYZ9Dnnt5SuX6VGPUAXu57glcuQt03Tx-_NQ2wdZgk74h9JfnLJA/exec";

let selectedType = "all";
let chartInstance = null;

// =========================
// クラブのデータ
// =========================
const clubs = [
  { name: "水泳部", type: "sports", data: [1, 2, 4, 4, 5, 3] },
  { name: "テニスサークル", type: "sports", data: [3, 2, 2, 2, 2, 4] },
  { name: "ボランティア部", type: "volunteer", data: [2, 3, 1, 3, 3, 1] },
  { name: "写真部", type: "culture", data: [1, 2, 2, 3, 2, 5] },
  { name: "軽音部", type: "culture", data: [2, 2, 4, 4, 3, 4] }
];

// =========================
// UIイベント設定
// =========================
// スライダーの数値連動
["q_atmos", "q_rel"].forEach(id => {
  const slider = document.getElementById(id);
  const span = document.getElementById(id + "Val");
  if(slider && span) {
    slider.addEventListener("input", () => { span.textContent = slider.value; });
  }
});

// 重視する要素（チェックボックス）の制限処理（2つまで）
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

// タイプ選択
function setType(type, btn) {
  selectedType = type;
  document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// =========================
// スコア計算ロジック
// =========================
const maxDiffs = [2, 2, 4, 4, 4, 4]; 

function score(user, club, weights) {
  let sum = 0;
  let maxPossibleScore = 0;

  for (let i = 0; i < 6; i++) {
    let diff = 0;
    // 特別ルール：活動場所(i=0)で「外部施設可(3)」を選んだ場合、ペナルティなし
    if (i === 0 && user[i] === 3) {
      diff = 0;
    } else {
      diff = Math.abs(user[i] - club[i]);
    }

    const itemScore = 1 - (diff / maxDiffs[i]); 
    sum += itemScore * weights[i];
    maxPossibleScore += weights[i];
  }
  return (sum / maxPossibleScore) * 100;
}

// =========================
// レーダーチャート描画処理
// =========================
function drawChart(userStats, topClub) {
  const chartContainer = document.getElementById("chartContainer");
  const ctx = document.getElementById("matchChart").getContext("2d");
  
  chartContainer.style.display = "block";

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['活動場所', '男女比', '活動頻度', '雰囲気', '人間関係', '費用'],
      datasets: [
        {
          label: 'あなたの希望',
          data: userStats,
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 2,
        },
        {
          label: topClub.name + ' の実態',
          data: topClub.data,
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

  // 3. マッチング計算
  let results = clubs
    .filter(c => selectedType === "all" || c.type === selectedType)
    .map(c => ({
      name: c.name,
      score: score(user, c.data, weights),
      data: c.data
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  // 4. GASへ送信するデータの作成
  const sendData = {
    type: selectedType,
    ans_place: user[0],
    ans_gender: user[1],
    ans_freq: user[2],
    ans_atmos: user[3],
    ans_rel: user[4],
    ans_cost: user[5],
    rank1_name: results.length > 0 ? results[0].name : "",
    rank1_score: results.length > 0 ? results[0].score.toFixed(1) : "",
    rank2_name: results.length > 1 ? results[1].name : "",
    rank2_score: results.length > 1 ? results[1].score.toFixed(1) : ""
  };

  try {
    // 5. GAS (スプレッドシート) へデータ送信
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors", // CORSエラーを回避するための必須設定
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendData)
    });

    // 6. 画面に結果を表示
    if (results.length === 0) {
      resultDiv.innerHTML = `<div class="result-card">該当するクラブがありません。</div>`;
    } else {
      resultDiv.innerHTML = results.map((r, i) => `
        <div class="result-card">
          <span style="color: #666; font-size: 0.9em;">${i === 0 ? "🏆 第1希望" : "✨ 第2希望"}</span><br>
          <strong style="font-size: 1.4em; display: inline-block; margin: 10px 0;">${r.name}</strong><br>
          マッチ度: <strong style="color: #007bff; font-size: 1.2em;">${r.score.toFixed(0)}%</strong>
        </div>
      `).join("");

      // 第1希望のグラフを描画
      drawChart(user, results[0]);
    }

  } catch (error) {
    console.error("送信エラー:", error);
    resultDiv.innerHTML = `
      <div class="error-message">
        <strong>データ保存エラーが発生しましたが、診断結果は以下の通りです。</strong><br>
        ※ GASの設定やURLが正しいか確認してください。
      </div>
    `;
    
    // エラー時でも結果とグラフは表示
    if (results.length > 0) {
      resultDiv.innerHTML += results.map((r, i) => `
        <div class="result-card">
          <strong style="font-size: 1.4em;">${i === 0 ? "🏆 第1希望" : "✨ 第2希望"}：${r.name}</strong><br>
          マッチ度: <strong style="color: #007bff;">${r.score.toFixed(0)}%</strong>
        </div>
      `).join("");
      drawChart(user, results[0]);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "診断する";
  }
}