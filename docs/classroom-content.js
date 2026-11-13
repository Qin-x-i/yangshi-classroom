const classroomContent = (() => {
  const fallback = { lesson, closing };
  let content = fallback;

  function isLesson(value) {
    return typeof value?.closing === 'string' && value.closing.trim() !== '' &&
      Array.isArray(value.lesson) && value.lesson.length === fallback.lesson.length &&
      value.lesson.every(item => ['title', 'question', 'good', 'help'].every(
        key => typeof item?.[key] === 'string' && item[key].trim() !== '',
      ));
  }

  async function load() {
    const { url, publishableKey, revision } = classroomConfig;
    if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url) ||
        !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) return;

    const endpoint = new URL('/rest/v1/classroom_content', url);
    endpoint.search = new URLSearchParams({
      select: 'content',
      lesson_id: 'eq.yangshi-classroom',
      revision: `eq.${revision}`,
      limit: '1',
    });
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch(endpoint, {
        headers: { apikey: publishableKey },
        signal: controller.signal,
      });
      if (!response.ok) return;
      const rows = await response.json();
      if (isLesson(rows?.[0]?.content)) content = rows[0].content;
    } catch {
      // The packaged lesson is usable even when the database is unreachable.
    } finally {
      clearTimeout(deadline);
    }
  }

  void load();
  return { current: () => content };
})();
