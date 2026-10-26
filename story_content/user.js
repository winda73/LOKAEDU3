function ExecuteScript(strId)
{
  switch (strId)
  {
      case "6rIGVSCWfcu":
        Script1();
        break;
      case "5cPvFdEjlj0":
        Script2();
        break;
      case "5q092H000tF":
        Script3();
        break;
  }
}

function Script1()
{
  (function () {
  // Tutup scanner lama jika masih terbuka
  if (window.closeARFlashcard) {
    window.closeARFlashcard();
  }

  // Buat tampilan scanner
  const overlay = document.createElement("div");
  overlay.id = "ar-flashcard-overlay";

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    background: "#000",
    zIndex: "999999",
    fontFamily: "Arial, sans-serif"
  });

  overlay.innerHTML = `
    <div style="
      position:absolute;top:12px;left:12px;right:12px;
      z-index:10;display:flex;gap:8px;align-items:center;
      justify-content:space-between;">
      <div style="color:white;font-size:16px;font-weight:bold;">
        AR Flashcard Scanner
      </div>
      <div style="display:flex;gap:8px;">
        <button id="ar-flash-toggle"
          style="padding:10px;border:0;border-radius:8px;">
          Flash
        </button>
        <button id="ar-close"
          style="padding:10px;border:0;border-radius:8px;">
          Tutup ✕
        </button>
      </div>
    </div>

    <div id="ar-status" style="
      position:absolute;bottom:20px;left:12px;right:12px;
      z-index:10;color:white;text-align:center;
      background:#0009;padding:12px;border-radius:8px;">
      Memuat AR...
    </div>

    <div id="ar-scene-container"
      style="position:absolute;inset:0;"></div>
  `;

  document.body.appendChild(overlay);

  const status = overlay.querySelector("#ar-status");
  const sceneContainer =
    overlay.querySelector("#ar-scene-container");

  let cameraTrack = null;
  let scene = null;
  let closed = false;

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  // Fungsi menutup kamera dan scanner
  window.closeARFlashcard = function () {
    closed = true;

    try {
      if (cameraTrack) {
        cameraTrack.stop();
      }

      if (scene && scene.systems &&
          scene.systems.arjs) {
        scene.systems.arjs.dispose();
      }

      // Hentikan juga track kamera yang ditemukan
      overlay.querySelectorAll("video").forEach(video => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => {
            track.stop();
          });
          video.srcObject = null;
        }
      });
    } catch (e) {
      console.warn("Pembersihan kamera:", e);
    }

    overlay.remove();
    window.closeARFlashcard = null;
  };

  overlay.querySelector("#ar-close").onclick =
    window.closeARFlashcard;

  // Tombol flash kamera (jika didukung perangkat)
  overlay.querySelector("#ar-flash-toggle").onclick =
    async function () {
      const video = overlay.querySelector("video");
      const track =
        cameraTrack ||
        (video && video.srcObject &&
          video.srcObject.getVideoTracks()[0]);

      if (!track) {
        setStatus("Kamera belum siap.");
        return;
      }

      try {
        const capabilities =
          track.getCapabilities
            ? track.getCapabilities()
            : {};

        if (!capabilities.torch) {
          setStatus(
            "Flash tidak didukung browser/perangkat ini."
          );
          return;
        }

        const settings = track.getSettings();
        const nextTorch = !settings.torch;

        await track.applyConstraints({
          advanced: [{ torch: nextTorch }]
        });

        setStatus(
          nextTorch ? "Flash aktif." : "Flash mati."
        );
      } catch (e) {
        setStatus("Flash tidak dapat diaktifkan.");
      }
    };

  // Memuat library secara berurutan
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Gagal memuat library: " + src));
      document.head.appendChild(script);
    });
  }

  async function startAR() {
    try {
      setStatus("Memuat library AR...");

      await loadScript(
        "https://aframe.io/releases/1.6.0/aframe.min.js"
      );

      if (closed) return;

      await loadScript(
        "https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js"
      );

      if (closed) return;

      // Membuat scene AR dengan marker Hiro
      sceneContainer.innerHTML = `
        <a-scene
          embedded
          vr-mode-ui="enabled: false"
          renderer="antialias: true; alpha: true"
          arjs="sourceType: webcam;
                debugUIEnabled: false;
                trackingMethod: best;">

          <a-marker
            preset="hiro"
            emitevents="true">

            <a-box
              position="0 0.5 0"
              material="color: #00D1FF; metalness: 0.2;"
              animation="
                property: rotation;
                to: 0 360 0;
                loop: true;
                dur: 4000">
            </a-box>

            <a-text
              value="AR FLASHCARD"
              position="-0.8 1.3 0"
              color="#FFFFFF"
              align="center"
              width="4">
            </a-text>

            <a-text
              value="Belajar dengan AR!"
              position="-0.8 1.0 0"
              color="#FFFF00"
              align="center"
              width="4">
            </a-text>

          </a-marker>

          <a-entity camera></a-entity>
        </a-scene>
      `;

      scene = sceneContainer.querySelector("a-scene");

      scene.addEventListener("loaded", function () {
        if (closed) return;
        setStatus(
          "Arahkan kamera ke marker Hiro pada flashcard."
        );
      }, { once: true });

      scene.addEventListener(
        "markerFound",
        function () {
          if (!closed) {
            setStatus("Flashcard terdeteksi!");
          }
        }
      );

      scene.addEventListener(
        "markerLost",
        function () {
          if (!closed) {
            setStatus("Arahkan kamera ke flashcard.");
          }
        }
      );

      // Deteksi track kamera untuk fungsi flash
      const findCamera = setInterval(() => {
        if (closed) {
          clearInterval(findCamera);
          return;
        }

        const video = overlay.querySelector("video");

        if (video && video.srcObject) {
          const tracks =
            video.srcObject.getVideoTracks();

          if (tracks.length) {
            cameraTrack = tracks[0];
            clearInterval(findCamera);
          }
        }
      }, 500);

    } catch (error) {
      console.error(error);
      setStatus(
        "Gagal membuka AR. Periksa koneksi internet, " +
        "izin kamera, dan alamat HTTPS."
      );
    }
  }

  startAR();
})();
}

