// =========================
// Supabase設定 (必ず自分のプロジェクトのものに書き換えてください)
// =========================
const supabaseUrl = "https://YOUR_PROJECT.supabase.co";
const supabaseKey = "YOUR_ANON_KEY";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// =========================
// データ
// =========================
let selectedType = "all";

const clubs = [
  { name: "水泳部", type: "sports", data: [5,4,4,5,3] },
  { name: "テニスサークル", type: "sports", data: [3,3,2,4,2] },
  { name: "軽音部", type: "culture", data: [3,3,3,4,3] },
  { name: "写真部", type: "culture", data: [2,2,2,3,2] }
];

// =========================
// UI生成
// =========================
function sliderHTML(id, label) {
  return `
  <div class="card">
    <p>${label}：<span id="${id}Val">3</span></p>
    <input type="range" id="${id}" min="1" max="5" value="3">
  </div>`;
}

// 質問の意図が伝わりやすいようにラベルを調整
document.getElementById("sliders").innerHTML =
  sliderHTML("freq", "活動頻度 (1:少ない〜5:多い)") +
  sliderHTML("serious", "ガチ度 (1:エンジョイ〜5:プロ志向)") +
  sliderHTML("atmos", "雰囲気 (1:落ち着き〜5:アゲアゲ)") +
  sliderHTML("rel", "人間関係 (1:ドライ〜5:ウェット)") +
  sliderHTML("cost", "費用 (1:安い〜5:高い)");

// スライダーを動かした時に数値を更新する処理
["freq", "serious", "atmos", "rel", "cost"].forEach(id => {
  const slider = document.getElementById(id);
  const valueSpan = document.getElementById(id + "Val");
  slider.addEventListener("input", () => {
    valueSpan.textContent = slider.value;
  });
});

// =========================
// タイプ選択
// =========================
function setType(type, btn) {
  selectedType = type;
  document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// =========================
// スコア計算ロジック
// =========================
function score(user, club) {
  let sum = 0;
  for (let i = 0; i < 5; i++) {
    // 差が小さいほど高得点。各項目最大1点、5項目で最大5点になる。
    sum += 1 - Math.abs(user[i] - club[i]) / 4;
  }
  return sum;
}

// =========================
// メイン処理
// =========================
async function calculate() {
  const btn = document.getElementById("submitBtn");
  const resultDiv = document.getElementById("result");

  // ボタンを連打できないようにする
  btn.disabled = true;
  btn.textContent = "診断中...";
  resultDiv.innerHTML = "";

  // 1. ユーザーの回答を安全に取得
  const user = [
    Number(document.getElementById("freq").value),
    Number(document.getElementById("serious").value),
    Number(document.getElementById("atmos").value),
    Number(document.getElementById("rel").value),
    Number(document.getElementById("cost").value)
  ];

  // 2. クラブとのマッチングを計算
  let results = clubs
    .filter(c => selectedType === "all" || c.type === selectedType)
    .map(c => ({
      name: c.name,
      score: score(user, c.data)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2); // 上位2件を取得

  try {
    // 3. Supabaseにユーザーデータを保存
    const { data: userRow, error: userError } = await supabaseClient
      .from("users")
      .insert([{
        type: selectedType,
        ans_freq: user[0],
        ans_serious: user[1],
        ans_atmosphere: user[2],
        ans_relationship: user[3],
        ans_cost: user[4]
      }])
      .select()
      .single();

    // エラーがあればcatchブロックへ飛ばす
    if (userError) throw new Error(`[User保存エラー] ${userError.message}`);

    // 4. Supabaseに結果データを保存
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

    // 5. 画面に結果を表示
    // (r.score / 5) * 100 でパーセント表示にする
    resultDiv.innerHTML = results.map((r, i) => `
      <div class="result-card">
        <span style="color: #666; font-size: 0.9em;">${i === 0 ? "🏆 第1希望" : "✨ 第2希望"}</span><br>
        <strong style="font-size: 1.4em; display: inline-block; margin: 10px 0;">${r.name}</strong><br>
        マッチ度: <strong style="color: #007bff; font-size: 1.2em;">${((r.score / 5) * 100).toFixed(0)}%</strong>
      </div>
    `).join("");

  } catch (error) {
    // 6. エラーが発生した場合の処理
    console.error("Supabaseエラー:", error);
    resultDiv.innerHTML = `
      <div class="error-message">
        <strong>データ保存エラー</strong><br>
        <small>${error.message}</small><br>
        ※SupabaseのRLS（Row Level Security）設定で、匿名ユーザーの追加(Insert)が許可されているか確認してください。
      </div>`;
  } finally {
    // 処理が終わったらボタンを元に戻す
    btn.disabled = false;
    btn.textContent = "診断する";
  }
}
