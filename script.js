const screens = [...document.querySelectorAll(".screen")];
const dots = document.querySelector("#dots");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const musicBtn = document.querySelector("#musicBtn");
let page = 0;
let autoAdvanceTimer;
const bgMusic = new Audio("./assets/Soft Keys Drift.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.42;
let musicAutoStarted = false;
let musicManuallyStopped = false;

function stopMusic() {
  bgMusic.pause();
  musicManuallyStopped = true;
  musicBtn.classList.remove("playing");
  musicBtn.setAttribute("aria-pressed", "false");
  musicBtn.setAttribute("aria-label", "打开背景音乐");
}

async function startMusic() {
  musicManuallyStopped = false;
  await bgMusic.play();
  musicAutoStarted = true;
  musicBtn.classList.add("playing");
  musicBtn.setAttribute("aria-pressed", "true");
  musicBtn.setAttribute("aria-label", "关闭背景音乐");
}

async function autoStartMusic() {
  if (musicAutoStarted || musicManuallyStopped) return;
  try {
    await startMusic();
  } catch {
    document.addEventListener("pointerdown", handleFirstPointerForMusic, { once: true });
  }
}

function handleFirstPointerForMusic(event) {
  if (event.target.closest("#musicBtn")) return;
  autoStartMusic();
}

const shareLines = {
  poem: [
    "我家孩子最喜欢“诗画密室”，一个字选对，整幅画都会亮起来。",
    "今天玩到一个诗词小游戏，孩子为了点亮春天，主动把诗句读了好几遍。"
  ],
  idiom: [
    "我家孩子最喜欢“成语拼图”，一边找字一边看懂画里的成语。",
    "成语不是背出来的，是孩子在画里自己拼出来的，这个玩法挺有意思。"
  ],
  radical: [
    "我家孩子最喜欢“字形变变变”，点不同场景就能看见偏旁怎么变成新字。",
    "氵走到河边、海边、眼泪旁边，孩子一下就懂这些字有同一张脸。"
  ],
  maze: [
    "我家孩子最喜欢“填字闯关迷宫”，选对词语才走得到终点。",
    "这个迷宫关很抓人，词语选错就进死胡同，选对才一路通关。"
  ],
  detective: [
    "我家孩子最喜欢“书法侦探”，练字变成破案，字修好了门才会开。",
    "原来笔顺也能做成案件线索，孩子不是被催着写，是自己想把门打开。"
  ]
};
const gameNames = {
  poem: "诗画密室",
  idiom: "成语拼图",
  radical: "字形变变变",
  maze: "填字闯关迷宫",
  detective: "书法侦探"
};
const voteGames = Object.keys(gameNames);
const supabaseUrl = "https://cgryybmebglwehhymqbp.supabase.co";
const supabaseKey = "sb_publishable_lThi5k4681QHTunwmkPZow_-2Zz_3ep";
const voteCounts = Object.fromEntries(voteGames.map((game) => [game, 0]));
const selectedShareGames = new Set();
const pendingVotes = new Set();

function getVisitorId() {
  const saved = window.localStorage.getItem("kidGameVisitorId");
  if (saved) return saved;
  const next = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem("kidGameVisitorId", next);
  return next;
}

const visitorId = getVisitorId();

try {
  JSON.parse(window.localStorage.getItem("kidGameLikedGames") || "[]")
    .filter((game) => voteGames.includes(game))
    .forEach((game) => selectedShareGames.add(game));
} catch {
  window.localStorage.removeItem("kidGameLikedGames");
}

screens.forEach((_, index) => {
  const dot = document.createElement("span");
  dot.className = index === 0 ? "active" : "";
  dots.appendChild(dot);
});

function setPage(nextPage) {
  window.clearTimeout(autoAdvanceTimer);
  page = Math.max(0, Math.min(screens.length - 1, nextPage));
  screens.forEach((screen, index) => {
    screen.classList.toggle("active", index === page);
  });
  [...dots.children].forEach((dot, index) => {
    dot.classList.toggle("active", index === page);
  });
  prevBtn.style.visibility = page === 0 ? "hidden" : "visible";
  nextBtn.textContent = page === screens.length - 1 ? "↻" : "›";
}

function queueNextPage(delay = 1100) {
  const pageWhenAnswered = page;
  window.clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = window.setTimeout(() => {
    if (page === pageWhenAnswered && page < screens.length - 1) {
      setPage(page + 1);
    }
  }, delay);
}

prevBtn.addEventListener("click", () => setPage(page - 1));
nextBtn.addEventListener("click", () => {
  if (page === screens.length - 1) {
    setPage(0);
    return;
  }
  setPage(page + 1);
});

musicBtn.addEventListener("click", async () => {
  if (musicBtn.classList.contains("playing")) {
    stopMusic();
    return;
  }
  try {
    await startMusic();
  } catch {
    musicBtn.setAttribute("aria-label", "此浏览器暂不支持背景音乐");
  }
});

autoStartMusic();

document.querySelector('[data-quiz="poem"]').addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  window.clearTimeout(autoAdvanceTimer);
  document.querySelectorAll('[data-quiz="poem"] button').forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  const isRight = button.dataset.answer === "绿";
  const heroScreen = document.querySelector(".hero-screen");
  document.querySelector("#poemSlot").textContent = button.dataset.answer;
  heroScreen.classList.toggle("unlocked", isRight);
  heroScreen.classList.toggle("wrong", !isRight);
  document.querySelector("#poemResult").textContent = isRight
    ? "解锁成功：灯亮起来，柳色也醒了，孩子会记住“绿”是诗眼。"
    : "选错了：灯没有亮。没有扣分，再想想哪个字能点亮春天。";
  if (isRight) queueNextPage(1200);
});

