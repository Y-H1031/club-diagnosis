// =========================
// Supabase設定
// =========================
const supabaseClient = supabase.createClient(
  "https://YOUR_PROJECT.supabase.co",
  "YOUR_ANON_KEY"
);

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
function sliderHTML(id,label){
  return `
  <div class="card">
    <p>${label}：<span id="${id}Val">3</span></p>
    <input type="range" id="${id}" min="1" max="5" value="3">
  </div>`;
}

document.getElementById("sliders").innerHTML =
  sliderHTML("freq","頻度") +
  sliderHTML("serious","ガチ度") +
  sliderHTML("atmos","雰囲気") +
  sliderHTML("rel","人間関係") +
  sliderHTML("cost","費用");

["freq","serious","atmos","rel","cost"].forEach(id=>{
  const s=document.getElementById(id);
  const v=document.getElementById(id+"Val");
  s.addEventListener("input",()=>v.textContent=s.value);
});

// =========================
// タイプ
// =========================
function setType(type,btn){
  selectedType = type;
  document.querySelectorAll(".type-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}

// =========================
// スコア
// =========================
function score(user,club){
  let sum=0;
  for(let i=0;i<5;i++){
    sum += 1 - Math.abs(user[i]-club[i])/4;
  }
  return sum;
}

// =========================
// メイン処理
// =========================
async function calculate(){

  document.getElementById("result").innerHTML="診断中...";

  const user = [
    Number(freq.value),
    Number(serious.value),
    Number(atmos.value),
    Number(rel.value),
    Number(cost.value)
  ];

  let results = clubs
    .filter(c => selectedType === "all" || c.type === selectedType)
    .map(c => ({
      name: c.name,
      score: score(user, c.data)
    }))
    .sort((a,b)=>b.score-a.score)
    .slice(0,2);

  // Supabase保存（※RLS前提）
  const { data: userRow } = await supabaseClient
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

  if(userRow){
    await supabaseClient.from("results").insert(
      results.map((r,i)=>({
        user_id: userRow.id,
        rank: i+1,
        club_name: r.name,
        score: r.score
      }))
    );
  }

  // 表示
  document.getElementById("result").innerHTML =
    results.map((r,i)=>`
      <div class="result-card">
        ${i===0?"🏆第1希望":"第2希望"}<br>
        <strong>${r.name}</strong><br>
        ${(r.score*100).toFixed(0)}%
      </div>
    `).join("");
}