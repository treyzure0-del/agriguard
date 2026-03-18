require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

const ADVISOR_SYSTEM_PROMPT = `You are AgriGuard AI, an expert agricultural advisor and plant pathologist 
specializing in farming across East Africa — Uganda, Kenya, Tanzania, Rwanda, Ethiopia. 
You have deep expertise in: crop diseases (Maize, Cassava, Beans, Tomatoes, Potatoes, 
Banana, Coffee, Sorghum), pest management, soil health, irrigation, climate-smart 
farming, livestock care, fertilizers, and post-harvest handling. 
Always give practical actionable advice for smallholder farmers with limited resources. 
Use simple clear language. Suggest both chemical and organic options. 
Be specific about dosages and local product names available in East Africa. 
Format responses with clear headings and bullet points when listing multiple items.`;

// ─── GEMINI ──────────────────────────────────────────────────────────────────

async function callGeminiText(messages) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: ADVISOR_SYSTEM_PROMPT
  });

  // Convert messages array to Gemini history format
  const history = [];
  const messagesCopy = [...messages];

  // Last message is the current user message
  const lastMessage = messagesCopy.pop();

  for (const msg of messagesCopy) {
    history.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

async function callGeminiVision(base64Image, mimeType, prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    }
  ]);
  return result.response.text();
}

// ─── OPENAI ──────────────────────────────────────────────────────────────────

async function callOpenAIText(messages) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const fullMessages = [
    { role: 'system', content: ADVISOR_SYSTEM_PROMPT },
    ...messages
  ];
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: fullMessages,
    max_tokens: 1000
  });
  return completion.choices[0].message.content;
}

async function callOpenAIVision(base64Image, mimeType, prompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000
  });
  return completion.choices[0].message.content;
}

// ─── DEEPSEEK ────────────────────────────────────────────────────────────────

async function callDeepSeekText(messages) {
  const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1'
  });
  const fullMessages = [
    { role: 'system', content: ADVISOR_SYSTEM_PROMPT },
    ...messages
  ];
  const completion = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: fullMessages,
    max_tokens: 1000
  });
  return completion.choices[0].message.content;
}

// DeepSeek has no vision - fallback to Gemini
async function callDeepSeekVision(base64Image, mimeType, prompt) {
  console.log('[AI] DeepSeek has no vision API — falling back to Gemini for image analysis');
  return callGeminiVision(base64Image, mimeType, prompt);
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

async function callAdvisorAI(messages) {
  try {
    if (PROVIDER === 'openai') {
      return await callOpenAIText(messages);
    } else if (PROVIDER === 'deepseek') {
      return await callDeepSeekText(messages);
    } else {
      return await callGeminiText(messages);
    }
  } catch (err) {
    console.error('[AI] Advisor call failed:', err.message);
    throw err;
  }
}

async function callVisionAI(base64Image, mimeType, prompt) {
  try {
    if (PROVIDER === 'openai') {
      return await callOpenAIVision(base64Image, mimeType, prompt);
    } else if (PROVIDER === 'deepseek') {
      return await callDeepSeekVision(base64Image, mimeType, prompt);
    } else {
      return await callGeminiVision(base64Image, mimeType, prompt);
    }
  } catch (err) {
    console.error('[AI] Vision call failed:', err.message);
    throw err;
  }
}

async function callPestVisionAI(base64Image, mimeType) {
  const prompt = `You are an expert agricultural entomologist specializing in African crop pests.
Analyze this image for crop-damaging pests.
Return ONLY valid JSON with no extra text:
{
  "pest_name": "name of pest",
  "threat_level": "CRITICAL or HIGH or MEDIUM or LOW",
  "affected_crops": "comma separated crop names",
  "description": "2-3 sentence description",
  "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "treatment": "specific treatment steps",
  "prevention": ["tip 1", "tip 2", "tip 3"],
  "economic_impact": "brief economic impact statement"
}`;

  try {
    if (PROVIDER === 'openai') {
      return await callOpenAIVision(base64Image, mimeType, prompt);
    } else if (PROVIDER === 'deepseek') {
      return await callDeepSeekVision(base64Image, mimeType, prompt);
    } else {
      return await callGeminiVision(base64Image, mimeType, prompt);
    }
  } catch (err) {
    console.error('[AI] Pest vision call failed:', err.message);
    throw err;
  }
}

module.exports = { callAdvisorAI, callVisionAI, callPestVisionAI };
