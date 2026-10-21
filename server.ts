import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support base64 image uploads up to 25MB
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// CORS headers for manifest and static assets (important for PWA audit tools like PWABuilder)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Explicit routes for manifest files to ensure they are always served cleanly
app.get(['/manifest.webmanifest', '/manifest.json'], (_req, res) => {
  res.type('application/manifest+json; charset=utf-8');
  const manifestFile = path.resolve(__dirname, 'public', 'manifest.webmanifest');
  res.sendFile(manifestFile);
});


// Shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API endpoint to analyze doctor prescription image
app.post('/api/analyze-prescription', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg' } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'صورة الروشتة مطلوبة' });
    }

    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'خدمة التحليل الذكي للروشتات غير مهيأة (مفتاح API غير متوفر).'
      });
    }

    // Clean base64 data prefix if present
    const cleanBase64 = image.includes('base64,')
      ? image.split('base64,')[1]
      : image;

    const prompt = `أنت صيدلي خبير ومساعد طبي محترف في صيدلية د. هبه الشواربي، متخصص في قراءة وتحليل الروشتات والوصفات الطبية بدقة متناهية حتى لو كانت مكتوبة بخط يد الطبيب باللغة الإنجليزية أو العربية، أو مطبوعة.

المطلوب:
1. اقرأ الروشتة بدقة واستخرج قائمة بجميع أسماء الأدوية المطلوبة.
2. لكل دواء استخرج:
   - name: الاسم التجاري أو العلمي للدواء بدقة (مثال: Panadol Extra, Concor 5mg, Augmentin 1g, Cataflam 50mg, Brufen, Amoclan, Flumox, C-Retard, إلخ). اكتب الاسم بالإنجليزية كما يكتبه الأطباء و/أو بالعربية إن أمكن.
   - dosage: التركيز والشكل الصيدلي إن وجد (مثل: 500mg أقراص, 1000mg فوار, شراب 120ml).
   - frequency: الجرعة وطريقة الاستخدام إن كانت واضحة بالروشتة (مثل: قرص بعد الأكل مرتين يومياً).
3. استخرج أي تعليمات هامة للمريض أو تخصص العيادة إن كان مدوناً في أعلى الروشتة.

أرجع النتيجة بصيغة JSON حصراً بهذا الهيكل فقط:
{
  "doctorSpecialty": "تخصص الطبيب إن وجد",
  "notes": "ملاحظات عامة حول الروشتة",
  "medicines": [
    {
      "name": "اسم الدواء بالإنجليزية",
      "nameAr": "اسم الدواء بالعربية إن أمكن",
      "dosage": "التركيز والشكل الدوائي",
      "frequency": "طريقة الاستخدام"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback clean markdown block
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('لم يتمكن الذكاء الاصطناعي من معالجة بيانات الروشتة بالشكل المطلوب.');
      }
    }

    return res.json({
      success: true,
      medicines: parsed.medicines || [],
      doctorSpecialty: parsed.doctorSpecialty || '',
      notes: parsed.notes || ''
    });
  } catch (error: any) {
    console.error('Error analyzing prescription:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء فحص صورة الروشتة. يرجى التأكد من وضوح الصورة والمحاولة مرة أخرى.'
    });
  }
});

// Mount Vite middleware in development, or serve dist in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
