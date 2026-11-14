const lesson = [
 {title:'杨氏之子，是谁呢？',question:'你知道杨氏之子是谁吗？',good:'杨氏之子，就是姓杨人家的儿子，年仅九岁，十分聪慧。',help:'没关系，我们一起来记一下，杨氏之子，就是姓杨人家的儿子。'},
 {title:'一句“君家果”，藏着什么？',question:'那再想一想，孔君平为什么要说“此是君家果”呢？',good:'杨梅的“杨”和杨氏的“杨”是同一个字，孔君平是拿这个和孩子开玩笑。我们来看最后一题。',help:'这里是孔君平在打趣，杨梅的“杨”和杨氏的姓氏一样，是逗孩子的话。我们来第三轮。'},
 {title:'他的回答，妙在哪里？',question:'杨氏之子回答“未闻孔雀是夫子家禽”，这句话妙在哪里？说说你的理解。',good:'他顺着孔君平的思路，用孔雀巧妙回击，有礼又机智，一点不生硬。',help:'这句话妙在借力反击，孔君平拿姓氏开玩笑，孩子也用同样的方式回应，委婉又聪明。'}
];
const closing='今天就跟知竹老师学习到这里，接下来交给丘老师了。';
function assess(round,text){
 const s=text.replace(/[\s，。！？、：“”‘’]/g,'');
 if(/不知道|不清楚|不会|没想好|想不出|不懂/.test(s))return 'help';
 if(round===0){if(/杨/.test(s)&&/儿子|孩子|小孩|男孩|小朋友/.test(s)&&! /不是|不姓|没有/.test(s))return 'good';if(/杨|儿子|九岁|9岁|聪明|聪慧|孔君平/.test(s))return 'help';}
 if(round===1){if(/杨梅/.test(s)&&/姓|同.*字|相同|一样|都有杨|都带杨/.test(s)&&! /不一样|不相同|不是/.test(s))return 'good';if(/杨|果|姓|孔|玩笑|打趣|逗/.test(s))return 'help';}
 if (round === 2) {
   const usesPeacock = /孔雀/.test(s);
   const explainsConnection = /姓|孔君平|同样|相同|一样|顺着|回敬|回击/.test(s);
   const explainsPoliteness = /礼|委婉|未闻|婉转|客气/.test(s);
   const mirrorsSurnameJoke = /姓氏|姓/.test(s) && (
     /(?:也|同样|相同|一样|顺着|照着).*(?:回应|回答|回敬|回击|反击|开玩笑|打趣)/.test(s) ||
     /借力(?:反击|回击)|以其人之道/.test(s)
   );
   const contradictsAnswer = /不礼貌|没有礼貌|不委婉|没有用同样|没用同样|不是用同样|没有回应|没有反击|没有回击|不是借力反击|跟姓氏无关|与姓氏无关/.test(s);
   if (!contradictsAnswer && (mirrorsSurnameJoke || (usesPeacock && explainsConnection && explainsPoliteness))) return 'good';
   if (/孔|杨|姓|机智|聪明|礼貌|委婉|反击|回击|未闻|家禽|同样|礼/.test(s)) return 'help';
 }
 return 'unrelated';
}
if(typeof module!=='undefined')module.exports={lesson,assess,closing};
