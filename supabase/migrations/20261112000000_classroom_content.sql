begin;

create table public.classroom_content (
  lesson_id text not null,
  revision text not null,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  primary key (lesson_id, revision)
);

alter table public.classroom_content enable row level security;
revoke all on table public.classroom_content from public, anon, authenticated;
grant select on table public.classroom_content to anon, authenticated;

create policy "Read Yangshi classroom content"
  on public.classroom_content
  for select to anon, authenticated
  using (lesson_id = 'yangshi-classroom');

insert into public.classroom_content (lesson_id, revision, content)
values ('yangshi-classroom', '2', $lesson$
{
  "lesson": [
    {
      "title": "杨氏之子，是谁呢？",
      "question": "同学们，我们今天学习《杨氏之子》，先考考你，你知道杨氏之子是谁吗？",
      "good": "说得不错！杨氏之子，就是姓杨人家的儿子，年仅九岁，十分聪慧。我们进入下一题。",
      "help": "没关系，我们一起来记一下，杨氏之子指杨氏家的儿子。我们继续第二轮。"
    },
    {
      "title": "一句“君家果”，藏着什么？",
      "question": "那再想一想，孔君平为什么要说“此是君家果”呢？",
      "good": "理解到位！杨梅的“杨”和杨氏的“杨”是同一个字，孔君平是拿这个和孩子开玩笑。我们来看最后一题。",
      "help": "这里是孔君平在打趣，杨梅带“杨”，和杨氏的姓氏一样，是逗孩子的话。我们来第三轮。"
    },
    {
      "title": "他的回答，妙在哪里？",
      "question": "杨氏之子回答“未闻孔雀是夫子家禽”，这句话妙在哪里？说说你的理解。",
      "good": "太厉害了！他顺着孔君平的思路，用孔雀巧妙回击，有礼又机智，一点不生硬。",
      "help": "这句话妙在借力反击，孔君平拿姓氏开玩笑，孩子也用同样的方式回应，委婉又聪明。"
    }
  ],
  "closing": "三轮问答完成，你感受到杨氏之子思维敏捷、应答巧妙了吗？"
}
$lesson$::jsonb);

commit;
