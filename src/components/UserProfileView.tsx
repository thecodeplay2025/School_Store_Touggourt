import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Heart, 
  LogOut, 
  Edit2, 
  Save, 
  Clock, 
  CheckCircle, 
  Truck, 
  HelpCircle,
  Phone,
  Mail,
  ShieldCheck,
  TrendingUp,
  Tag
} from 'lucide-react';
import { User as UserType, Order, Product } from '../types';
import { getCompatibleImageUrl } from '../utils/imageHelper';

interface UserProfileViewProps {
  user: UserType;
  onLogout: () => void;
  onUpdateUser: (updated: UserType) => void;
  allOrders: Order[];
  wishlist: Product[];
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  formatPrice: (price: number) => string;
}

export default function UserProfileView({
  user,
  onLogout,
  onUpdateUser,
  allOrders,
  wishlist,
  onRemoveFromWishlist,
  onAddToCart,
  formatPrice
}: UserProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'wishlist'>('profile');
  
  // Profile Form States
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.address || '');
  const [municipality, setMunicipality] = useState(user.municipality || 'توقرت (وسط المدينة)');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const municipalities = [
    'توقرت (وسط المدينة)', 'تماسين', 'النزلة', 'تبسبست', 'الطيبات', 
    'الهجيرة', 'العالية', 'المنقر', 'سيدي سليمان', 'بن ناصر', 'بلدة عمر'
  ];

  // Filter orders for this user by name, phone, or email
  const userOrders = allOrders.filter(o => 
    o.customerEmail?.toLowerCase() === user.email.toLowerCase() || 
    o.phone === user.phone ||
    o.customerName.toLowerCase() === user.name.toLowerCase()
  );

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserType = {
      ...user,
      name,
      phone,
      address,
      municipality
    };
    onUpdateUser(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return { text: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'confirmed': return { text: 'تم التأكيد', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'shipped': return { text: 'تم الشحن مع المندوب', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'delivered': return { text: 'تم الاستلام بنجاح', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default: return { text: 'غير معروف', color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="profile-container-view">
      {/* Top Banner / Welcome card */}
      <div className="bg-gradient-to-r from-brand-blue to-indigo-900 rounded-[32px] text-white p-6 sm:p-10 shadow-lg relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-right">
            <div className="bg-white/10 p-4.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
              <User className="h-10 w-10 text-brand-yellow" />
            </div>
            <div>
              <span className="bg-brand-yellow/20 text-brand-yellow text-[11px] font-black px-3 py-1 rounded-full border border-brand-yellow/10">حساب عميل معتمد ⭐️</span>
              <h2 className="text-2xl font-black mt-2">{user.name}</h2>
              <p className="text-xs text-slate-300 mt-1 font-semibold flex items-center gap-1.5 justify-end">
                <span>{user.email}</span>
                <Mail className="h-3.5 w-3.5 text-slate-400" />
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all border border-white/10 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2.5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-right p-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-between border ${
              activeTab === 'profile'
                ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <User className="h-4.5 w-4.5" />
              <span>البيانات الشخصية</span>
            </div>
            {activeTab === 'profile' && <span className="h-2 w-2 rounded-full bg-brand-blue"></span>}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-right p-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-between border ${
              activeTab === 'orders'
                ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-4.5 w-4.5" />
              <span>طلباتي السابقة</span>
              {userOrders.length > 0 && (
                <span className="bg-brand-blue text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {userOrders.length}
                </span>
              )}
            </div>
            {activeTab === 'orders' && <span className="h-2 w-2 rounded-full bg-brand-blue"></span>}
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-right p-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-between border ${
              activeTab === 'addresses'
                ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4.5 w-4.5" />
              <span>دفتر العناوين بالتفصيل</span>
            </div>
            {activeTab === 'addresses' && <span className="h-2 w-2 rounded-full bg-brand-blue"></span>}
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full text-right p-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-between border ${
              activeTab === 'wishlist'
                ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Heart className="h-4.5 w-4.5 text-rose-500" />
              <span>قائمتي المفضلة</span>
              {wishlist.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {wishlist.length}
                </span>
              )}
            </div>
            {activeTab === 'wishlist' && <span className="h-2 w-2 rounded-full bg-brand-blue"></span>}
          </button>
        </div>

        {/* Tab content panel */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 min-h-[400px] shadow-sm">
          {saveSuccess && (
            <div className="mb-5 bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
              <span>تم حفظ بياناتك وتحديثها بنجاح!</span>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">الملف الشخصي للعميل</h3>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">تحكم ببيانات حسابك وابقها محدثة لتأكيد توصيل السلع</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-slate-50 hover:bg-blue-50 text-brand-blue px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-100 flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>تعديل البيانات</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">الاسم واللقب</label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 disabled:bg-slate-50/50 disabled:text-slate-500 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">البريد الإلكتروني (غير قابل للتعديل)</label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full bg-slate-100 text-slate-400 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-mono text-left"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">رقم الهاتف النشط للتأكيد</label>
                    <input
                      type="tel"
                      required
                      disabled={!isEditing}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 disabled:bg-slate-50/50 disabled:text-slate-500 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/20 text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">البلدية بجمهورية الجزائر</label>
                    <select
                      disabled={!isEditing}
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      className="w-full bg-slate-50 disabled:bg-slate-50/50 disabled:text-slate-500 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 text-right"
                    >
                      {municipalities.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">العنوان الكامل بالتفصيل (حي، شارع، مبنى)</label>
                  <textarea
                    required
                    disabled={!isEditing}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 disabled:text-slate-500 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20 text-right"
                    placeholder="مثال: حي المستقبل، عمارة 12، الطابق الثالث"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-2.5 pt-3">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                    >
                      <Save className="h-4 w-4" />
                      <span>حفظ التعديلات الجديدة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName(user.name);
                        setPhone(user.phone || '');
                        setAddress(user.address || '');
                        setMunicipality(user.municipality || 'توقرت (وسط المدينة)');
                        setIsEditing(false);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                )}
              </form>

              {/* Secure guarantee card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3 mt-6">
                <ShieldCheck className="h-10 w-10 text-emerald-600 shrink-0" />
                <div className="text-right">
                  <h4 className="text-xs font-bold text-slate-900">توصيل محلي آمن ومضمون</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-semibold">بصفتك عميلاً مسجلاً بولاية توقرت، يتم إرسال جميع طلبياتك كأولوية قصوى. لا تتردد في تحديث عنوانك لضمان عدم حدوث أي تأخير.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">طلباتي السابقة وتتبع الشحن</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">تابع طلبيات الأدوات المدرسية مباشرة من المخزن إلى منزلك</p>
              </div>

              {userOrders.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                  <div className="bg-blue-50 text-brand-blue inline-flex p-4 rounded-full mb-3">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">لا توجد لديك طلبيات سابقة مسجلة</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm mx-auto font-medium">سجل أول طلبية أدوات، كراريس، أو حقيبة ظهر لتظهر في حسابك ويتم تتبعها تلقائياً.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userOrders.map((order) => {
                    const statusInfo = getStatusLabel(order.status);
                    const currentStatus = order.status as string;
                    return (
                      <div key={order.id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                        {/* Order Header */}
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="bg-slate-200 text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-lg">رقم الطلب: {order.id}</span>
                            <span className="text-slate-400 text-xs font-semibold">{order.date}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </div>

                        {/* Order Body */}
                        <div className="p-4 space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-1 py-1.5 border-b border-slate-100 last:border-0 text-right" dir="rtl">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-500 font-medium">{item.quantity} × {item.product.name}</span>
                                <span className="text-slate-800">{formatPrice(item.product.price * item.quantity)}</span>
                              </div>
                              {item.product.isPack && item.product.packItems && (
                                <div className="text-[10px] text-slate-400 mr-4 mt-0.5 space-y-0.5" dir="rtl">
                                  {item.product.packItems.map((pi, piIdx) => (
                                    <div key={pi.id || piIdx}>- {pi.name} ({pi.quantity}x)</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Order Footer */}
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">العنوان: {order.municipality} - {order.address}</span>
                          <span className="text-sm font-black text-brand-blue">الإجمالي: {formatPrice(order.total)}</span>
                        </div>

                        {/* Interactive Steps Progress Indicator */}
                        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-4">
                          {currentStatus !== 'delivered' && (
                            <div className="flex items-center justify-around w-full">
                              <div className="flex flex-col items-center text-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  currentStatus === 'pending' || currentStatus === 'confirmed' || currentStatus === 'shipped' || currentStatus === 'delivered'
                                    ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <Clock className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 mt-1">تجهيز الطلب</span>
                              </div>

                              <div className="flex-1 h-[2px] bg-slate-100 mx-2">
                                <div className={`h-full ${
                                  currentStatus === 'confirmed' || currentStatus === 'shipped' || currentStatus === 'delivered' ? 'bg-emerald-500' : 'bg-slate-100'
                                }`} />
                              </div>

                              <div className="flex flex-col items-center text-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  currentStatus === 'confirmed' || currentStatus === 'shipped' || currentStatus === 'delivered'
                                    ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <CheckCircle className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 mt-1">تم التأكيد</span>
                              </div>

                              <div className="flex-1 h-[2px] bg-slate-100 mx-2">
                                <div className={`h-full ${
                                  currentStatus === 'shipped' || currentStatus === 'delivered' ? 'bg-emerald-500' : 'bg-slate-100'
                                }`} />
                              </div>

                              <div className="flex flex-col items-center text-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  currentStatus === 'shipped' || currentStatus === 'delivered'
                                    ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <Truck className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 mt-1">مع المندوب</span>
                              </div>

                              <div className="flex-1 h-[2px] bg-slate-100 mx-2">
                                <div className={`h-full ${
                                  currentStatus === 'delivered' ? 'bg-emerald-500' : 'bg-slate-100'
                                }`} />
                              </div>

                              <div className="flex flex-col items-center text-center">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  currentStatus === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <ShieldCheck className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 mt-1">تم الاستلام</span>
                              </div>
                            </div>
                          )}

                          {currentStatus === 'delivered' && (
                            <motion.div 
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 text-center shadow-sm"
                            >
                              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
                              <span>🎉 تم الاستلام بنجاح! شكراً لكم على تسوقكم معنا.</span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">إدارة العناوين المسجلة</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">تحكم في موقع التسليم والبلديات المحددة لتوفير رسوم الشحن</p>
              </div>

              <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-right flex items-start gap-3">
                  <div className="bg-brand-blue/10 p-3 rounded-2xl text-brand-blue shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">العنوان الافتراضي للتوصيل</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">البلدية: <strong className="text-brand-blue">{user.municipality || 'توقرت وسط المدينة'}</strong></p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">الشارع: <span className="text-slate-800 font-bold">{user.address || 'لم يتم تحديده'}</span></p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">الهاتف النشط: <span className="text-slate-800 font-mono font-bold">{user.phone || 'لم يتم تحديده'}</span></p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('profile')}
                  className="bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  تحديث العنوان
                </button>
              </div>
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">قائمة الأدوات المفضلة</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">الأدوات والحقائب المدرسية التي حفظتها لطلبها لاحقاً</p>
              </div>

              {wishlist.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                  <div className="bg-rose-50 text-rose-500 inline-flex p-4 rounded-full mb-3">
                    <Heart className="h-8 w-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">قائمتك المفضلة فارغة حالياً</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm mx-auto font-medium">تصفح سلع ومستلزمات متجر توقرت واضغط على رمز القلب ❤️ لتجميعها هنا.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map((product) => (
                    <div key={product.id} className="border border-slate-100 rounded-2xl p-4 flex gap-4 hover:shadow-md transition-all bg-slate-50">
                      <img
                        src={getCompatibleImageUrl(product.image)}
                        alt={product.name}
                        className="h-20 w-20 rounded-xl object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 text-right flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{product.name}</h4>
                          <span className="text-xs font-black text-brand-blue mt-1 block">{formatPrice(product.price)}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => onAddToCart(product)}
                            className="bg-brand-blue hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-sm"
                          >
                            إضافة للسلة 🛒
                          </button>
                          <button
                            onClick={() => onRemoveFromWishlist(product)}
                            className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
