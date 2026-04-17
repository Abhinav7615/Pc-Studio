const keywordResponses = [
  {
    keywords: ['compare', 'comparison', 'vs', 'versus', 'compare karo', 'compare karein'],
    response: {
      en: 'To compare products, look at price, features, warranty, and condition. Tell me the products or specifications you are deciding between, and I will help you choose.',
      hi: 'Products ko compare karne ke liye price, features, warranty aur condition dekho. Mujhe batao kaunse products ya specifications ke beech mein aap faisla kar rahe ho, main madad karunga.',
    },
  },
  {
    keywords: ['select', 'choose', 'choice', 'recommend', 'sujhav', 'best', 'kya lena chahiye', 'kya chunoon'],
    response: {
      en: 'Please tell me your budget, use case, and whether you prefer bargain deals or auction options. I will suggest the best product for you.',
      hi: 'Mujhe apna budget, use case, aur preference bataiye, jaise sasta deal ya auction. Main aapke liye best product suggest karunga.',
    },
  },
  {
    keywords: ['bargain', 'offer', 'price cut', 'mol', 'sasta', 'kam daam', 'discount', 'sasta milega'],
    response: {
      en: 'Bargaining means making a lower offer to the seller. Share the product and your target price, and I will help you make a strong offer.',
      hi: 'Bargaining mein aap seller ko kam daam bolte hain. Product aur aapki target price bataiye, main aapko behtar offer banane mein madad karunga.',
    },
  },
  {
    keywords: ['bid', 'auction', 'bidding', 'auctioning', 'bid karo', 'auction mein', 'offer lagao'],
    response: {
      en: 'In bidding, you compete with others. Tell me the item and current bid, and I will help you decide how to stay in the lead.',
      hi: 'Bidding mein aap doosron se competition karte hain. Item aur current bid bataiye, main aapko lead mein rehne ka plan bataunga.',
    },
  },
  {
    keywords: ['order', 'shipped', 'delivered', 'payment', 'status', 'tracking', 'refund', 'return', 'cancel', 'order ka', 'paise', 'order kab', 'order ka status', 'last order', 'pichla order', 'aakhri order', 'last order status', 'mera last order'],
    response: {
      en: 'Order and payment details are shown on your orders page. Share your order number or the issue, and I will explain shipping, delivery, or refund status clearly.',
      hi: 'Order aur payment details aapke orders page par milti hain. Order number ya problem bataiye, main shipping, delivery aur refund status clearly samjhaunga.',
    },
  },
  {
    keywords: ['invite', 'invitation', 'referral', 'invite code', 'invite link', 'refer', 'refer karna', 'referal', 'referral code', 'invite ke bare mein', 'mera code', 'mera referral code'],
    response: {
      en: 'You can invite friends using your referral link or code. If they make a purchase, they may get a discount and you can earn rewards too. Share your referral details or ask me how to send the invite.',
      hi: 'Aap apne friends ko referral link ya code se invite kar sakte hain. Agar woh kharidari karte hain to unhe discount mil sakta hai aur aapko bhi rewards mil sakte hain. Apna referral code bataiye ya puchhiye kaise bhejna hai.',
    },
  },
  {
    keywords: ['profile', 'account', 'login', 'password', 'signup', 'sign in', 'reset', 'profile ka', 'password bhool gaya', 'login nahin ho raha', 'account ka password'],
    response: {
      en: 'Your profile stores contact and order details. If you need account help, I can guide you step by step through login, password reset, and profile updates.',
      hi: 'Aapka profile contact aur order details store karta hai. Agar account help chahiye, main aapko login, password reset, aur profile update mein step by step guide karunga.',
    },
  },
  {
    keywords: ['support specialist', 'support specialist chahiye', 'agent', 'human', 'real person', 'customer care', 'kisi insaan se baat', 'connect me to support'],
    response: {
      en: 'I can connect you to a Support Specialist if needed. First, please tell me a bit more about your issue so I can try to help directly.',
      hi: 'Agar zaroorat ho to main aapko Support Specialist se jod sakta hoon. Pehle apni problem thodi aur detail mein bataiye, main seedha madad karne ki koshish karunga.',
    },
    escalate: true,
  },
];

