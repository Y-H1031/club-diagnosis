// =========================
// Supabase設定
// =========================
const supabaseUrl = "https://jvbuiyjafdhtiunfwxdg.supabase.co";
// ※実際の運用では環境変数等で管理することを推奨します
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YnVpeWphZmRodGl1bmZ3eGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDk4MzYsImV4cCI6MjA5MTg4NTgzNn0.F4A1lsjcQRJfmGvE4BcPeTm8ufypfwCm__TmaHws71s";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// =========================
// データ（6項目）
// 配列の並び順: [0:場所, 1:男女比, 2:頻度, 3:雰囲気, 4:人間関係, 5:費用]
// =========================
let selectedType = "all";
let chartInstance = null;

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
  // DOMが読み込まれた後に実行されることを保証するため、存在チェックを追加
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
// 各項目の最大差分。この値で割って0〜1の割合を出します。
// [場所(1-3=2), 男女比(1-3=2), 頻度(1-5=4), 雰囲気(1-5=4), 人間関係(1-5=4), 費用(1-5=4)]
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
// メイン処理
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

  // 2. 重みの配列を作成（基本は1、チェックされた項目は3）
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

  try {
    // 4. Supabaseにユーザーデータを保存
    const { data: userRow, error: userError } = await supabaseClient
      .from("users")
      .insert([{
        type: selectedType,
        ans_place: user[0],
        ans_gender: user[1],
        ans_freq: user[2],
        ans_atmos: user[3],
        ans_rel: user[4],
        ans_cost: user[5]
      }])
      .select()
      .single();

    if (userError) throw new Error(`[User保存エラー] ${userError.message}`);

    // 5. Supabaseに結果データを保存
    if (userRow) {
      const { error: resultError } = await supabaseClient
        .from("results")
        .insert(
          results.map((r, i) => ({
            user_id: userRow.id,
            rank: i + 1,
            club_name: r.name,
            score: r.score
          }))
        );
      
      if (resultError) throw new Error(`[Result保存エラー] ${resultError.message}`);
    }

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
    console.error("Supabaseエラー:", error);
    resultDiv.innerHTML = `
      <div class="error-message">
        <strong>データ保存エラーが発生しましたが、診断結果は以下の通りです。</strong><br>
        <small>${error.message}</small><br>
        ※データベース(Supabase)のテーブル構造が6つの質問に対応しているか確認してください。
      </div>
    `;
    
    // エラー時でも結果とグラフは表示してあげる
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