const $ = id => document.getElementById(id);
const player = $('narration');
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let round = -1;
let records = [];
let classroom = classroomContent.current();
let muted = false;
let recognition = null;
let session = 0;
let audioToken = 0;
let transitionTimer = null;
let reviewing = false;
let currentClip = 'welcome';
let afterPlayback = null;

function stopAudio() {
  audioToken++;
  player.pause();
  player.onended = null;
  player.onerror = null;
  afterPlayback = null;
}

function playClip(clip, onComplete = null) {
  stopAudio();
  currentClip = clip;
  afterPlayback = onComplete;
  const token = audioToken;
  $('avatarStatus').textContent = muted ? '声音已关闭' : '正在加载声音';
  if (muted) return;
  player.src = `assets/audio/${clip}.mp3`;
  player.onended = () => {
    if (token !== audioToken) return;
    $('avatarStatus').textContent = round === 3 ? '课堂完成' : '等你回答';
    const complete = afterPlayback;
    afterPlayback = null;
    complete?.();
  };
  const failed = () => {
    if (token !== audioToken) return;
    $('avatarStatus').textContent = '点击重听播放声音';
    if (afterPlayback) {
      const complete = afterPlayback;
      afterPlayback = null;
      transitionTimer = setTimeout(complete, 5500);
    }
  };
  player.onerror = failed;
  player.play().then(() => {
    if (token === audioToken) $('avatarStatus').textContent = '正在讲解';
  }).catch(failed);
}

function render() {
  $('start').hidden = round !== -1;
  $('answerForm').hidden = round < 0 || round > 2;
  $('ending').hidden = round !== 3;
  $('reset').hidden = round < 0;
  for (const id of ['submit', 'skip', 'mic', 'answer']) $(id).disabled = reviewing;
  $('round').textContent = round === 3 ? '已完成' : `第 ${round + 1} / 3 轮`;
  $('history').replaceChildren();
  records.forEach(record => {
    const paragraph = document.createElement('p');
    paragraph.textContent = `第${record.round}轮\n${record.question}\n学生：${record.answer}\n老师：${record.feedback}`;
    $('history').append(paragraph);
  });
}

function showQuestion() {
  reviewing = false;
  render();
  $('teacher').textContent = round === 3 ? classroom.closing : classroom.lesson[round].question;
  $('avatarStatus').textContent = round === 3 ? '课堂完成' : '等你回答';
  $('status').textContent = '';
  $('answer').value = '';
  playClip(round === 3 ? 'closing' : `question-${round + 1}`);
}

function begin() {
  session++;
  clearTimeout(transitionTimer);
  recognition?.abort();
  stopAudio();
  records = [];
  classroom = classroomContent.current();
  round = 0;
  reviewing = false;
  render();
  $('answer').value = '';
  $('status').textContent = '';
  $('teacher').textContent = classroom.lesson[0].question;
  playClip('opening');
}

function submit(answer) {
  if (reviewing || round < 0 || round > 2) return;
  answer = answer.trim();
  if (!answer) { $('status').textContent = '先说一说或写下你的想法吧。'; return; }
  recognition?.abort();
  const result = assess(round, answer);
  if (result === 'unrelated') {
    $('status').textContent = '我们先完成这三轮关于《杨氏之子》的问答哦。';
    playClip('reminder');
    return;
  }
  const item = classroom.lesson[round];
  const feedback = result === 'good' ? item.good : item.help;
  records.push({ round: round + 1, question: item.question, answer, feedback });
  reviewing = true;
  render();
  $('teacher').textContent = feedback;
  $('status').textContent = '听听老师的点评';
  const currentSession = session;
  const advance = () => {
    if (session !== currentSession || !reviewing) return;
    clearTimeout(transitionTimer);
    round++;
    showQuestion();
  };
  playClip(`${result === 'good' ? 'good' : 'help'}-${round + 1}`, advance);
  if (muted) transitionTimer = setTimeout(advance, 5500);
}

$('start').onclick = begin;
$('again').onclick = begin;
$('reset').onclick = begin;
$('answerForm').onsubmit = event => { event.preventDefault(); submit($('answer').value); };
$('skip').onclick = () => submit('我还没想好');
$('replay').onclick = () => {
  const continuation = afterPlayback;
  if (continuation && !muted) clearTimeout(transitionTimer);
  playClip(currentClip, continuation);
};
$('sound').onclick = () => {
  muted = !muted;
  $('sound').textContent = muted ? '声音关' : '声音开';
  $('sound').setAttribute('aria-pressed', String(!muted));
  if (muted) {
    const continuation = afterPlayback;
    stopAudio();
    $('avatarStatus').textContent = '声音已关闭';
    if (continuation) transitionTimer = setTimeout(continuation, 5500);
  }
};
$('help').onclick = () => $('helpDialog').showModal();
$('closeHelp').onclick = () => $('helpDialog').close();
$('fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { $('fullscreen').textContent = '请使用浏览器全屏'; }
};

$('mic').onclick = () => {
  if (!Recognition) { $('status').textContent = '此浏览器无法语音识别，请打字回答。'; return; }
  if (recognition) { recognition.stop(); return; }
  stopAudio();
  const currentSession = session;
  const currentRound = round;
  const recorder = new Recognition();
  recognition = recorder;
  recorder.lang = 'zh-CN';
  recorder.interimResults = false;
  recorder.continuous = false;
  recorder.onstart = () => {
    $('mic').textContent = '结束录入';
    $('mic').classList.add('listening');
    $('status').textContent = '正在听，请说出你的回答…';
  };
  recorder.onresult = event => {
    if (session !== currentSession || round !== currentRound || reviewing) return;
    $('answer').value = Array.from(event.results).map(result => result[0].transcript).join('');
    $('status').textContent = '检查文字后，点击提交。';
  };
  recorder.onerror = event => {
    if (session !== currentSession || round !== currentRound || reviewing) return;
    const messages = {
      'not-allowed': '请在地址栏的站点权限中允许麦克风。',
      'service-not-allowed': '浏览器未允许语音识别服务，请打字回答。',
      'audio-capture': '无法读取麦克风，请检查设备连接。',
      'network': '无法连接语音识别服务，请打字回答。',
      'no-speech': '没有听清，请再试一次。',
      'aborted': '',
      'language-not-supported': '浏览器未提供中文识别，请打字回答。'
    };
    $('status').textContent = messages[event.error] ?? `语音识别失败（${event.error}），请打字回答。`;
  };
  recorder.onend = () => {
    if (recognition !== recorder) return;
    recognition = null;
    $('mic').textContent = '语音回答';
    $('mic').classList.remove('listening');
  };
  try { recorder.start(); }
  catch { recognition = null; $('status').textContent = '无法启动语音，请打字回答。'; }
};

$('download').onclick = () => {
  const text = records.map(record => `第${record.round}轮\n${record.question}\n学生：${record.answer}\n老师：${record.feedback}`).join('\n\n');
  const url = URL.createObjectURL(new Blob([`《杨氏之子》三轮问答记录\n\n${text}\n\n${classroom.closing}`], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = '杨氏之子-问答记录.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
window.addEventListener('pagehide', () => {
  session++;
  clearTimeout(transitionTimer);
  stopAudio();
  recognition?.abort();
});