const clarificationResponses = [
  {
    en: 'Can you please share the product name, order number, or exact issue so I can help you better?',
    hi: 'Kripya product naam, order number, ya exact problem batayein taaki main aapki acchi madad kar sakoon.',
  },
  {
    en: 'Please describe the problem a little more so I can give you the best answer or connect you with the right support.',
    hi: 'Thoda aur detail mein bataiye taaki main aapko sahi jawab de sakoon ya sahi support tak le jaa sakoon.',
  },
  {
    en: 'Tell me exactly what is not working or what you need help with, and I will take care of it.',
    hi: 'Mujhe bataiye kya kaam nahin kar raha hai ya kis cheez mein madad chahiye, main us par dhyan doonga.',
  },
  {
    en: 'I am here to help with product, order, payment, or account issues. Please share a few more details.',
    hi: 'Main product, order, payment, ya account issues mein madad ke liye hoon. Kripya thodi aur detail share karein.',
  },
];

const smallTalkResponses = [
  {
    en: 'Hello! I am here to help you with products, orders, or anything you want to chat about. How can I make your day easier?',
    hi: 'Namaste! Main aapki madad ke liye yahan hoon, chahe product ho, order ho, ya sirf baat cheet. Aapko kaise madad karoon?',
  },
  {
    en: 'Hi there! I love helping customers and answering questions. Ask me anything about shopping or just say hi.',
    hi: 'Hi! Mujhe customers ki madad karna accha lagta hai. Aap shopping ke baare mein puchh sakte hain ya sirf hi bol sakte hain.',
  },
  {
    en: 'Thanks for chatting with me! I am happy to support you with products, payments, or anything else on your mind.',
    hi: 'Aapse baat karke accha laga! Main products, payments, ya aapke mann mein jo bhi ho usme madad kar sakta hoon.',
  },
  {
    en: 'I am your friendly assistant. Tell me what you need and I will do my best to solve it quickly and kindly.',
    hi: 'Main aapka friendly assistant hoon. Batayein aapko kya chahiye, main jaldi aur pyar se help karunga.',
  },
  {
    en: 'Good to see you here! I can help with shopping, orders, or even just a quick friendly chat. What would you like to do today?',
    hi: 'Aapko yahan dekhkar accha laga! Main shopping, orders, ya bas halki phulki chat mein madad kar sakta hoon. Aaj kya karna chahenge?',
  },
];

const generalResponses = [
  {
    en: 'I can chat about many topics and also help you with shopping here. What would you like to talk about first?',
    hi: 'Main kai vishayon par baat kar sakta hoon aur yahan shopping mein bhi madad kar sakta hoon. Pehle kis baare mein baat karein?',
  },
  {
    en: 'Whether you want product advice or just a friendly conversation, I am here for you. Tell me what you are thinking.',
    hi: 'Chahe aapko product salah chahiye ya bas halka fulka baat karni ho, main yahan hoon. Bataiye aap kya soch rahe hain.',
  },
  {
    en: 'Great question! I might not be a full chatbot for every topic, but I can still answer simply and help you feel better. Ask anything.',
    hi: 'Bahut accha prashn! Main har topic ka expert to nahi hoon, lekin simple tareeke se jawab de sakta hoon aur aapki madad kar sakta hoon. Kuch bhi puchhiye.',
  },
  {
    en: 'I am happy to answer your question. If it is about the website, I can guide you precisely. Otherwise, I will still listen and reply politely.',
    hi: 'Main aapke sawaal ka jawab dene ke liye taiyar hoon. Agar website se related ho to main acche se guide karunga. Agar nahi, phir bhi shishtata se jawab doonga.',
  },
  {
    en: 'Tell me your favorite product or your plan for today and I will respond in a friendly, helpful way.',
    hi: 'Apna pasandida product ya aaj ka plan bataiye, main aapko dostana aur madadgar andaaz mein jawab doonga.',
  },
];