function Script2()
{
  <!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Menjelajah Kearifan Lokal</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #1b2a49;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    color: white;
  }
  #gameContainer {
    width: 100%;
    max-width: 900px;
    position: relative;
  }
  canvas {
    width: 100%;
    display: block;
    border-radius: 12px;
    background: #87ceeb;
    box-shadow: 0 10px 30px rgba(0,0,0,.35);
  }
  .screen {
    position: absolute;
    inset: 0;
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 20px;
    background: rgba(10, 20, 40, .88);
    border-radius: 12px;
  }
  .screen.active { display: flex; }
  h1 {
    margin: 0 0 10px;
    font-size: clamp(28px, 6vw, 52px);
    color: #ffd166;
    text-shadow: 2px 3px 0 #7a4b00;
  }
  p { max-width: 620px; line-height: 1.5; }
  button {
    font-size: 18px;
    font-weight: bold;
    padding: 12px 28px;
    margin: 8px;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    background: #ffd166;
    color: #3b2600;
    transition: transform .15s, background .15s;
  }
  button:hover { transform: scale(1.05); background: #ffe08a; }
  .controls {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  .touch-btn {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: rgba(255,255,255,.75);
    color: #222;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    touch-action: none;
  }
  .question-box {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: min(92%, 700px);
    background: rgba(255,255,255,.96);
    color: #222;
    border-radius: 14px;
    padding: 14px;
    display: none;
  }
  .question-box.active { display: block; }
  .answer {
    display: block;
    width: 100%;
    margin: 6px 0;
    background: #e8f1ff;
    color: #17325c;
    border: 2px solid #4a7bd0;
    border-radius: 10px;
  }
  .answer:hover { background: #cfe0ff; }
  .feedback {
    font-weight: bold;
    margin-top: 8px;
    min-height: 24px;
  }
  .correct { color: #128a3a; }
  .wrong { color: #c62828; }
  .hud {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,.55);
    padding: 8px 12px;
    border-radius: 10px;
    font-weight: bold;
  }
</style>
</head>
<body>

<div id="gameContainer">
  <canvas id="gameCanvas" width="900" height="500"></canvas>

  <div class="hud" id="hud">Soal: 0/10 | Benar: 0</div>

  <!-- Menu Utama -->
  <div class="screen active" id="menuScreen">
    <h1>MENJELAJAH KEARIFAN LOKAL</h1>
    <p>
      Bantu tokoh kita melewati rintangan dan menjawab 10 soal IPS tentang
      <b>kearifan lokal di tengah globalisasi</b>. Jawab dengan benar untuk
      membuka jalan menuju garis finish!
    </p>
    <button onclick="startGame()">START</button>
  </div>

  <!-- Kotak Soal -->
  <div class="question-box" id="questionBox">
    <div id="questionText"></div>
    <div id="answerButtons"></div>
    <div class="feedback" id="feedback"></div>
    <button id="continueBtn" style="display:none" onclick="closeQuestion()">Lanjutkan</button>
  </div>

  <!-- Layar Akhir -->
  <div class="screen" id="endScreen">
    <h1>PERMAINAN SELESAI!</h1>
    <p id="resultText"></p>
    <button onclick="backToMenu()">Kembali ke Menu Utama</button>
  </div>

  <!-- Kontrol Sentuh -->
  <div class="controls" id="touchControls" style="display:none">
    <div class="touch-btn" id="leftBtn">◀</div>
    <div class="touch-btn" id="jumpBtn">▲</div>
    <div class="touch-btn" id="rightBtn">▶</div>
  </div>
</div>

<script>
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menuScreen = document.getElementById("menuScreen");
const endScreen = document.getElementById("endScreen");
const questionBox = document.getElementById("questionBox");
const questionText = document.getElementById("questionText");
const answerButtons = document.getElementById("answerButtons");
const feedback = document.getElementById("feedback");
const continueBtn = document.getElementById("continueBtn");
const hud = document.getElementById("hud");
const touchControls = document.getElementById("touchControls");

const questions = [
  {
    q: "Kearifan lokal adalah ...",
    a: ["Nilai dan kebiasaan baik yang diwariskan masyarakat", "Teknologi modern dari luar negeri", "Kebijakan perdagangan internasional", "Gaya hidup masyarakat kota"],
    c: 0
  },
  {
    q: "Contoh kearifan lokal dalam menjaga lingkungan adalah ...",
    a: ["Menebang hutan secara besar-besaran", "Membuang sampah ke sungai", "Sistem sasi dalam mengelola hasil laut", "Menggunakan pestisida berlebihan"],
    c: 2
  },
  {
    q: "Gotong royong merupakan kearifan lokal yang bermanfaat untuk ...",
    a: ["Meningkatkan individualisme", "Memperkuat kerja sama masyarakat", "Mengurangi solidaritas", "Mendorong persaingan tidak sehat"],
    c: 1
  },
  {
    q: "Dampak positif globalisasi bagi kearifan lokal adalah ...",
    a: ["Kearifan lokal bisa diperkenalkan ke dunia", "Budaya lokal pasti hilang", "Masyarakat tidak boleh memakai teknologi", "Nilai lokal menjadi tidak penting"],
    c: 0
  },
  {
    q: "Sikap yang tepat menghadapi globalisasi adalah ...",
    a: ["Menerima semua budaya asing tanpa seleksi", "Menolak seluruh teknologi", "Selektif serta tetap menjaga identitas budaya", "Meniru budaya asing sepenuhnya"],
    c: 2
  },
  {
    q: "Upacara Nyepi di Bali mengajarkan nilai ...",
    a: ["Perilaku konsumtif", "Introspeksi diri dan pengendalian diri", "Kompetisi ekonomi", "Eksploitasi alam"],
    c: 1
  },
  {
    q: "Tradisi musyawarah dalam pengambilan keputusan mencerminkan nilai ...",
    a: ["Otoritarianisme", "Demokrasi dan kebersamaan", "Konsumerisme", "Individualisme"],
    c: 1
  },
  {
    q: "Kearifan lokal dapat bertahan di era globalisasi melalui ...",
    a: ["Dokumentasi, pendidikan, dan pemanfaatan media digital", "Dilarang dipelajari generasi muda", "Ditinggalkan agar lebih modern", "Hanya dilakukan oleh orang tua"],
    c: 0
  },
  {
    q: "Contoh penerapan kearifan lokal dalam kehidupan modern adalah ...",
    a: ["Menggunakan aplikasi digital untuk mempromosikan batik", "Membuang budaya daerah", "Menolak kerja sama antarnegara", "Menghapus bahasa daerah"],
    c: 0
  },
  {
    q: "Manfaat menjaga kearifan lokal di tengah globalisasi adalah ...",
    a: ["Membentuk identitas bangsa dan kebanggaan budaya", "Menyebabkan hilangnya jati diri", "Membuat masyarakat tidak produktif", "Menghalangi pembangunan"],
    c: 0
  }
];

let keys = {};
let player, platforms, questionPoints, goal, currentQuestion, correctCount, questionIndex, gameRunning, cameraX;

function startGame() {
  menuScreen.classList.remove("active");
  endScreen.classList.remove("active");
  questionBox.classList.remove("active");
  touchControls.style.display = "flex";

  player = { x: 50, y: 380, w: 34, h: 44, vx: 0, vy: 0, onGround: false, color: "#e63946" };
  platforms = [
    { x: 0, y: 430, w: 900, h: 70, color: "#2d6a4f" },
    { x: 260, y: 350, w: 150, h: 20, color: "#8b5e34" },
    { x: 480, y: 290, w: 150, h: 20, color: "#8b5e34" },
    { x: 700, y: 230, w: 150, h: 20, color: "#8b5e34" },
    { x: 950, y: 350, w: 150, h: 20, color: "#8b5e34" },
    { x: 1180, y: 280, w: 150, h: 20, color: "#8b5e34" },
    { x: 1400, y: 350, w: 150, h: 20, color: "#8b5e34" },
    { x: 1630, y: 280, w: 150, h: 20, color: "#8b5e34" },
    { x: 1860, y: 350, w: 150, h: 20, color: "#8b5e34" },
    { x: 2090, y: 280, w: 150, h: 20, color: "#8b5e34" },
    { x: 2320, y: 350, w: 150, h: 20, color: "#8b5e34" },
    { x: 2550, y: 430, w: 500, h: 70, color: "#2d6a4f" }
  ];

  questionPoints = [
    { x: 300, y: 300, done: false },
    { x: 520, y: 240, done: false },
    { x: 740, y: 180, done: false },
    { x: 990, y: 300, done: false },
    { x: 1220, y: 230, done: false },
    { x: 1440, y: 300, done: false },
    { x: 1670, y: 230, done: false },
    { x: 1900, y: 300, done: false },
    { x: 2130, y: 230, done: false },
    { x: 2360, y: 300, done: false }
  ];

  goal = { x: 2950, y: 330, w: 30, h: 100 };
  currentQuestion = 0;
  correctCount = 0;
  questionIndex = 0;
  gameRunning = true;
  cameraX = 0;

  updateHud();
  requestAnimationFrame(gameLoop);
}

function backToMenu() {
  gameRunning = false;
  endScreen.classList.remove("active");
  questionBox.classList.remove("active");
  touchControls.style.display = "none";
  menuScreen.classList.add("active");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateHud() {
  hud.textContent = `Soal: ${questionIndex}/10 | Benar: ${correctCount}`;
}

function openQuestion(index) {
  gameRunning = false;
  currentQuestion = index;
  const item = questions[index];

  questionText.innerHTML = `<b>Soal ${index + 1} dari 10</b><br><br>${item.q}`;
  answerButtons.innerHTML = "";
  feedback.textContent = "";
  feedback.className = "feedback";
  continueBtn.style.display = "none";

  item.a.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.textContent = String.fromCharCode(65 + i) + ". " + text;
    btn.onclick = () => checkAnswer(i);
    answerButtons.appendChild(btn);
  });

  questionBox.classList.add("active");
}

function checkAnswer(choice) {
  const item = questions[currentQuestion];
  const buttons = answerButtons.querySelectorAll("button");

  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === item.c) b.style.background = "#b7e4c7";
    if (i === choice && choice !== item.c) b.style.background = "#ffc9c9";
  });

  if (choice === item.c) {
    correctCount++;
    feedback.textContent = "Selamat! Jawabanmu benar. 🎉";
    feedback.className = "feedback correct";
  } else {
    feedback.textContent = "Salah. Jawaban yang benar adalah " + String.fromCharCode(65 + item.c) + ".";
    feedback.className = "feedback wrong";
  }

  questionIndex++;
  updateHud();
  continueBtn.style.display = "inline-block";
}

