const $ = id => document.getElementById(id);
const videos = [$('teacherVideo'), $('nextTeacherVideo')];
let activeVideo = videos[0];
let visibleVideo = null;
const poster = $('teacherPoster');
const openingStill = poster.src;
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const opening = '同学们好，我是知竹老师，今天我们来学习《杨氏之子》。我们一共有三轮问答，我先提问，你来作答，准备好了吗？';
const questionClips = ['01', '04', '08'];
const goodClips = ['02', '06', '11'];
const helpClips = ['03', '07', '12'];
const praises = ['很好！', '非常好！', '太厉害了！'];
// One silent frame is skipped only when the second answer is correct.
const matchedThirdQuestionStart = 1 / 30;

let round = -1;
let records = [];
let classroom = classroomContent.current();
let muted = false;
let recognition = null;
let session = 0;
let playbackId = 0;
let playing = false;
let reviewing = false;
let currentClip = null;
let afterPlayback = null;
const stills = new Map();

function endStill(clip) {
  if (!stills.has(clip)) {
    const image = new Image();
    image.src = `assets/video/${clip}-end.png`;
    stills.set(clip, image);
  }
  return stills.get(clip);
}

function clearVideoHandlers(video) {
  video.onended = video.onerror = video.onplaying = video.onloadedmetadata = video.onseeked = null;
  video.onloadeddata = null;
}

function stopVideo(keepPicture = false) {
  playbackId++;
  playing = false;
  for (const video of videos) {
    clearVideoHandlers(video);
    video.pause();
    for (const animation of video.getAnimations()) animation.cancel();
    if (!keepPicture) video.hidden = true;
  }
  if (!keepPicture) {
    visibleVideo = null;
    poster.hidden = false;
  }
}

function clipUrl(number) {
  return `assets/video/${number}.mp4?v=faststart`;
}

function prepareNextClip(number) {
  const next = videos.find(video => video !== activeVideo);
  if (next === visibleVideo) return;
  const source = clipUrl(number);
  if (next.getAttribute('src') === source && !next.error) return;
  next.preload = 'auto';
  next.src = source;
  next.load();
}

function playClip(clip, onComplete = null, nextNumber = null) {
  stopVideo(true);
  afterPlayback = onComplete;
  const id = playbackId;
  const source = clipUrl(clip.number);
  const startTime = clip.startTime ?? 0;
  const candidates = videos.filter(video => video !== visibleVideo);
  // On the first click, continue from the frame already displayed by the opening video.
  const preview = !currentClip && visibleVideo?.getAttribute('src') === source ? visibleVideo : null;
  const video = preview ?? candidates.find(video => video.getAttribute('src') === source && !video.error)
    ?? candidates.find(video => video === activeVideo)
    ?? candidates[0];
  currentClip = clip;
  activeVideo = video;
  const still = nextNumber ? null : endStill(clip.number);
  let finishing = false;
  let shown = false;

  const finish = async () => {
    if (id !== playbackId || finishing) return;
    finishing = true;
    if (nextNumber) {
      afterPlayback = null;
      onComplete();
      return;
    }
    try {
      await still.decode();
    } catch {
      if (id !== playbackId) return;
      failed();
      return;
    }
    if (id !== playbackId) return;
    poster.src = still.src;
    stopVideo();
    afterPlayback = null;
    $('avatarStatus').textContent = round === 3 ? '课堂完成' : '等你回答';
    onComplete?.();
    render();
  };

  const failed = () => {
    if (id !== playbackId) return;
    stopVideo(true);
    $('avatarStatus').textContent = '视频未播放，点「重听」重试';
    render();
  };

  playing = true;
  render();
  $('avatarStatus').textContent = '正在加载视频';
  video.muted = muted;
  video.onplaying = () => {
    if (id !== playbackId) return;
    if (!shown && clip.startTime && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.animate([{ filter: 'brightness(0.992)' }, { filter: 'brightness(1)' }], 180);
    }
    shown = true;
    video.hidden = false;
    if (visibleVideo && visibleVideo !== video) visibleVideo.hidden = true;
    visibleVideo = video;
    poster.hidden = true;
    $('avatarStatus').textContent = '正在讲解';
    if (nextNumber) prepareNextClip(nextNumber);
  };
  video.onerror = failed;
  video.onended = finish;
  const start = () => {
    if (id === playbackId) video.play().catch(failed);
  };
  const seekAndPlay = () => {
    if (id !== playbackId) return;
    if (Math.abs(video.currentTime - startTime) < 0.001 && !video.ended) {
      start();
      return;
    }
    video.onseeked = () => {
      video.onseeked = null;
      start();
    };
    video.currentTime = startTime;
  };
  if (video.getAttribute('src') !== source || video.error) {
    video.preload = 'auto';
    video.src = source;
  }
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    seekAndPlay();
  } else if (startTime) {
    video.onloadedmetadata = () => {
      video.onloadedmetadata = null;
      seekAndPlay();
    };
    video.load();
  } else {
    start();
  }
}