const fallbackResponses = [
  {
    en: 'I can help with product choices, order status, payments, and account issues. Please share a few more details.',
    hi: 'Main product choice, order status, payment, aur account issues mein madad kar sakta hoon. Kripya thodi aur detail dein.',
  },
  {
    en: 'If you tell me the product, order number, or exact issue, I will guide you step by step.',
    hi: 'Agar aap product, order number, ya exact problem bataoge to main step by step guide karunga.',
  },
  {
    en: 'I am here to help in Hindi/Hinglish or English. Ask me about products, orders, delivery, or account problems.',
    hi: 'Main Hindi/Hinglish ya English dono mein help kar sakta hoon. Product, order, delivery, ya account ke baare mein puchho.',
  },
  {
    en: 'Describe your issue a little more clearly and I will do my best to solve it before suggesting a human support option.',
    hi: 'Apni problem thodi aur clearly bataiye, main human support suggest karne se pehle behtar solution dunga.',
  },
];

function isHindiOrHinglish(message: string) {
  const lower = message.toLowerCase();
  const hasDevanagari = /[\u0900-\u097F]/.test(message);
  const hinglishWords = /\b(kya|kaise|kab|ka|ki|hai|nahi|chahiye|mujhe|batao|samasya|madad|paise|order|payment|refund|delivery|shipping|bid|auction|sasta|daam|mol)\b/.test(lower);
  return hasDevanagari || hinglishWords;
}

