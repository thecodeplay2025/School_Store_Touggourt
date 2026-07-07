import { Product, Category, Municipality } from './types';

export const CATEGORIES: Category[] = [
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
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
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

export const PRODUCTS: Product[] = [
  // Bags
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

  // Notebooks
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

  // Writing instruments
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

  // Geometry and Art
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

  // Electronics
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

export const MUNICIPALITIES: Municipality[] = [
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
