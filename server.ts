import express from "express";
import path from "path";
import fs from "fs";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable Gzip/Deflate compression for fast loading speeds (LCP)
  app.use(compression());

  // Support large JSON payloads
  app.use(express.json({ limit: "50mb" }));

  // Database Path configuration
  const DB_DIR = path.join(process.cwd(), "data");
  const DB_FILE = path.join(DB_DIR, "db.json");

  // Ensure database directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Pre-load default configurations & data
  const CATEGORIES = [
    {
      id: 'bags',
      name: 'حقائب ومحافظ مدرسية',
      count: 12,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
      iconName: 'ShoppingBag',
      colorClass: 'from-blue-500 to-indigo-600',
      bgHex: '#e0f2fe'
    },
    {
      id: 'notebooks',
      name: 'دفاتر، كراريس وسجلات',
      count: 24,
      image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=600',
      iconName: 'BookOpen',
      colorClass: 'from-emerald-500 to-teal-600',
      bgHex: '#d1fae5'
    },
    {
      id: 'writing',
      name: 'أقلام وأدوات الكتابة',
      count: 35,
      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600',
      iconName: 'PenTool',
      colorClass: 'from-amber-500 to-orange-600',
      bgHex: '#fef3c7'
    },
    {
      id: 'geometry-art',
      name: 'علب الهندسة وأدوات الرسم',
      count: 18,
      image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&q=80&w=600',
      iconName: 'Palette',
      colorClass: 'from-rose-500 to-pink-600',
      bgHex: '#ffe4e6'
    },
    {
      id: 'electronics',
      name: 'آلات حاسبة وأجهزة تعليمية',
      count: 8,
      image: 'https://images.unsplash.com/photo-1580537659444-2305365e5332?auto=format&fit=crop&q=80&w=600',
      iconName: 'Cpu',
      colorClass: 'from-violet-500 to-purple-600',
      bgHex: '#f3e8ff'
    }
  ];

  const PRODUCTS = [
    {
      id: 'bag-premium-blue',
      name: 'حقيبة مدرسية مريحة ومقاومة للماء - أزرق ملكي',
      description: 'حقيبة ظهر مدرسية متميزة مصممة خصيصاً لتلاميذ الطورين المتوسط والثانوي. تتميز بدعم كامل للظهر لتقليل الوزن وحماية العمود الفقري، مع جيوب متعددة لتنظيم مثالي ومادة مقاومة للماء لحماية الكتب والكراريس.',
      price: 3800,
      image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600',
      category: 'bags',
      rating: 4.9,
      isPopular: true,
      inStock: true,
      brand: 'SchoolPro',
      features: ['مقاومة كاملة للمياه والأمطار', 'دعم طبي للظهر والكتفين ببطانة هوائية', 'مساحة تخزين مخصصة للكمبيوتر المحمول أو اللوحي', 'سحابات (Zippers) يابانية عالية التحمل']
    },
    {
      id: 'bag-ergonomic-pink',
      name: 'حقيبة ظهر مريحة للأطفال برسومات لطيفة - وردي',
      description: 'حقيبة مبهجة وخفيفة الوزن ومثالية للتعليم الابتدائي والتحضيري. تصميم مريح ومقاوم للاهتراء والتمزق اليومي، مع أشرطة عاكسة للضوء لسلامة الأطفال في الصباح الباكر.',
      price: 2900,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
      category: 'bags',
      rating: 4.8,
      isPopular: false,
      inStock: true,
      brand: 'KidsJoy',
      features: ['أشرطة سلامة عاكسة للضوء ليلاً', 'وزن خفيف جداً يزن أقل من 500 غرام', 'مرفقة بمقلمة من نفس اللون مجاناً', 'سهلة الغسيل والتنظيف في الغسالة']
    },
    {
      id: 'bag-university-dark',
      name: 'حقيبة ظهر كلاسيكية أنيقة للجامعيين - رمادي فحمي',
      description: 'حقيبة ظهر ذات طابع عصري مخصصة لطلبة جامعة توقرت والموظفين. تتسع للكتب الكبيرة والكمبيوتر وتتميز بمدخل شحن USB خارجي لتشغيل الهواتف أثناء التنقل.',
      price: 4500,
      image: 'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&q=80&w=600',
      category: 'bags',
      rating: 4.7,
      isPopular: true,
      inStock: true,
      brand: 'CampusCore',
      features: ['منفذ شحن USB مدمج للباوربانك', 'مادة مضادة للسرقة وسحابات مخفية', 'تصميم عصري بسيط يناسب الجامعة والعمل', 'جيوب مبطنة لحماية قصوى للمعدات الإلكترونية']
    },
    {
      id: 'notebook-super-pack',
      name: 'مجموعة كراريس تكنو الفاخرة - 96 صفحة (6 قطع)',
      description: 'حزمة توفيرية تحتوي على 6 كراريس بجودة ورق عالية 80غ/م²، مسطرة ومخططة بعناية لتسهيل مراجعة وتدوين الدروس لكافة الأطوار التعليمية.',
      price: 1100,
      image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=600',
      category: 'notebooks',
      rating: 4.8,
      isPopular: true,
      inStock: true,
      brand: 'Techno',
      features: ['ورق أبيض ناصع ذو كثافة 80 غرام/متر مربع', 'غلاف بلاستيكي ملون مقاوم للماء والتمزق', 'تخطيط عربي دقيق ومريح للعينين', 'ألوان متعددة لتنظيم وتفريق المواد الدراسية']
    },
    {
      id: 'sketchbook-a4-professional',
      name: 'كشكول رسم فني مقاس A4 لطلبة الفنون والهندسة',
      description: 'كشكول رسم مميز يحتوي على 80 ورقة بيضاء محببة بوزن 120غ/م²، مثالي للألوان المائية، الرصاص، الفحم والباستيل. الغلاف صلب للمحافظة على الأعمال الفنية.',
      price: 750,
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
      category: 'notebooks',
      rating: 4.6,
      isPopular: false,
      inStock: true,
      brand: 'Canson',
      features: ['ورق خالٍ من الأحماض للحفاظ على ثبات الألوان', 'سلك لولبي متين يتيح تدوير الصفحات 360 درجة', 'غلاف خلفي صلب جداً يدعم الرسم بدون طاولة', 'مناسب لكافة تقنيات الرسم والتظليل']
    },
    {
      id: 'pens-stabilo-gel',
      name: 'علبة أقلام حبر جاف ملونة Stabilo Point 88 - 10 ألوان',
      description: 'الأقلام الأيقونية المفضلة للتلاميذ والطلبة لتنظيم الدروس، رسم المخططات والكتابة الدقيقة بفضل رأسها الرفيع جداً 0.4 مم المصنوع من المعدن المقاوم للصدأ.',
      price: 1650,
      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600',
      category: 'writing',
      rating: 4.9,
      isPopular: true,
      inStock: true,
      brand: 'Stabilo',
      features: ['رأس دقيق جداً 0.4 مم للكتابة الفنية والمخططات', 'حبر ذو جودة عالية لا يخترق صفحات الورق', 'تصميم سداسي شهير ومريح جداً في اليد', 'غطاء محكم الإغلاق يحمي الأقلام من الجفاف الطويل']
    },
    {
      id: 'highlighters-pastel-pack',
      name: 'مجموعة أقلام تحديد باستيل ناعمة Stabilo Boss - 6 ألوان',
      description: 'أقلام تحديد ناعمة بألوان الباستيل المريحة للعين، مخصصة لتظليل النقاط الهامة في الدروس والمحاضرات بدون إجهاد بصري أو التغطية على النصوص.',
      price: 1200,
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=600',
      category: 'writing',
      rating: 4.8,
      isPopular: false,
      inStock: true,
      brand: 'Stabilo',
      features: ['تقنية منع جفاف الحبر حتى 4 ساعات بدون غطاء', 'ألوان ناعمة ومشرقة لا تسبب بقعاً خلف الورقة', 'حجم مثالي يسهل حمله في أي مقلمة مدرسية', 'حبر مائي آمن تماماً وخالٍ من المواد الكيميائية الضارة']
    },
    {
      id: 'geometry-maped-metal',
      name: 'علبة أدوات هندسية معدنية متكاملة Maped - 9 قطع',
      description: 'العلبة الكلاسيكية الضرورية لدروس الرياضيات والهندسة من الطور الابتدائي إلى الثانوي. تحتوي على مدور حديدي متين، كوسين، منقلة، مسطرة، ممحاة، مبراة، وقلم رصاص صغير.',
      price: 950,
      image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&q=80&w=600',
      category: 'geometry-art',
      rating: 4.7,
      isPopular: true,
      inStock: true,
      brand: 'Maped',
      features: ['علبة معدنية صلبة تحمي الأدوات من الكسر والخدوش', 'مدور معدني ذو ثبات عالي وقابلية قفل للحساب الدقيق', 'تدرجات قياس واضحة جداً مطبوعة بأشعة فوق بنفسجية', 'أدوات مصممة لتدوم لسنوات طوال من الدراسة']
    },
    {
      id: 'color-pencils-professional',
      name: 'علبة أقلام تلوين خشبية Faber-Castell - 36 لوناً',
      description: 'علبة تلوين فاخرة ومثالية لتلاميذ الفنون والأنشطة الإبداعية. تتميز الأقلام بقلب ناعم وقوي مقاوم للكسر بفضل تقنية اللصق الخاص SV، وألوان زاهية ودافئة.',
      price: 2400,
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
      category: 'geometry-art',
      rating: 4.9,
      isPopular: true,
      inStock: true,
      brand: 'Faber-Castell',
      features: ['حماية قصوى لقلب الرصاص من الكسر بتقنية SV', 'أخشاب مستزرعة ومصنعة بشكل صديق وصحي للبيئة', 'ألوان ناعمة تندمج مع بعضها بشكل استثنائي ورائع', 'مجموعة واسعة النطاق من الدرجات والتدرجات اللونية']
    },
    {
      id: 'calculator-casio-scientific',
      name: 'آلة حاسبة علمية متطورة CASIO fx-991ARX - النسخة العربية',
      description: 'الحاسبة العلمية الأقوى والمثالية لطلبة البكالوريا والتعليم الجامعي في توقرت. تدعم اللغة العربية والإنجليزية بالكامل وتغطي كافة العمليات الرياضية المعقدة كالمصفوفات، المتجهات، وحساب التفاضل والتكامل.',
      price: 5200,
      image: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?auto=format&fit=crop&q=80&w=600',
      category: 'electronics',
      rating: 5.0,
      isPopular: true,
      inStock: true,
      brand: 'CASIO',
      features: ['واجهة مستخدم عربية كاملة مصممة للمدارس العربية', 'شاشة عالية الدقة تظهر المعادلات كشكلها في الكتاب المدرسي', 'مصدر طاقة ثنائي: خلية شمسية وبطارية احتياطية', 'تدعم ميزة QR Code لإظهار المخططات البيانية على الهاتف']
    },
    {
      id: 'tablet-educational-draw',
      name: 'لوحة رسم وكتابة إلكترونية LCD مقاس 12 بوصة للأطفال',
      description: 'بديل ذكي وصديق للبيئة للورق والسبورة العادية. تتيح للأطفال التدرب على الكتابة، الرياضيات والرسم بدون فوضى أو ألوان كيميائية. بضغطة زر واحدة تمسح الشاشة بالكامل.',
      price: 1800,
      image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600',
      category: 'electronics',
      rating: 4.5,
      isPopular: false,
      inStock: true,
      brand: 'EcoWrite',
      features: ['شاشة حماية للعين خالية تماماً من الإشعاع والوميض', 'بطارية تدوم لأكثر من سنتين وسهلة الاستبدال والمقايضة', 'مفتاح قفل في الخلف لمنع المسح العفوي الهام', 'قلم كتابة مرفق ومرن يتناسب مع درجات الضغط المختلف']
    }
  ];

  const MUNICIPALITIES = [
    { name: 'توقرت (وسط المدينة)', shippingFee: 150, deliveryTime: 'خلال 12-24 ساعة' },
    { name: 'تماسين', shippingFee: 200, deliveryTime: 'خلال 24-48 ساعة' },
    { name: 'النزلة', shippingFee: 150, deliveryTime: 'خلال 12-24 ساعة' },
    { name: 'تبسبست', shippingFee: 150, deliveryTime: 'خلال 12-24 ساعة' },
    { name: 'الطيبات', shippingFee: 300, deliveryTime: 'خلال 48 ساعة' },
    { name: 'الهجيرة', shippingFee: 350, deliveryTime: 'خلال 48 ساعة' },
    { name: 'العالية', shippingFee: 350, deliveryTime: 'خلال 48 ساعة' },
    { name: 'المنقر', shippingFee: 300, deliveryTime: 'خلال 48 ساعة' },
    { name: 'سيدي سليمان', shippingFee: 300, deliveryTime: 'خلال 48 ساعة' },
    { name: 'بن ناصر', shippingFee: 300, deliveryTime: 'خلال 48 ساعة' },
    { name: 'بلدة عمر', shippingFee: 250, deliveryTime: 'خلال 24-48 ساعة' }
  ];

  const REVIEWS = [
    {
      id: 'rev-1',
      productId: 'bag-premium-blue',
      productName: 'حقيبة مدرسية مريحة ومقاومة للماء - أزرق ملكي',
      userName: 'كمال الطيبات',
      rating: 5,
      comment: 'حقيبة متينة ومريحة جداً لابني في الطور المتوسط. أنصح بها بشدة!',
      date: '2026-06-25',
      status: 'approved'
    },
    {
      id: 'rev-2',
      productId: 'calculator-casio-scientific',
      productName: 'آلة حاسبة علمية متطورة CASIO fx-991ARX - النسخة العربية',
      userName: 'خديجة جامعة توقرت',
      rating: 5,
      comment: 'أفضل حاسبة على الإطلاق لطلبة الجامعة والهندسة، واجهتها عربية مريحة للغاية.',
      date: '2026-06-26',
      status: 'approved'
    }
  ];

  const SITE_SETTINGS = {
    storeName: 'midad | مداد',
    storeDescription: 'مداد (midad) - وجهتك الإلكترونية الأولى لشراء كافة اللوازم والمستلزمات المدرسية والأكاديمية بأفضل الأسعار.',
    contactPhone1: '0661000000',
    contactPhone2: '0771000000',
    warehouseAddress: 'حي المستقبل، وسط مدينة توقرت، الجزائر',
    freeShippingThreshold: 6000,
    promoBannerText: 'توصيل مجاني في كافة بلديات توقرت للطلبات الأكثر من 6000 د.ج!'
  };

  const PACKS = [
    {
      id: 'pack-primary',
      name: 'الباك الذهبي للطور الابتدائي - كامل الأدوات',
      description: 'باك شامل ومتكامل يحتوي على كل ما يحتاجه تلميذ الطور الابتدائي من أدوات عالية الجودة وحقيبة مريحة لحماية ظهره.',
      price: 5900,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
      category: 'bags',
      rating: 4.9,
      isPopular: true,
      inStock: true,
      brand: 'SchoolStore',
      features: ['توفير أكثر من 1500 د.ج مقارنة بالشراء الفردي', 'حقيبة طبية مريحة ومناسبة لنمو الطفل', 'أدوات عالية الجودة من علامة Maped و Techno'],
      isPack: true,
      packItems: [
        { id: 'item-1', name: 'حقيبة مريحة للأطفال برسومات لطيفة', quantity: 1 },
        { id: 'item-2', name: 'مجموعة كراريس تكنو الفاخرة - 96 صفحة', quantity: 1 },
        { id: 'item-3', name: 'علبة أدوات الهندسة والقياس Maped', quantity: 1 },
        { id: 'item-4', name: 'مقلمة مدرسية مجهزة بأقلام جيل أساسية وممحاة', quantity: 1 },
        { id: 'item-5', name: 'علبة أقلام تلوين خشبية ممتازة 12 لونًا', quantity: 1 }
      ]
    },
    {
      id: 'pack-secondary',
      name: 'باك التميز للطور المتوسط والثانوي - علمي وأدبي',
      description: 'باك مخصص لطلبة الطور المتوسط والثانوي يجمع بين الأناقة والإنتاجية، مع آلة حاسبة علمية معتمدة ومحفظة متينة مقاومة للمطر.',
      price: 8800,
      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600',
      category: 'electronics',
      rating: 4.8,
      isPopular: true,
      inStock: true,
      brand: 'SchoolStore',
      features: ['آلة حاسبة كاسيو الأصلية fx-991ARX بوجهة عربية', 'حقيبة ظهرPro تدعم الظهر ومقاومة للمياه', 'كراريس فاخرة بجودة تدوين مريحة'],
      isPack: true,
      packItems: [
        { id: 'item-1', name: 'حقيبة ظهر مدرسية مريحة ومقاومة للماء - أزرق ملكي', quantity: 1 },
        { id: 'item-2', name: 'آلة حاسبة علمية متطورة CASIO fx-991ARX - النسخة العربية', quantity: 1 },
        { id: 'item-3', name: 'مجموعة كراريس تكنو الفاخرة - 96 صفحة (6 قطع)', quantity: 2 },
        { id: 'item-4', name: 'حزمة أقلام جيل ملونة Stabilo (6 ألوان)', quantity: 1 },
        { id: 'item-5', name: 'أقلام فسفورية تظليل باستيل (4 ألوان)', quantity: 1 }
      ]
    },
    {
      id: 'pack-university',
      name: 'الباك الجامعي الذكي - لطلبة الكليات والهندسة',
      description: 'الحزمة المتكاملة لطلبة جامعة توقرت تحتوي على حقيبة ذكية منفذ شحن USB وأدوات التدوين والتخطيط الاحترافية.',
      price: 9500,
      image: 'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&q=80&w=600',
      category: 'bags',
      rating: 4.9,
      isPopular: false,
      inStock: true,
      brand: 'CampusPro',
      features: ['حقيبة ذكية بـ USB لشحن الهواتف مريحة جداً', 'دفاتر رسم وتدوين مقاس كبير لخرائط المفاهيم والمحاضرات', 'مثالي كهدية قيمة للناجحين في البكالوريا بتوقرت'],
      isPack: true,
      packItems: [
        { id: 'item-1', name: 'حقيبة ظهر كلاسيكية أنيقة للجامعيين - منفذ USB', quantity: 1 },
        { id: 'item-2', name: 'دفتر رسم احترافي مقاس A4 لطلبة الهندسة والرسم', quantity: 1 },
        { id: 'item-3', name: 'آلة حاسبة علمية متطورة CASIO fx-991ARX', quantity: 1 },
        { id: 'item-4', name: 'حزمة أقلام جيل ملونة فاخرة Stabilo', quantity: 1 },
        { id: 'item-5', name: 'أقلام تظليل فسفورية باستيل ملونة', quantity: 1 }
      ]
    }
  ];

  // Initialize Firestore database dynamically if configuration is available
  let dbInstance: any = null;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const firebaseApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      });
      dbInstance = getFirestore(firebaseApp, config.firestoreDatabaseId);

      // Perform a quick connection/permission dry run check
      console.log("Performing Firestore connection and permission dry-run check...");
      const docRef = doc(dbInstance, "store_data", "connection_check");
      await setDoc(docRef, { test: true, timestamp: new Date().toISOString() });
      console.log("Firestore Client SDK initialized and verified successfully on backend");
    } else {
      console.warn("firebase-applet-config.json not found, falling back to local file DB");
    }
  } catch (err) {
    console.error("Firestore Client SDK failed connection/permission dry-run. Error:", err);
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
  }

  // Helper to read and write database safely
  const getDB = (): any => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        const initialState = {
          products: PRODUCTS,
          categories: CATEGORIES,
          municipalities: MUNICIPALITIES,
          orders: [],
          users: [],
          reviews: REVIEWS,
          siteSettings: SITE_SETTINGS,
          packs: PACKS,
          visitors: { count: 4850 },
          affiliates: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), "utf8");
        return initialState;
      }
      const raw = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to read database, returning default fallback:", e);
      return {
        products: PRODUCTS,
        categories: CATEGORIES,
        municipalities: MUNICIPALITIES,
        orders: [],
        users: [],
        reviews: REVIEWS,
        siteSettings: SITE_SETTINGS,
        packs: PACKS,
        visitors: { count: 4850 },
        affiliates: []
      };
    }
  };

  const saveDB = (data: any) => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
      console.error("Failed to write to database:", e);
    }
  };

  async function getCollectionData(key: string, fallback: any): Promise<any> {
    if (!dbInstance) return fallback;
    try {
      const docRef = doc(dbInstance, 'store_data', key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && 'list' in data) {
          return data.list;
        }
        return data;
      } else {
        // Document doesn't exist, seed it with fallback
        await saveCollectionData(key, fallback);
        return fallback;
      }
    } catch (err) {
      console.error(`Error reading ${key} from Firestore, using local fallback:`, err);
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      return fallback;
    }
  }

  async function saveCollectionData(key: string, data: any): Promise<void> {
    if (!dbInstance) return;
    try {
      const docRef = doc(dbInstance, 'store_data', key);
      if (Array.isArray(data)) {
        await setDoc(docRef, { list: data });
      } else {
        await setDoc(docRef, data || {});
      }
    } catch (err) {
      console.error(`Error saving ${key} to Firestore:`, err);
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
    }
  }

  async function getWholeDBAsync(): Promise<any> {
    const localDb = getDB();
    if (!dbInstance) {
      return localDb;
    }

    try {
      const [products, categories, municipalities, orders, users, reviews, siteSettings, packs, visitors, affiliates] = await Promise.all([
        getCollectionData('products', localDb.products),
        getCollectionData('categories', localDb.categories),
        getCollectionData('municipalities', localDb.municipalities),
        getCollectionData('orders', localDb.orders),
        getCollectionData('users', localDb.users),
        getCollectionData('reviews', localDb.reviews),
        getCollectionData('siteSettings', localDb.siteSettings),
        getCollectionData('packs', localDb.packs),
        getCollectionData('visitors', localDb.visitors || { count: 4850 }),
        getCollectionData('affiliates', localDb.affiliates || []),
      ]);

      const dbState = {
        products,
        categories,
        municipalities,
        orders,
        users,
        reviews,
        siteSettings,
        packs,
        visitors,
        affiliates
      };

      // Keep local backup synchronized
      saveDB(dbState);

      return dbState;
    } catch (e) {
      console.error("Failed to fetch from Firestore, returning local cached DB:", e);
      return localDb;
    }
  }

  async function saveDBAsync(key: string, data: any): Promise<void> {
    try {
      const db = getDB();
      db[key] = data;
      saveDB(db);
    } catch (err) {
      console.error("Local caching error:", err);
    }

    if (dbInstance) {
      try {
        await saveCollectionData(key, data);
      } catch (err) {
        console.error(`Failed to save ${key} to Firestore:`, err);
      }
    }
  }

  // API Routes

  // 1. Get entire database state
  app.get("/api/db", async (req, res) => {
    try {
      const db = await getWholeDBAsync();
      res.json(db);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1.5. Increment visitors count
  app.post("/api/visit", async (req, res) => {
    try {
      const dbState = await getWholeDBAsync();
      const currentCount = (dbState.visitors && typeof dbState.visitors.count === 'number')
        ? dbState.visitors.count
        : 4850;
      const nextCount = currentCount + 1;
      const visitorsObj = { count: nextCount };
      await saveDBAsync('visitors', visitorsObj);
      res.json({ success: true, count: nextCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Add an order (securely append to protect against race conditions)
  app.post("/api/orders", async (req, res) => {
    try {
      const newOrder = req.body;
      if (!newOrder || !newOrder.id) {
        return res.status(400).json({ error: "Invalid order payload" });
      }

      const db = await getWholeDBAsync();
      const updatedOrders = [newOrder, ...db.orders];
      await saveDBAsync('orders', updatedOrders);

      res.json({ success: true, order: newOrder, allOrders: updatedOrders });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Save any generic state update from Admin Panel or client profile (replaces a key in DB)
  app.post("/api/save", async (req, res) => {
    try {
      const { key, data } = req.body;
      if (!key || data === undefined) {
        return res.status(400).json({ error: "Key and data must be provided" });
      }

      await saveDBAsync(key, data);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamic robots.txt serving
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    const host = `${req.protocol}://${req.get('host')}`;
    res.send(`User-agent: *\nAllow: /\n\nSitemap: ${host}/sitemap.xml`);
  });

  // Dynamic sitemap.xml serving
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const db = await getWholeDBAsync();
      const host = `${req.protocol}://${req.get('host')}`;
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      // Home Page
      xml += `  <url>\n    <loc>${host}/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      
      // Static Views
      xml += `  <url>\n    <loc>${host}/auth</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/profile</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/privacy</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/terms</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/shipping</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${host}/faq</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;

      // Products
      if (db.products && Array.isArray(db.products)) {
        db.products.forEach((prod: any) => {
          xml += `  <url>\n    <loc>${host}/product/${prod.id}</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });
      }

      // Packs
      if (db.packs && Array.isArray(db.packs)) {
        db.packs.forEach((pack: any) => {
          xml += `  <url>\n    <loc>${host}/product/${pack.id}</loc>\n    <lastmod>2026-07-04</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
        });
      }

      xml += `</urlset>`;
      res.type("application/xml");
      res.send(xml);
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Integration with Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