export function shouldEscalateToHuman(message: string) {
  const normalized = message.toLowerCase();
  return /\b(support specialist|support specialist chahiye|agent|human|real person|customer care|kisi insaan|connect me|connect karo|support chahiye)\b/.test(normalized);
}

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateBotResponse(userMessage: string, history: Array<{ sender: string; message: string }>, _botName = 'ShopBot') {
  const text = userMessage.trim();
  const lower = text.toLowerCase();
  const language = isHindiOrHinglish(text) ? 'hi' : 'en';
  const historyText = history.map((item) => `${item.sender}: ${item.message}`).join(' ');

  const greetingMatch = /\b(hi|hello|hey|namaste|good morning|good afternoon|good evening|kya haal|kaise ho|hello there)\b/.test(lower);
  const thanksMatch = /\b(thanks|thank you|shukriya|dhanyavaad|nice|thankyou|thanks a lot|thank you so much)\b/.test(lower);
  const howAreYouMatch = /\b(how are you|how r you|kya haal hai|kaise ho|aap kaise ho)\b/.test(lower);
  const generalTopicMatch = /\b(weather|movie|film|song|music|food|recipe|travel|life|career|study|game|football|cricket|birthday|love|friendship|advice|motivation|inspiration|fun|joke|chat|story|history|technology|fitness|health|books|travel|holiday)\b/.test(lower);
  const _useFriendlyTone = /\b(please|pls|bro|dost|yaar|bhai|sis|friend|friendship|mate|buddy|yaar)\b/.test(lower);
  const feelingMatch = /\b(happy|sad|angry|excited|tired|bored|confused|frustrated|awesome|great|bad|good|fine)\b/.test(lower);

  if (greetingMatch || howAreYouMatch) {
    const chosen = getRandomItem(smallTalkResponses);
    return { text: language === 'hi' ? chosen.hi : chosen.en, fallback: false };
  }

  if (thanksMatch) {
    return {
      text: language === 'hi'
        ? 'Aapka swagat hai! Agar aapko aur kuch chahiye ho to pooch lijiye. Main hamesha yahan hoon.'
        : 'You are welcome! If you want anything else, feel free to ask. I am here to help.',
      fallback: false,
    };
  }

  if (feelingMatch) {
    return {
      text: language === 'hi'
        ? 'Aapka feeling important hai. Bataiye aap kaisa mehsoos kar rahe hain aur main aapko support karunga.'
        : 'Your feelings matter. Tell me how you are feeling and I will help you with a friendly reply.',
      fallback: false,
    };
  }

  if (generalTopicMatch) {
    const chosen = getRandomItem(generalResponses);
    return { text: language === 'hi' ? chosen.hi : chosen.en, fallback: false };
  }

  for (const item of keywordResponses) {
    const match = item.keywords.some((keyword) => lower.includes(keyword));
    if (match) {
      return { text: item.response[language] || item.response.en, fallback: !!item.escalate };
    }
  }

  if (/\b(payment accepted|payment rejected|payment verified|payment status|bhugtaan|refund|return|cancel|paise|transaction failed)\b/.test(lower)) {
    return {
      text: language === 'hi'
        ? 'Payment aur order updates aapke orders section mein dikhte hain. Order number bataiye aur main current payment ya refund status aapko samjhaunga.'
        : 'Payment and order updates are shown in your orders section. Share your order number and I will explain the current payment or refund status.',
      fallback: false,
    };
  }

  if (/\b(delivery|shipping|tracking|ship|deliver|kab aayega|kab milega|parcel|order status)\b/.test(lower)) {
    return {
      text: language === 'hi'
        ? 'Delivery aur tracking details aapke orders page par milti hain. Order number bataiye, main aapko current status aur expected arrival samjhaunga.'
        : 'Delivery and tracking details are on your orders page. Share the order number and I will explain the current status and expected arrival.',
      fallback: false,
    };
  }

  if (/\b(login|password|profile|account|sign in|signup|reset|bhool|login nahin|password bhool|account ka)\b/.test(lower)) {
    return {
      text: language === 'hi'
        ? 'Agar aapko login, password, ya account settings mein problem ho rahi hai, main aapko step by step guide kar sakta hoon.'
        : 'If you need help with login, password, or your account settings, I can guide you step by step to fix it quickly.',
      fallback: false,
    };
  }

  if (/\b(bargain|offer|price cut|bid|auction|sasta|deal|mol|daam)\b/.test(lower)) {
    return {
      text: language === 'hi'
        ? 'Bargaining ya auction mein madad chahiye? Product aur target price bataiye, main aapko strong offer aur bid strategy bataunga.'
        : 'For bargaining or auction help, tell me the product and your target price. I can help you decide the best offer and keep track of the auction.',
      fallback: false,
    };
  }

  if (historyText.match(/\b(laptop|desktop|computer|monitor|graphics card|ram|storage|processor|ssd|hdd)\b/)) {
    return {
      text: language === 'hi'
        ? 'Yeh lagta hai aap computing product ke baare mein puch rahe hain. Processor, RAM, storage, condition, aur warranty compare karke best option chuniye.'
        : 'You seem to be asking about computing products. Compare processor, RAM, storage, condition, and warranty to choose the best one for your needs.',
      fallback: false,
    };
  }

  if (text.length < 30 || /\b(help|issue|problem|query|question|kuch|kya|kaise|kab|kyun|nahi)\b/.test(lower)) {
    const chosen = getRandomItem(clarificationResponses);
    return {
      text: language === 'hi' ? chosen.hi : chosen.en,
      fallback: false,
    };
  }

  const nonSiteTopicMatch = !/\b(product|order|payment|login|profile|coupon|refer|refund|delivery|shipping|support|customer|cart|item|account|offer|auction)\b/.test(lower);
  if (nonSiteTopicMatch) {
    const chosen = getRandomItem(generalResponses);
    return {
      text: language === 'hi' ? chosen.hi : chosen.en,
      fallback: false,
    };
  }

  const _chosen = getRandomItem(fallbackResponses);
  return {
    text: language === 'hi'
      ? `Main aapki madad karne ki poori koshish kar raha hoon. Agar aap website ya order ke baare mein kuch poochna chahte hain to mujhe wahi batayein, warna main yahan aapke sawalon ka shisht aur friendly jawab dene ke liye hoon.`
      : `I am doing my best to help you. If your question is about the website or an order, please tell me more. Otherwise, I will still answer politely and try to make your experience better.`,
    fallback: true,
  };
}

export function buildBotGreeting(botName = 'ShopBot') {
  return `Hi there! I am ${botName}, your friendly support assistant. I can help in English or Hindi/Hinglish with product choices, comparisons, order tracking, payment updates, account support, and even casual chat if you want.`;
}