const idiomTarget = ["画", "蛇", "添", "足"];
let idiomFound = [];
const radicalVisited = new Set(["河"]);
document.querySelector('[data-quiz="idiom"]').addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  window.clearTimeout(autoAdvanceTimer);
  const answer = button.dataset.answer;
  const strip = document.querySelector("#idiomStrip");
  const successBadge = document.querySelector("#idiomSuccess");
  strip.classList.remove("shake");
  if (!idiomTarget.includes(answer)) {
    idiomFound = [];
    document.querySelectorAll('[data-quiz="idiom"] button').forEach((item) => item.classList.remove("active"));
    document.querySelectorAll("#idiomStrip span").forEach((slot) => {
      slot.textContent = "?";
    });
    strip.classList.remove("complete");
    successBadge.classList.remove("show");
    button.classList.add("wrong");
    strip.classList.add("shake");
    document.querySelector("#idiomResult").textContent = `选到“${answer}”了，拼图重置。再从画面里找四个正确的字。`;
    window.setTimeout(() => button.classList.remove("wrong"), 520);
    return;
  }
  if (idiomTarget.includes(answer) && !idiomFound.includes(answer)) {
    idiomFound.push(answer);
    button.classList.add("active");
  }
  const ordered = idiomTarget.map((char) => (idiomFound.includes(char) ? char : "?"));
  document.querySelectorAll("#idiomStrip span").forEach((slot, index) => {
    slot.textContent = ordered[index];
  });
  const complete = idiomFound.length === 4;
  strip.classList.toggle("complete", complete);
  successBadge.classList.toggle("show", complete);
  document.querySelector("#idiomResult").textContent = idiomFound.length === 4
    ? "恭喜你回答正确：画蛇添足。画面里的“多余”就是成语意思。"
    : `已找到 ${idiomFound.length}/4 个字，再看看蛇的四周。`;
  if (complete) queueNextPage(1200);
});

document.querySelector('[data-quiz="radical"]').addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  window.clearTimeout(autoAdvanceTimer);
  document.querySelectorAll('[data-quiz="radical"] button').forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  radicalVisited.add(button.dataset.answer);
  const word = document.querySelector("#radicalWord");
  word.classList.remove("reveal");
  requestAnimationFrame(() => {
    word.textContent = button.dataset.answer;
    word.classList.add("reveal");
  });
  const scene = document.querySelector("#radicalScene");
  scene.classList.remove("river-scene", "sea-scene", "tear-scene");
  scene.classList.add({
    "河": "river-scene",
    "海": "sea-scene",
    "泪": "tear-scene"
  }[button.dataset.answer]);
  scene.setAttribute("aria-label", `${button.dataset.label}场景`);
  document.querySelector("#radicalResult").textContent = `${button.dataset.label}里出现“${button.dataset.answer}”：孩子会发现这些字都有同一张“脸”。`;
  if (radicalVisited.size === 3) queueNextPage(1200);
});

document.querySelector('[data-quiz="map"]').addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  window.clearTimeout(autoAdvanceTimer);
  document.querySelectorAll('[data-quiz="map"] button').forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  const isRight = button.dataset.answer === "right";
  const maze = document.querySelector("#mazeWrap");
  maze.classList.toggle("maze-solved", isRight);
  maze.classList.toggle("maze-dead", button.dataset.answer === "wrong-yin");
  maze.classList.toggle("maze-dead-alt", button.dataset.answer === "wrong-ying");
  document.querySelector("#mapBadge").textContent = isRight ? "走通了" : "没走通";
  const messages = {
    right: "通关成功：红线从柳岸一路走到花明，这条路走通了。",
    "wrong-yin": "走不通：红线停在“花阴”死胡同里，没有到达花明。",
    "wrong-ying": "走不通：红线绕到“花影”死胡同里，没有到达花明。"
  };
  document.querySelector("#mapResult").textContent = messages[button.dataset.answer];
  if (isRight) queueNextPage(1200);
});