function render() {
  $('start').hidden = round !== -1;
  $('answerForm').hidden = round < 0 || round > 2 || (playing && !reviewing);
  $('ending').hidden = round !== 3 || playing || afterPlayback !== null;
  $('reset').hidden = round < 0;
  $('replay').hidden = currentClip === null;
  for (const id of ['submit', 'skip', 'mic', 'answer']) $(id).disabled = reviewing || playing;
  $('round').textContent = round === 3 ? '已完成' : `第 ${round + 1} / 3 轮`;
  $('history').replaceChildren();
  records.forEach(record => {
    const paragraph = document.createElement('p');
    paragraph.textContent = `第${record.round}轮\n${record.question}\n学生：${record.answer}\n老师：${record.feedback}`;
    $('history').append(paragraph);
  });
}

function showQuestion(previousNumber = null) {
  reviewing = false;
  $('status').textContent = '';
  $('answer').value = '';
  if (round === 3) {
    $('teacher').textContent = classroom.closing;
    playClip({ number: '13' });
    return;
  }
  const question = classroom.lesson[round].question;
  const first = round === 0;
  $('teacher').textContent = first ? `${opening} ${question}` : question;
  const number = questionClips[round];
  const startTime = previousNumber === '06' && number === '08' ? matchedThirdQuestionStart : 0;
  playClip({ number, startTime }, () => {
    $('teacher').textContent = question;
  });
}

function begin() {
  session++;
  recognition?.abort();
  if (currentClip) {
    poster.src = openingStill;
    stopVideo();
  }
  records = [];
  classroom = classroomContent.current();
  round = 0;
  showQuestion();
}

function submit(answer) {
  if (reviewing || playing || round < 0 || round > 2) return;
  answer = answer.trim();
  if (!answer) { $('status').textContent = '先说一说或写下你的想法吧。'; return; }
  recognition?.abort();
  const result = assess(round, answer);
  if (result === 'unrelated') {
    $('status').textContent = '我们先完成这三轮关于《杨氏之子》的问答哦。';
    return;
  }

  const item = classroom.lesson[round];
  const correct = result === 'good';
  const feedback = correct ? praises[round] + item.good : item.help;
  records.push({ round: round + 1, question: item.question, answer, feedback });
  reviewing = true;
  $('teacher').textContent = feedback;
  $('status').textContent = '听听老师的点评';
  const number = correct ? goodClips[round] : helpClips[round];
  playClip({ number }, () => {
    round++;
    showQuestion(number);
  }, questionClips[round + 1] ?? '13');
}

$('start').onclick = begin;
$('again').onclick = begin;
$('reset').onclick = begin;
$('answerForm').onsubmit = event => { event.preventDefault(); submit($('answer').value); };
$('skip').onclick = () => submit('我还没想好');
$('replay').onclick = () => {
  if (currentClip) {
    const nextNumber = reviewing ? questionClips[round + 1] ?? '13' : null;
    playClip(currentClip, afterPlayback, nextNumber);
  }
};
$('sound').onclick = () => {
  muted = !muted;
  for (const video of videos) video.muted = muted;
  $('sound').textContent = muted ? '声音关' : '声音开';
  $('sound').setAttribute('aria-pressed', String(!muted));
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
  if (playing || reviewing) return;
  if (!Recognition) { $('status').textContent = '此浏览器无法语音识别，请打字回答。'; return; }
  if (recognition) { recognition.stop(); return; }
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
  stopVideo();
  recognition?.abort();
});

// Keep the PNG behind the opening video while the browser prepares its first frame.
const openingVideo = videos[0];
openingVideo.onloadeddata = () => {
  openingVideo.onloadeddata = null;
  openingVideo.hidden = false;
  visibleVideo = openingVideo;
};
openingVideo.preload = 'auto';
openingVideo.src = clipUrl(questionClips[0]);
