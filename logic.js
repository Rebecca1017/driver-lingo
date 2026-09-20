/* 司机英语助手 - 纯逻辑层
 * 同时支持：浏览器 <script src="logic.js"> 全局 window.DriverLingo
 * 以及 Node 环境 require('./logic.js')
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DriverLingo = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ---------------------------------------------------------------
   * 1. 司机常用表达库（场景化，离线可用，文案经过打磨）
   * ------------------------------------------------------------- */
  const DRIVER_CATEGORIES = [
    {
      id: 'meet', name: '迎接上车', icon: '🚕',
      items: [
        { zh: '您好，我是您的司机。', en: "Hello, I'm your driver." },
        { zh: '请问是您叫的车吗？', en: 'Excuse me, is this your ride?' },
        { zh: '请到上车点等我，我马上到。', en: "Please wait at the pickup point. I'll be there soon." },
        { zh: '我到了，您在哪边？', en: "I've arrived. Where are you?" },
        { zh: '我的车是{color}的，车牌尾号是{plate}。', en: 'My car is {color}, and the plate number ends with {plate}.', needsProfile: true },
        { zh: '请从右边上车。', en: 'Please get in on the right side.' },
        { zh: '请系好安全带。', en: 'Please fasten your seatbelt.' },
        { zh: '麻烦关一下车门，谢谢。', en: 'Could you close the door, please?' }
      ]
    },
    {
      id: 'dest', name: '确认目的地', icon: '📍',
      items: [
        { zh: '目的地是您手机上显示的这个地址，对吗？', en: 'Is the destination the address shown on your phone?' },
        { zh: '我现在按导航走。', en: "I'll follow the navigation now." },
        { zh: '我会送您到正确的下客点。', en: "I'll take you to the correct drop-off point." },
        { zh: '如果地址不对，麻烦您现在告诉我。', en: 'If the address is wrong, please let me know now.' },
        { zh: '您可以在手机上把地址指给我看。', en: 'You can point to the address on your phone for me.' }
      ]
    },
    {
      id: 'route', name: '路线与时间', icon: '🛣️',
      items: [
        { zh: '大概需要40分钟。', en: 'It takes about 40 minutes.', critical: true },
        { zh: '现在有点堵车，会慢一点。', en: "There's some traffic, so it will be a bit slower." },
        { zh: '前面出了事故，可能会堵。', en: "There's an accident ahead, so we may get stuck." },
        { zh: '走高速会快一些，但要多付高速费。', en: 'The expressway is faster, but there is an extra toll.' },
        { zh: '我换一条更快的路线，可以吗？', en: "I'll take a faster route, is that OK?" }
      ]
    },
    {
      id: 'price', name: '费用与支付', icon: '💰',
      items: [
        { zh: '车费是平台自动计算的，不是我定的。', en: 'The fare is calculated automatically by the app, not by me.' },
        { zh: '平台显示车费是58.6元。', en: 'The fare shown in the app is 58.6 yuan.', critical: true },
        { zh: '高速费需要另外支付。', en: 'The toll is charged separately.' },
        { zh: '可以在App里直接支付。', en: 'You can pay directly in the app.' },
        { zh: '也可以用微信或支付宝。', en: 'You can also use WeChat Pay or Alipay.' },
        { zh: '我这里不收现金，抱歉。', en: "Sorry, I can't take cash." }
      ]
    },
    {
      id: 'wait', name: '等待', icon: '⏳',
      items: [
        { zh: '请稍等，我马上到。', en: "Please wait a moment. I'll be right there." },
        { zh: '我可以免费等您5分钟。', en: 'I can wait for you for 5 minutes at no charge.', critical: true },
        { zh: '超过免费等待时间，平台会计算等待费。', en: 'After the free waiting time, the app will charge a waiting fee.' },
        { zh: '您大概还需要多久？', en: 'How much longer do you need?' },
        { zh: '我在这里等您，不着急。', en: "I'll wait here. Take your time." }
      ]
    },
    {
      id: 'luggage', name: '行李', icon: '🧳',
      items: [
        { zh: '需要我帮您把行李放到后备箱吗？', en: 'Would you like me to put your luggage in the trunk?' },
        { zh: '后备箱在这里。', en: 'The trunk is over here.' },
        { zh: '行李有点大，可能放不下。', en: 'The luggage is a bit big and may not fit.' },
        { zh: '下车请带好您的行李。', en: 'Please take your luggage with you when you get out.' }
      ]
    },
    {
      id: 'arrive', name: '到达与下车', icon: '🏁',
      items: [
        { zh: '我们到了。', en: 'Here we are.' },
        { zh: '请在路边下车，注意后面的车。', en: 'Please get out on the roadside and watch for cars behind you.' },
        { zh: '请带好随身物品。', en: 'Please take all your belongings.' },
        { zh: '麻烦给我五星好评，谢谢！', en: 'Could you give me a five-star rating? Thank you!' },
        { zh: '祝您旅途愉快！', en: 'Have a nice trip!' },
        { zh: '前面不能停车，我在这里停一下可以吗？', en: "I can't stop up ahead. Is it OK if I pull over here?" }
      ]
    },
    {
      id: 'service', name: '车内服务', icon: '❄️',
      items: [
        { zh: '空调温度可以吗？', en: 'Is the air conditioning temperature OK?' },
        { zh: '需要调低一点吗？', en: 'Would you like it cooler?' },
        { zh: '可以开一下窗吗？', en: 'May I open the window?' },
        { zh: '需要充电线吗？', en: 'Do you need a charging cable?' },
        { zh: '车上有矿泉水，请自取。', en: "There's bottled water, help yourself." },
        { zh: '车上请不要吸烟。', en: 'Please no smoking in the car.' },
        { zh: '请不要在车里吃东西，谢谢。', en: "Please don't eat in the car. Thank you." }
      ]
    },
    {
      id: 'trouble', name: '沟通困难', icon: '🆘',
      items: [
        { zh: '抱歉，我不会说英语，我们用翻译软件沟通。', en: "Sorry, I don't speak English. Let's use a translation app." },
        { zh: '请说慢一点，谢谢。', en: 'Please speak a little slower. Thank you.' },
        { zh: '请再说一遍。', en: 'Could you say that again?' },
        { zh: '我明白了。', en: 'I got it.' },
        { zh: '请您在手机上打出来给我看。', en: 'Could you type it on your phone and show me?' },
        { zh: '我找工作人员来帮我们。', en: "I'll ask the staff to help us." }
      ]
    },
    {
      id: 'airport', name: '接机与航班', icon: '✈️',
      items: [
        { zh: '我已经到机场了，在停车场等您。', en: "I'm at the airport already, waiting in the parking lot." },
        { zh: '我在国内到达出口等您。', en: "I'm waiting at the domestic arrivals exit." },
        { zh: '您的航班到了吗？', en: 'Has your flight landed?', critical: true },
        { zh: '您的航班延误了吗？', en: 'Is your flight delayed?' },
        { zh: '行李转盘在那边，我在这里等您。', en: "The baggage carousel is over there. I'll wait here." },
        { zh: '您拿到行李后告诉我，我开到门口接您。', en: "Let me know when you have your luggage and I'll pick you up at the door." }
      ]
    }
  ];

  /* 乘客端常用表达（英文 → 中文） */
  const PASSENGER_PHRASES = [
    { en: 'Hello!', zh: '你好！' },
    { en: 'Are you my driver?', zh: '你是我的司机吗？' },
    { en: 'Please take me to this address.', zh: '请送我到这个地址（看我的手机）。' },
    { en: 'How long will it take?', zh: '大概要多长时间？' },
    { en: "Please hurry, I'm in a hurry.", zh: '请快一点，我赶时间。' },
    { en: 'Please wait two minutes.', zh: '请等我两分钟。' },
    { en: 'Can I put my luggage in the trunk?', zh: '我可以把行李放在后备箱吗？' },
    { en: 'Could you help me with my luggage?', zh: '可以帮我拿一下行李吗？' },
    { en: 'How much is it?', zh: '多少钱？' },
    { en: 'Can I pay by card?', zh: '可以刷卡吗？' },
    { en: 'Can I have a receipt?', zh: '可以给我发票吗？' },
    { en: 'Please stop here.', zh: '请在这里停车。' },
    { en: 'Could you turn on the air conditioning?', zh: '可以开空调吗？' },
    { en: 'I will be there in five minutes.', zh: '我五分钟后到。' },
    { en: 'Could you drive a little faster?', zh: '可以开快一点吗？' },
    { en: 'Thank you very much!', zh: '非常感谢！' }
  ];

  /* 对话页顶部的一键快捷表达 */
  const QUICK_DRIVER = [
    '您好，我是您的司机。',
    '我马上到，请稍等。',
    '请系好安全带。',
    '大概需要40分钟。',
    '我们到了。',
    '麻烦给我五星好评，谢谢！'
  ];
  const QUICK_PASSENGER = [
    'Are you my driver?',
    'Please take me to this address.',
    'How long will it take?',
    'Please stop here.',
    'Can I pay by card?',
    'Thank you very much!'
  ];

  /* ---------------------------------------------------------------
   * 2. 文本归一化与相似度
   * ------------------------------------------------------------- */
  const FULLWIDTH_MAP = '０１２３４５６７８９';

  function normalize(text) {
    if (!text) return '';
    let s = String(text);
    // 全角数字 → 半角
    s = s.replace(/[０-９]/g, (c) => String(FULLWIDTH_MAP.indexOf(c)));
    // 全角标点 → 半角
    s = s.replace(/[，。！？；：、“”‘’（）《》]/g, (c) => ({
      '，': ',', '。': '.', '！': '!', '？': '?', '；': ';', '：': ':',
      '、': ',', '“': '"', '”': '"', '‘': "'", '’': "'", '（': '(', '）': ')',
      '《': '<', '》': '>'
    }[c]));
    s = s.toLowerCase();
    s = s.replace(/[\s\u3000]+/g, '');
    s = s.replace(/[!?.,:;'"()<>·—\-–…~]/g, '');
    return s;
  }

  function bigrams(s) {
    const out = [];
    if (s.length === 1) return [s];
    for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
    return out;
  }

  /** Dice 系数，0~1 */
  function similarity(a, b) {
    const x = normalize(a), y = normalize(b);
    if (!x || !y) return 0;
    if (x === y) return 1;
    if (x.includes(y) || y.includes(x)) {
      const ratio = Math.min(x.length, y.length) / Math.max(x.length, y.length);
      return 0.72 + 0.28 * ratio;
    }
    const bx = bigrams(x), by = bigrams(y);
    const map = new Map();
    bx.forEach((g) => map.set(g, (map.get(g) || 0) + 1));
    let hit = 0;
    by.forEach((g) => {
      const c = map.get(g) || 0;
      if (c > 0) { hit++; map.set(g, c - 1); }
    });
    return (2 * hit) / (bx.length + by.length);
  }

  /** 在表达库中找最接近的一句。lang = 'zh' 表示输入是中文 */
  function matchPhrase(text, lang, options) {
    const opts = options || {};
    const min = opts.min == null ? 0.42 : opts.min;
    let best = null;
    const pool = [];
    if (lang === 'zh') {
      DRIVER_CATEGORIES.forEach((cat) => cat.items.forEach((it) => pool.push({
        zh: it.zh, en: it.en, cat: cat.name, critical: !!it.critical
      })));
    } else {
      PASSENGER_PHRASES.forEach((it) => pool.push({ en: it.en, zh: it.zh, cat: '乘客常用', critical: false }));
    }
    pool.forEach((it) => {
      const score = similarity(text, lang === 'zh' ? it.zh : it.en);
      if (!best || score > best.score) best = { item: it, score: score };
    });
    if (!best || best.score < min) return null;
    return best;
  }

  /* ---------------------------------------------------------------
   * 3. 关键信息识别（金额/地址/时间/数字/电话/航班号/目的地）
   * ------------------------------------------------------------- */
  const CRITICAL_RULES = [
    { key: 'money', label: '金额', re: /(\d+(?:\.\d+)?)\s*(?:块|元|钱|毛|角)|车费|价格|费用|收费|多少钱|计价|打表|现金|支付/ },
    { key: 'time', label: '时间', re: /(\d+|几|多少)\s*(?:分钟|小时|钟头|天)|几点|大概需要|等待费|免费等/ },
    { key: 'place', label: '地址', re: /机场|航站楼|火车站|高铁站|地铁站|汽车站|酒店|宾馆|大厦|广场|小区|医院|学校|大学|公园|出口|入口|路口|大道|路|街|巷|弄|号|楼|门|停车场|mall|center/i },
    { key: 'number', label: '数字', re: /(\d+|零|一|二|两|三|四|五|六|七|八|九|十|百|千|万)(号|楼|层|位|个|人|件|台|分钟)/ },
    { key: 'phone', label: '电话号码', re: /电话|手机号|号码|联系方式|微信/ },
    { key: 'flight', label: '航班号', re: /航班|\b[A-Z]{2}\s?\d{2,4}\b/ },
    { key: 'destination', label: '目的地', re: /去|前往|目的地|送到|去哪儿|开去|下客点|下车点|送到哪/ }
  ];

  /** 返回 {critical:boolean, reasons:string[], labels:string} */
  function detectCritical(text) {
    const raw = String(text || '');
    const reasons = [];
    CRITICAL_RULES.forEach((r) => {
      if (r.re.test(raw)) reasons.push(r.label);
    });
    // 纯数字（如"3号出口"）也视为关键
    if (/\d/.test(raw) && reasons.indexOf('数字') < 0 && reasons.length === 0) reasons.push('数字');
    return {
      critical: reasons.length > 0,
      reasons: reasons,
      labels: reasons.join('、')
    };
  }

  /* ---------------------------------------------------------------
   * 4. 数字一致性校验（防止翻译时改数字，PRD 原则三）
   * ------------------------------------------------------------- */
  const CN_DIGIT = { 零: 0, 〇: 0, 一: 1, 幺: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const CN_UNIT = { 十: 10, 百: 100, 千: 1000, 万: 10000 };

  function cnToNumber(s) {
    let total = 0, section = 0, num = 0;
    for (const ch of s) {
      if (CN_DIGIT[ch] != null) { num = CN_DIGIT[ch]; continue; }
      const unit = CN_UNIT[ch];
      if (unit == null) continue;
      if (unit === 10000) { section = (section + num) * unit; total += section; section = 0; num = 0; }
      else { section += (num || 1) * unit; num = 0; }
    }
    return total + section + num;
  }

  const EN_ONES = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90
  };

  /** 解析英文数字单词（forty-five / one hundred / five point six） */
  function extractEnglishNumbers(text) {
    const tokens = String(text || '').toLowerCase().replace(/[-\u2010-\u2015]/g, ' ').split(/[^a-z]+/).filter(Boolean);
    const out = [];
    let cur = 0, started = false, decimals = '', inDecimal = false;
    const flush = () => {
      if (!started) return;
      let v = String(cur);
      if (decimals) v = v + '.' + decimals;
      out.push(v);
      cur = 0; decimals = ''; started = false; inDecimal = false;
    };
    tokens.forEach((tk) => {
      if (tk === 'point') {
        if (!started) { cur = 0; started = true; }
        inDecimal = true;
        return;
      }
      const val = EN_ONES[tk];
      if (val != null) {
        if (inDecimal) decimals += String(val).slice(-1);
        else { cur = (cur === 0 ? 0 : cur) + val; started = true; }
        return;
      }
      if (tk === 'hundred' || tk === 'thousand' || tk === 'million') {
        const mul = tk === 'hundred' ? 100 : tk === 'thousand' ? 1000 : 1000000;
        cur = (cur || 1) * mul;
        started = true;
        return;
      }
      flush();
    });
    flush();
    return out;
  }

  /** 数字抽取专用归一化：保留阿拉伯数字与小数点 */
  function normalizeForNumbers(text) {
    return String(text == null ? '' : text)
      .replace(/[０-９]/g, (c) => String(FULLWIDTH_MAP.indexOf(c)))
      .replace(/[，、；]/g, ' ')
      .toLowerCase();
  }

  /** 抽取文本中的数字（阿拉伯数字 + 中文数字 + 英文数字单词） */
  function extractNumbers(text) {
    const s = normalizeForNumbers(text);
    const out = [];
    // 58块6 / 58.6 / 58元6 → 58.6
    const moneyRe = /(\d+)\s*[块元]\s*(\d)(?!\d)/g;
    let m;
    while ((m = moneyRe.exec(s))) {
      const val = m[1] + '.' + m[2];
      out.push(val);
    }
    const arabic = s.match(/\d+(?:\.\d+)?/g) || [];
    arabic.forEach((n) => { if (!out.includes(n)) out.push(n); });
    extractEnglishNumbers(s).forEach((n) => { if (!out.includes(n)) out.push(n); });
    const cnRe = /[零〇一二两三四五六七八九十百千万幺]+/g;
    while ((m = cnRe.exec(s))) {
      const val = cnToNumber(m[0]);
      if (val > 0) out.push(String(val));
    }
    // 去重 + 去掉被更长数字包含的短数字（58.6 包含 58、6，避免误报）
    const uniq = Array.from(new Set(out));
    return uniq.filter((a) => !uniq.some((b) => b !== a && b.includes(a) && b.indexOf('.') >= 0));
  }

  /** 译文是否保留了原文里的数字 */
  function checkNumbersPreserved(source, target) {
    const src = extractNumbers(source);
    const tgt = extractNumbers(target);
    const tgtJoined = normalize(String(target || ''));
    const missing = src.filter((n) => !tgt.includes(n) && !tgtJoined.includes(n.replace('.', '')));
    return { ok: missing.length === 0, missing: missing, source: src, target: tgt };
  }

  /* ---------------------------------------------------------------
   * 5. 翻译引擎（OpenAI 兼容接口）提示词与解析
   * ------------------------------------------------------------- */
  const GLOSSARY_HINT = [
    '平台=the app', '网约车=ride-hailing', '高速费=toll', '等待费=waiting fee',
    '发票=invoice', '五星好评=five-star rating', '尾号=the last digits', '后备箱=trunk'
  ].join('；');

  function buildMessages(opts) {
    const from = opts.from === 'en' ? 'English' : 'Chinese';
    const to = opts.to === 'en' ? 'English' : 'Chinese';
    const direction = opts.to === 'en'
      ? '中文 → 英文（司机说给外国乘客听）'
      : '英文 → 中文（外国乘客说给中国司机听）';
    const system = [
      '你是中国网约车场景的双向口译助手，帮助你服务的是「中国司机 ↔ 外国乘客」的车内即时沟通。',
      '翻译方向：' + direction + '。',
      '硬性要求：',
      '1. 只翻译，不解释、不补充、不追问。译文要口语、简短、礼貌，可直接朗读。',
      '2. 数字、金额、时间、航班号、电话号码、地址必须逐字保留，不得改写、约算或省略。',
      '3. 中文数字改写成阿拉伯数字（例如「五十八块六」写成 58.6），但数值必须完全一致。',
      '4. 英文译文控制在 20 个单词以内；中文译文控制在 25 个字以内。',
      '5. 原句有歧义时，选择最符合打车场景的理解。',
      '6. 城市名、地名、酒店名保留中文拼音或英文常用写法。',
      '术语参考：' + GLOSSARY_HINT + '。',
      '输出格式：必须是 JSON，形如 {"translation":"译文","note":"给司机的中文提醒，没有就空字符串"}。'
    ].join('\n');
    return [
      { role: 'system', content: system },
      { role: 'user', content: '把下面这段' + from + '翻译成' + to + '：\n"""' + String(opts.text || '').trim() + '"""' }
    ];
  }

  /** 容错解析模型返回的 JSON */
  function parseEngineReply(raw) {
    if (raw == null) return null;
    let text = String(raw).trim();
    if (!text) return null;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) text = fenced[1].trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        const obj = JSON.parse(text.slice(start, end + 1));
        if (obj && typeof obj.translation === 'string') {
          return { translation: obj.translation.trim(), note: String(obj.note || '').trim() };
        }
      } catch (e) { /* 继续按纯文本处理 */ }
    }
    return { translation: text.replace(/^["“]|["”]$/g, '').trim(), note: '' };
  }

  /* ---------------------------------------------------------------
   * 6. 无翻译引擎时的离线兜底：规则翻译 + 表达库匹配
   * ------------------------------------------------------------- */
  const OFFLINE_RULES = [
    { re: /(\d+)\s*[块元]\s*(\d)(?!\d)/,
      en: (m) => 'The fare shown in the app is ' + m[1] + '.' + m[2] + ' yuan.',
      zh: (m) => '平台显示车费是' + m[1] + '.' + m[2] + '元。' },
    { re: /(\d+(?:\.\d+)?)\s*[块元]/,
      en: (m) => 'The fare shown in the app is ' + m[1] + ' yuan.',
      zh: (m) => '平台显示车费是' + m[1] + '元。' },
    { re: /(\d+)\s*分钟/,
      en: (m) => 'It takes about ' + m[1] + ' minutes.',
      zh: (m) => '大概需要' + m[1] + '分钟。' },
    { re: /(\d+)\s*号出口/,
      en: (m) => 'Please wait for me at Exit ' + m[1] + '.',
      zh: (m) => '请在' + m[1] + '号出口等我。' },
    { re: /(\d+)\s*号航站楼|T(\d)/,
      en: (m) => 'Terminal ' + (m[1] || m[2]) + '.',
      zh: (m) => (m[1] || m[2]) + '号航站楼。' },
    { re: /尾号\s*(\d{3,4})|车牌尾号(\d{3,4})/,
      en: (m) => 'The plate number ends with ' + (m[1] || m[2]) + '.',
      zh: (m) => '车牌尾号是' + (m[1] || m[2]) + '。' }
  ];

  /** 离线兜底翻译，返回 {translation, note, source:'rule'|'library'} 或 null */
  function offlineTranslate(text, to) {
    const pool = [];
    DRIVER_CATEGORIES.forEach((cat) => cat.items.forEach((it) => pool.push({ zh: it.zh, en: it.en })));
    PASSENGER_PHRASES.forEach((it) => pool.push({ en: it.en, zh: it.zh }));

    // 先做表达库匹配（准确性最高）
    const hit = matchPhrase(text, to === 'en' ? 'zh' : 'en', { min: 0.5 });
    if (hit) {
      const candidate = to === 'en' ? hit.item.en : hit.item.zh;
      // 说话里带数字时，库里的模板句可能与实际数字不一致，必须核对后再用
      const spokenNumbers = extractNumbers(text);
      if (spokenNumbers.length === 0 || checkNumbersPreserved(text, candidate).ok) {
        return {
          translation: candidate,
          note: '来自常用表达库（相似度 ' + Math.round(hit.score * 100) + '%）',
          source: 'library'
        };
      }
    }
    for (const rule of OFFLINE_RULES) {
      const m = String(text || '').match(rule.re);
      if (m) {
        return {
          translation: to === 'en' ? rule.en(m) : rule.zh(m),
          note: '简易句式翻译，请核对数字',
          source: 'rule'
        };
      }
    }
    return null;
  }

  /** 填充 {plate}/{color} 等个人信息占位符 */
  function fillProfile(text, profile) {
    const p = profile || {};
    return String(text || '')
      .replace(/\{plate\}/g, p.plate || '1234')
      .replace(/\{color\}/g, p.color || '白色');
  }

  return {
    DRIVER_CATEGORIES: DRIVER_CATEGORIES,
    PASSENGER_PHRASES: PASSENGER_PHRASES,
    QUICK_DRIVER: QUICK_DRIVER,
    QUICK_PASSENGER: QUICK_PASSENGER,
    normalize: normalize,
    similarity: similarity,
    matchPhrase: matchPhrase,
    detectCritical: detectCritical,
    extractNumbers: extractNumbers,
    checkNumbersPreserved: checkNumbersPreserved,
    cnToNumber: cnToNumber,
    buildMessages: buildMessages,
    parseEngineReply: parseEngineReply,
    offlineTranslate: offlineTranslate,
    fillProfile: fillProfile
  };
});