function closeQuestion() {
  questionBox.classList.remove("active");
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

function finishGame() {
  gameRunning = false;
  touchControls.style.display = "none";
  document.getElementById("resultText").innerHTML =
    `Kamu menjawab <b>${correctCount} dari 10 soal</b> dengan benar.<br>` +
    (correctCount >= 8 ? "Luar biasa! Kamu memahami kearifan lokal dengan baik." :
     correctCount >= 5 ? "Bagus! Terus pelajari kearifan lokal di tengah globalisasi." :
     "Jangan menyerah, ayo pelajari kembali materi kearifan lokal!");
  endScreen.classList.add("active");
}

function updatePlayer() {
  const speed = 4.2;
  player.vx = 0;

  if (keys["ArrowLeft"]) player.vx = -speed;
  if (keys["ArrowRight"]) player.vx = speed;
  if (keys["ArrowUp"] && player.onGround) {
    player.vy = -13;
    player.onGround = false;
  }

  player.vy += 0.55;
  player.x += player.vx;
  player.y += player.vy;
  player.onGround = false;

  platforms.forEach(p => {
    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y < p.y + p.h &&
      player.y + player.h > p.y &&
      player.vy >= 0
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  });

  if (player.y > canvas.height + 100) {
    player.x = 50;
    player.y = 380;
    player.vy = 0;
  }

  questionPoints.forEach((point, i) => {
    if (!point.done &&
        Math.abs(player.x - point.x) < 35 &&
        Math.abs(player.y - point.y) < 45) {
      point.done = true;
      openQuestion(i);
    }
  });

  if (
    player.x < goal.x + goal.w &&
    player.x + player.w > goal.x &&
    player.y < goal.y + goal.h &&
    player.y + player.h > goal.y
  ) {
    finishGame();
  }

  cameraX = Math.max(0, Math.min(player.x - canvas.width / 2 + 50, 3050 - canvas.width));
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Awan
  ctx.fillStyle = "white";
  for (let i = 0; i < 8; i++) {
    const cx = i * 400 - cameraX * 0.3;
    ctx.beginPath();
    ctx.arc(cx % 3600, 70, 28, 0, Math.PI * 2);
    ctx.arc(cx % 3600 + 30, 60, 34, 0, Math.PI * 2);
    ctx.arc(cx % 3600 + 62, 70, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(-cameraX, 0);

  platforms.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  // Tanda tanya
  questionPoints.forEach(point => {
    if (!point.done) {
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a3d00";
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";
      ctx.fillText("?", point.x, point.y + 8);
    }
  });

  // Garis finish
  ctx.fillStyle = "#222";
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(goal.x, goal.y + i * 18, goal.w, 9);
  }
  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("FINISH", goal.x + 15, goal.y - 12);

  // Karakter
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(player.x + 7, player.y + 8, 8, 8);
  ctx.fillRect(player.x + 20, player.y + 8, 8, 8);

  ctx.restore();
}

function gameLoop() {
  if (!gameRunning) return;
  updatePlayer();
  draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
});

document.addEventListener("keyup", e => keys[e.key] = false);

function bindTouch(id, key) {
  const el = document.getElementById(id);
  const start = e => { e.preventDefault(); keys[key] = true; };
  const end = e => { e.preventDefault(); keys[key] = false; };
  el.addEventListener("touchstart", start);
  el.addEventListener("touchend", end);
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", end);
  el.addEventListener("mouseleave", end);
}

bindTouch("leftBtn", "ArrowLeft");
bindTouch("rightBtn", "ArrowRight");
bindTouch("jumpBtn", "ArrowUp");
</script>
</body>
</html>
}