document.querySelector('[data-quiz="case"]').addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  window.clearTimeout(autoAdvanceTimer);
  document.querySelectorAll('[data-quiz="case"] button').forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  const solved = button.dataset.answer === "right";
  const gate = document.querySelector("#caseBoard .gate");
  gate.classList.remove("error");
  void gate.offsetWidth;
  gate.classList.toggle("open", solved);
  if (!solved) {
    gate.classList.add("error");
    window.setTimeout(() => gate.classList.remove("error"), 430);
  }
  document.querySelector("#caseResult").textContent = solved
    ? "案子推进：门开了，孩子练的是笔顺，感受到的是破案。"
    : "线索不对：门锁晃了一下，还没有打开。再试试别的笔顺。";
  if (solved) queueNextPage(1100);
});

document.querySelector("#restartBtn").addEventListener("click", () => setPage(0));

function getVoteCount(game) {
  return voteCounts[game] || 0;
}

function renderPollChart() {
  const hasResults = selectedShareGames.size > 0;
  const maxVotes = Math.max(1, ...voteGames.map(getVoteCount));
  document.querySelector("#voteList").classList.toggle("has-results", hasResults);
  document.querySelectorAll(".vote-card").forEach((card) => {
    const game = card.dataset.game;
    const count = getVoteCount(game);
    card.classList.toggle("active", selectedShareGames.has(game));
    card.querySelector(".vote-copy > i em").style.width = hasResults ? `${Math.max(6, Math.round((count / maxVotes) * 100))}%` : "0%";
    card.querySelector("b").textContent = hasResults ? `${count}人` : "赞";
  });
}

function saveLikedGames() {
  window.localStorage.setItem("kidGameLikedGames", JSON.stringify([...selectedShareGames]));
}

async function fetchVoteCount(game) {
  const response = await fetch(`${supabaseUrl}/rest/v1/game_votes?game=eq.${encodeURIComponent(game)}&select=id`, {
    method: "HEAD",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count=exact"
    }
  });
  if (!response.ok) throw new Error(`Count failed: ${response.status}`);
  const range = response.headers.get("content-range") || "";
  return Number(range.split("/").pop()) || 0;
}

async function syncVoteCounts() {
  try {
    const counts = await Promise.all(voteGames.map((game) => fetchVoteCount(game)));
    voteGames.forEach((game, index) => {
      voteCounts[game] = counts[index];
    });
    renderPollChart();
  } catch {
    document.querySelector("#shareText").textContent = "真实点赞数暂时加载失败，稍后再试。";
  }
}

async function submitVote(game) {
  const response = await fetch(`${supabaseUrl}/rest/v1/game_votes?on_conflict=visitor_id,game`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal"
    },
    body: JSON.stringify({ game, visitor_id: visitorId })
  });
  if (!response.ok && response.status !== 409) {
    throw new Error(`Vote failed: ${response.status}`);
  }
}

function updateShareLine(randomize = false) {
  const games = [...selectedShareGames];
  if (games.length === 0) {
    document.querySelector("#shareText").textContent = "点一个或多个游戏，生成适合朋友圈的分享语。";
    return;
  }
  if (games.length === 1) {
    const lines = shareLines[games[0]];
    const line = randomize ? lines[Math.floor(Math.random() * lines.length)] : lines[0];
    document.querySelector("#shareText").textContent = `分享语：${line}`;
    return;
  }
  const names = games.map((game) => `“${gameNames[game]}”`).join("、");
  const endings = [
    `分享语：我给${names}点了赞，孩子一边玩一边把诗词、汉字和成语串起来了。`,
    `分享语：这几个关卡里，${names}最想继续玩，感觉很适合做成亲子文创小游戏。`
  ];
  document.querySelector("#shareText").textContent = randomize ? endings[1] : endings[0];
}

document.querySelector("#voteList").addEventListener("click", (event) => {
  const card = event.target.closest(".vote-card");
  if (!card) return;
  const game = card.dataset.game;
  if (selectedShareGames.has(game) || pendingVotes.has(game)) {
    updateShareLine(false);
    return;
  }
  pendingVotes.add(game);
  card.querySelector("b").textContent = "记录中";
  submitVote(game)
    .then(() => {
      selectedShareGames.add(game);
      pendingVotes.delete(game);
      saveLikedGames();
      updateShareLine(false);
      return syncVoteCounts();
    })
    .catch(() => {
      pendingVotes.delete(game);
      saveLikedGames();
      document.querySelector("#shareText").textContent = "这次点赞没有记上，可能是网络或数据库权限还没配置好。";
      renderPollChart();
    });
});

let touchStartX = 0;
document.addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0].clientX;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) < 58) return;
  setPage(page + (delta < 0 ? 1 : -1));
}, { passive: true });

setPage(0);
renderPollChart();
updateShareLine(false);
syncVoteCounts();
