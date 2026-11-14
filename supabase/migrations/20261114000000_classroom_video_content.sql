insert into public.classroom_content (lesson_id, revision, content)
values ('yangshi-classroom', '3', $lesson$
{
  "lesson": [
    {
      "title": "杨氏之子，是谁呢？",
      "question": "你知道杨氏之子是谁吗？",
      "good": "杨氏之子，就是姓杨人家的儿子，年仅九岁，十分聪慧。",
      "help": "没关系，我们一起来记一下，杨氏之子，就是姓杨人家的儿子。"
    },
    {
      "title": "一句“君家果”，藏着什么？",
      "question": "那再想一想，孔君平为什么要说“此是君家果”呢？",
      "good": "杨梅的“杨”和杨氏的“杨”是同一个字，孔君平是拿这个和孩子开玩笑。我们来看最后一题。",
      "help": "这里是孔君平在打趣，杨梅的“杨”和杨氏的姓氏一样，是逗孩子的话。我们来第三轮。"
    },
    {
      "title": "他的回答，妙在哪里？",
      "question": "杨氏之子回答“未闻孔雀是夫子家禽”，这句话妙在哪里？说说你的理解。",
      "good": "他顺着孔君平的思路，用孔雀巧妙回击，有礼又机智，一点不生硬。",
      "help": "这句话妙在借力反击，孔君平拿姓氏开玩笑，孩子也用同样的方式回应，委婉又聪明。"
    }
  ],
  "closing": "今天就跟知竹老师学习到这里，接下来交给丘老师了。"
}
$lesson$::jsonb)
on conflict (lesson_id, revision) do update set content = excluded.content;