function Script3()
{
  (function () {
  // Tutup scanner lama jika masih terbuka
  if (window.closeARFlashcard) {
    window.closeARFlashcard();
  }

  // Buat tampilan scanner
  const overlay = document.createElement("div");
  overlay.id = "ar-flashcard-overlay";

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    background: "#000",
    zIndex: "999999",
    fontFamily: "Arial, sans-serif"
  });

  overlay.innerHTML = `
    <div style="
      position:absolute;top:12px;left:12px;right:12px;
      z-index:10;display:flex;gap:8px;align-items:center;
      justify-content:space-between;">
      <div style="color:white;font-size:16px;font-weight:bold;">
        AR Flashcard Scanner
      </div>
      <div style="display:flex;gap:8px;">
        <button id="ar-flash-toggle"
          style="padding:10px;border:0;border-radius:8px;">
          Flash
        </button>
        <button id="ar-close"
          style="padding:10px;border:0;border-radius:8px;">
          Tutup ✕
        </button>
      </div>
    </div>

    <div id="ar-status" style="
      position:absolute;bottom:20px;left:12px;right:12px;
      z-index:10;color:white;text-align:center;
      background:#0009;padding:12px;border-radius:8px;">
      Memuat AR...
    </div>

    <div id="ar-scene-container"
      style="position:absolute;inset:0;"></div>
  `;

  document.body.appendChild(overlay);

  const status = overlay.querySelector("#ar-status");
  const sceneContainer =
    overlay.querySelector("#ar-scene-container");

  let cameraTrack = null;
  let scene = null;
  let closed = false;

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  // Fungsi menutup kamera dan scanner
  window.closeARFlashcard = function () {
    closed = true;

    try {
      if (cameraTrack) {
        cameraTrack.stop();
      }

      if (scene && scene.systems &&
          scene.systems.arjs) {
        scene.systems.arjs.dispose();
      }

      // Hentikan juga track kamera yang ditemukan
      overlay.querySelectorAll("video").forEach(video => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => {
            track.stop();
          });
          video.srcObject = null;
        }
      });
    } catch (e) {
      console.warn("Pembersihan kamera:", e);
    }

    overlay.remove();
    window.closeARFlashcard = null;
  };

  overlay.querySelector("#ar-close").onclick =
    window.closeARFlashcard;

  // Tombol flash kamera (jika didukung perangkat)
  overlay.querySelector("#ar-flash-toggle").onclick =
    async function () {
      const video = overlay.querySelector("video");
      const track =
        cameraTrack ||
        (video && video.srcObject &&
          video.srcObject.getVideoTracks()[0]);

      if (!track) {
        setStatus("Kamera belum siap.");
        return;
      }

      try {
        const capabilities =
          track.getCapabilities
            ? track.getCapabilities()
            : {};

        if (!capabilities.torch) {
          setStatus(
            "Flash tidak didukung browser/perangkat ini."
          );
          return;
        }

        const settings = track.getSettings();
        const nextTorch = !settings.torch;

        await track.applyConstraints({
          advanced: [{ torch: nextTorch }]
        });

        setStatus(
          nextTorch ? "Flash aktif." : "Flash mati."
        );
      } catch (e) {
        setStatus("Flash tidak dapat diaktifkan.");
      }
    };

  // Memuat library secara berurutan
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error("Gagal memuat library: " + src));
      document.head.appendChild(script);
    });
  }

  async function startAR() {
    try {
      setStatus("Memuat library AR...");

      await loadScript(
        "https://aframe.io/releases/1.6.0/aframe.min.js"
      );

      if (closed) return;

      await loadScript(
        "https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js"
      );

      if (closed) return;

      // Membuat scene AR dengan marker Hiro
      sceneContainer.innerHTML = `
        <a-scene
          embedded
          vr-mode-ui="enabled: false"
          renderer="antialias: true; alpha: true"
          arjs="sourceType: webcam;
                debugUIEnabled: false;
                trackingMethod: best;">

          <a-marker
            preset="hiro"
            emitevents="true">

            <a-box
              position="0 0.5 0"
              material="color: #00D1FF; metalness: 0.2;"
              animation="
                property: rotation;
                to: 0 360 0;
                loop: true;
                dur: 4000">
            </a-box>

            <a-text
              value="AR FLASHCARD"
              position="-0.8 1.3 0"
              color="#FFFFFF"
              align="center"
              width="4">
            </a-text>

            <a-text
              value="Belajar dengan AR!"
              position="-0.8 1.0 0"
              color="#FFFF00"
              align="center"
              width="4">
            </a-text>

          </a-marker>

          <a-entity camera></a-entity>
        </a-scene>
      `;

      scene = sceneContainer.querySelector("a-scene");

      scene.addEventListener("loaded", function () {
        if (closed) return;
        setStatus(
          "Arahkan kamera ke marker Hiro pada flashcard."
        );
      }, { once: true });

      scene.addEventListener(
        "markerFound",
        function () {
          if (!closed) {
            setStatus("Flashcard terdeteksi!");
          }
        }
      );

      scene.addEventListener(
        "markerLost",
        function () {
          if (!closed) {
            setStatus("Arahkan kamera ke flashcard.");
          }
        }
      );

      // Deteksi track kamera untuk fungsi flash
      const findCamera = setInterval(() => {
        if (closed) {
          clearInterval(findCamera);
          return;
        }

        const video = overlay.querySelector("video");

        if (video && video.srcObject) {
          const tracks =
            video.srcObject.getVideoTracks();

          if (tracks.length) {
            cameraTrack = tracks[0];
            clearInterval(findCamera);
          }
        }
      }, 500);

    } catch (error) {
      console.error(error);
      setStatus(
        "Gagal membuka AR. Periksa koneksi internet, " +
        "izin kamera, dan alamat HTTPS."
      );
    }
  }

  startAR();
})();
}