const adminKeywordResponses = [
  {
    keywords: ['settings', 'configuration', 'business settings', 'site settings', 'chat settings', 'theme settings'],
    response: {
      en: 'You can manage website and chat settings on the Admin Settings page at /admin/settings. Use that page to update chatbot messages, theme colors, shipping, and business details.',
      hi: 'Aap admin settings page /admin/settings par website aur chat settings manage kar sakte hain. Yahan se chatbot message, theme colors, shipping, aur business details update karein.',
    },
  },
  {
    keywords: ['products', 'add product', 'new product', 'product listing', 'manage products', 'product catalog'],
    response: {
      en: 'To manage your products, go to /admin/products. There you can add, edit, or remove products and manage inventory and images.',
      hi: 'Apne products manage karne ke liye /admin/products par jaayein. Wahan aap product add, edit, ya remove kar sakte hain aur inventory aur images manage kar sakte hain.',
    },
  },
  {
    keywords: ['orders', 'manage orders', 'order history', 'order status', 'shipment'],
    response: {
      en: 'Open /admin/orders to review and manage customer orders. You can update order status, check payment details, and follow up on dispatch.',
      hi: 'Customer orders dekhne aur manage karne ke liye /admin/orders kholen. Aap order status update kar sakte hain, payment details dekh sakte hain, aur dispatch follow up kar sakte hain.',
    },
  },
  {
    keywords: ['users', 'customers', 'staff', 'manage users', 'users list'],
    response: {
      en: 'Use /admin/users to view and manage your registered customers and staff accounts. You can inspect user details, roles, and order activity there.',
      hi: 'Registered customers aur staff accounts manage karne ke liye /admin/users ka upyog karein. Yahan aap user details, roles, aur order activity dekh sakte hain.',
    },
  },
  {
    keywords: ['coupons', 'discounts', 'promo', 'offer code', 'referral'],
    response: {
      en: 'Manage promotional coupons and referral offers from /admin/coupons. Create new discounts, validate codes, and adjust referral settings there.',
      hi: 'Promotional coupons aur referral offers /admin/coupons se manage karein. Naye discounts banayen, codes validate karein, aur referral settings adjust karein.',
    },
  },
  {
    keywords: ['live chat', 'support', 'chat', 'customer chat', 'bot', 'chatbot'],
    response: {
      en: 'This admin bot can guide you through the admin panel and help you find the right page. Ask about orders, products, users, settings, or live chat management.',
      hi: 'Yeh admin bot aapko admin panel mein guide kar sakta hai aur sahi page dikhata hai. Orders, products, users, settings, ya live chat management ke baare mein puchhein.',
    },
  },
];

export function generateAdminBotResponse(userMessage: string, history: Array<{ sender: string; message: string }>) {
  const text = userMessage.trim();
  const lower = text.toLowerCase();
  const language = isHindiOrHinglish(text) ? 'hi' : 'en';

  for (const item of adminKeywordResponses) {
    const match = item.keywords.some((keyword) => lower.includes(keyword));
    if (match) {
      return { text: item.response[language] || item.response.en };
    }
  }

  if (lower.includes('dashboard') || lower.includes('home page') || lower.includes('main page')) {
    return {
      text: language === 'hi'
        ? 'Admin dashboard dekhne ke liye /admin par jayein. Wahan se aap puri site ka overview aur maujooda assignments dekh sakte hain.'
        : 'To view the admin dashboard, visit /admin. From there you can see the site overview and current assignments.',
    };
  }

  if (lower.includes('help') || lower.includes('guide') || lower.includes('kaise') || lower.includes('kya karun')) {
    return {
      text: language === 'hi'
        ? 'Aap mujhse admin panel ke kis hisse mein help chahiye, wo bataiye. Main aapko sahi page aur steps bata dunga.'
        : 'Tell me which part of the admin panel you need help with. I can point you to the correct page and steps.',
    };
  }

  return {
    text: language === 'hi'
      ? 'Admin panel mein kya manage karna hai? Orders, products, users, coupons, ya settings mein se koi option bataiye.'
      : 'What would you like to manage in the admin panel? Please mention orders, products, users, coupons, or settings.',
  };
}

export function buildAdminGreeting(botName = 'ShopBot') {
  return `Hi Admin! I am ${botName}, your admin assistant. Ask me to manage orders, products, users, coupons, settings, or live chat from the admin panel.`;
}
