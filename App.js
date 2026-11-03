import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  StatusBar,
  Platform,
  I18nManager,
  Dimensions,
} from 'react-native';
import { addDoc, listDocs, updateDoc } from './firebase';

// ============ تنظیمات و ابزارها ============
const W = Math.min(Dimensions.get('window').width, 480);
const ORANGE = '#FF6B2C';
const DARK = '#1F1B24';
const BG = '#FFF9F4';
const PURPLE = '#6C4CF1';
const GREEN = '#1FA971';
const RED = '#E5383B';
const GRAY = '#8A8590';

const FREE_SHIPPING_FROM = 500000;
const COURIER_FEE = 35000;
const COUPONS = { LOQME20: 0.2, FIRST10: 0.1 };
const CARD_W = (W - 40 - 12) / 2;

const ROW = I18nManager.isRTL ? 'row' : 'row-reverse';
const PRIGHT = I18nManager.isRTL ? { left: 8 } : { right: 8 };
const PLEFT = I18nManager.isRTL ? { right: 8 } : { left: 8 };
const rtl = { textAlign: 'right', writingDirection: 'rtl' };

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (value) =>
  String(value)
    .replace('.', '٫')
    .replace(/\d/g, (d) => FA_DIGITS[d]);
const formatPrice = (n) =>
  toFa(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')).replace(/,/g, '٬');
const pad2 = (n) => (n < 10 ? '0' + n : String(n));

// ============ داده‌ها ============
const CATEGORIES = [
  { key: 'all', label: 'همه', emoji: '✨' },
  { key: 'burger', label: 'برگر', emoji: '🍔' },
  { key: 'pizza', label: 'پیتزا', emoji: '🍕' },
  { key: 'sandwich', label: 'ساندویچ', emoji: '🌯' },
  { key: 'salad', label: 'سالاد', emoji: '🥗' },
  { key: 'drink', label: 'نوشیدنی', emoji: '🥤' },
  { key: 'dessert', label: 'دسر', emoji: '🍰' },
  { key: 'fav', label: 'علاقه‌مندی‌ها', emoji: '❤️' },
];

const SORTS = [
  { key: 'rec', label: 'پیشنهادی' },
  { key: 'pop', label: 'محبوب‌ترین' },
  { key: 'cheap', label: 'ارزان‌ترین' },
  { key: 'exp', label: 'گران‌ترین' },
];

const P = (id, name, category, desc, price, oldPrice, rating, reviews, time, emoji, color, badge) => ({
  id, name, category, desc, price, oldPrice, rating, reviews, time, emoji, color, badge,
});

const FOODS = [
  P('1', 'برگر کلاسیک', 'burger', 'گوشت گوساله، پنیر چدار و کاهوی تازه', 185000, null, 4.8, 312, 20, '🍔', '#FFE8D6', 'پرفروش'),
  P('2', 'دبل چیز برگر', 'burger', 'دو لایه گوشت و سس مخصوص شف', 245000, 285000, 4.9, 278, 25, '🍔', '#FFE0E0', null),
  P('3', 'برگر قارچ و پنیر', 'burger', 'گوشت گریل با قارچ و پنیر ذوب‌شده', 215000, null, 4.7, 164, 22, '🍔', '#F3E6D8', null),
  P('4', 'برگر مرغ کرانچی', 'burger', 'فیله مرغ سوخاری با سس رنچ', 175000, null, 4.6, 201, 18, '🍗', '#FFF1C9', 'جدید'),
  P('5', 'پیتزا مارگاریتا', 'pizza', 'سس گوجه، موزارلا و ریحان تازه', 230000, null, 4.7, 254, 30, '🍕', '#FFF1C9', null),
  P('6', 'پیتزا پپرونی', 'pizza', 'پپرونی ترد با پنیر اضافه', 280000, 320000, 4.8, 340, 30, '🍕', '#FFE0E0', null),
  P('7', 'پیتزا مرغ و قارچ', 'pizza', 'مرغ گریل، قارچ و فلفل دلمه‌ای', 260000, null, 4.6, 142, 32, '🍕', '#FFEFD5', null),
  P('8', 'پیتزا چهار فصل', 'pizza', 'ترکیب ویژه سبزیجات، ژامبون و زیتون', 295000, null, 4.7, 98, 35, '🍕', '#E8F5E0', 'جدید'),
  P('9', 'ساندویچ کلاب', 'sandwich', 'مرغ، بیکن، تخم‌مرغ و کاهو', 155000, null, 4.5, 120, 15, '🥪', '#F5EBDD', null),
  P('10', 'رپ مرغ و آووکادو', 'sandwich', 'نان لواش، مرغ گریل و آووکادو', 165000, 190000, 4.6, 87, 15, '🌯', '#E5F3DC', null),
  P('11', 'هات‌داگ ویژه', 'sandwich', 'سوسیس آلمانی با پنیر و سس مخصوص', 120000, null, 4.4, 210, 12, '🌭', '#FFE9CC', 'پرفروش'),
  P('12', 'ساندویچ استیک', 'sandwich', 'فیله گوساله، قارچ و پیاز کاراملی', 235000, null, 4.8, 76, 25, '🥩', '#FADDD7', null),
  P('13', 'سالاد سزار', 'salad', 'مرغ گریل، پارمزان و نان تست', 165000, null, 4.6, 133, 10, '🥗', '#DDF3DD', null),
  P('14', 'سالاد یونانی', 'salad', 'خیار، گوجه، زیتون و پنیر فتا', 140000, null, 4.5, 91, 8, '🥙', '#E3F4E1', null),
  P('15', 'سالاد کینوا', 'salad', 'کینوا، آووکادو و سس لیمو', 185000, 210000, 4.7, 64, 10, '🥬', '#D9F0D4', null),
  P('16', 'لیموناد نعنایی', 'drink', 'لیموی تازه با نعنا و یخ', 65000, null, 4.5, 305, 5, '🍋', '#FFF8C4', 'پرفروش'),
  P('17', 'آیس کافی کارامل', 'drink', 'قهوه سرد با شیر و کارامل', 90000, null, 4.7, 230, 6, '☕', '#EADBCF', null),
  P('18', 'اسموتی توت‌فرنگی', 'drink', 'توت‌فرنگی، موز و ماست یونانی', 95000, 110000, 4.6, 118, 7, '🍓', '#FFDDE4', null),
  P('19', 'نوشابه خانواده', 'drink', 'بطری یک و نیم لیتری', 45000, null, 4.3, 420, 2, '🥤', '#E5ECFF', null),
  P('20', 'چیزکیک نیویورکی', 'dessert', 'همراه با سس توت‌فرنگی', 120000, null, 4.9, 189, 5, '🍰', '#FFE4EC', 'پرفروش'),
  P('21', 'براونی شکلاتی', 'dessert', 'گرم، همراه با بستنی وانیل', 110000, null, 4.8, 167, 8, '🍫', '#E9D8CE', null),
  P('22', 'تیرامیسو', 'dessert', 'دسر ایتالیایی با قهوه و کاکائو', 130000, 150000, 4.7, 92, 5, '🍮', '#F6E8D5', null),
  P('23', 'پنکیک عسلی', 'dessert', 'سه لایه با عسل و موز', 105000, null, 4.5, 73, 12, '🥞', '#FFEFD0', 'جدید'),
  P('24', 'بستنی میوه‌ای', 'dessert', 'سه اسکوپ با میوه‌های فصل', 85000, null, 4.4, 108, 3, '🍨', '#E4F0FF', null),
];

const byId = Object.fromEntries(FOODS.map((f) => [f.id, f]));
const sumItems = (items) => items.reduce((s, i) => s + byId[i.id].price * i.qty, 0);
const deliveryFee = (subtotal, type) =>
  type === 'pickup' || subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : COURIER_FEE;

const BANNERS = [
  { title: '۲۰٪ تخفیف اولین سفارش', sub: 'با کد LOQME20', emoji: '🍔', bg: ORANGE, cat: 'burger' },
  { title: 'ارسال رایگان بالای ۵۰۰ هزار تومان', sub: 'فقط برای امروز 🚀', emoji: '🛵', bg: PURPLE, cat: 'all' },
  { title: 'پیتزاهای ویژه شف', sub: 'تازه از تنور 🔥', emoji: '🍕', bg: RED, cat: 'pizza' },
];

const STATUS = ['در حال آماده‌سازی', 'ارسال شد', 'تحویل داده شد'];
const STATUS_COLORS = ['#F59E0B', '#3B82F6', GREEN];

const SEED = [
  [48213, 'امروز ۱۲:۳۰', [{ id: '1', qty: 2 }, { id: '16', qty: 2 }], 2],
  [48198, 'دیروز ۲۰:۱۰', [{ id: '6', qty: 1 }, { id: '20', qty: 2 }, { id: '19', qty: 1 }], 2],
  [48177, 'دیروز ۱۳:۴۵', [{ id: '9', qty: 1 }, { id: '14', qty: 1 }, { id: '17', qty: 2 }], 2],
];
const SEED_ORDERS = SEED.map(([id, time, items, status]) => ({
  id,
  time,
  items,
  status,
  type: 'courier',
  total: sumItems(items) + deliveryFee(sumItems(items), 'courier'),
}));

// ============ اجزای مشترک ============
function Stepper({ qty, onAdd, onRemove }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={onAdd}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
      <Text style={styles.stepQty}>{toFa(qty)}</Text>
      <Pressable style={[styles.stepBtn, styles.stepBtnLight]} onPress={onRemove}>
        <Text style={[styles.stepBtnText, { color: ORANGE }]}>−</Text>
      </Pressable>
    </View>
  );
}

function Segment({ options, value, onChange }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[styles.segItem, value === o.key && styles.segItemActive]}
        >
          <Text style={[styles.segText, value === o.key && styles.segTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function StatusPill({ status }) {
  return (
    <View style={[styles.pill, { backgroundColor: STATUS_COLORS[status] + '22' }]}>
      <Text style={[styles.pillText, { color: STATUS_COLORS[status] }]}>{STATUS[status]}</Text>
    </View>
  );
}

function SummaryRow({ label, value, bold, color }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryBold, color && { color }]}>{value}</Text>
    </View>
  );
}

function TabBar({ screen, setScreen, cartCount }) {
  const tabs = [
    { key: 'home', label: 'منو', emoji: '🍽️' },
    { key: 'cart', label: 'سبد خرید', emoji: '🛒', count: cartCount },
    { key: 'orders', label: 'سفارش‌ها', emoji: '🧾' },
    { key: 'admin', label: 'مدیریت', emoji: '📊' },
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map((t) => {
        const active = screen === t.key;
        return (
          <Pressable key={t.key} style={styles.tabItem} onPress={() => setScreen(t.key)}>
            <View style={[styles.tabIconBox, active && styles.tabIconBoxActive]}>
              <Text style={styles.tabEmoji}>{t.emoji}</Text>
              {t.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{toFa(t.count)}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ============ صفحه منو ============
function Promo({ onPick }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);
  const b = BANNERS[i];
  return (
    <View style={{ marginBottom: 18 }}>
      <Pressable style={[styles.banner, { backgroundColor: b.bg }]} onPress={() => onPick(b.cat)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerSmall}>{b.sub}</Text>
          <Text style={styles.bannerTitle}>{b.title}</Text>
          <View style={styles.bannerButton}>
            <Text style={[styles.bannerButtonText, { color: b.bg }]}>مشاهده</Text>
          </View>
        </View>
        <Text style={styles.bannerEmoji}>{b.emoji}</Text>
      </Pressable>
      <View style={styles.dots}>
        {BANNERS.map((_, k) => (
          <View key={k} style={[styles.dot, k === i && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function ProductCard({ item, qty, fav, onAdd, onRemove, onFav }) {
  const pct = item.oldPrice ? Math.round((1 - item.price / item.oldPrice) * 100) : 0;
  const label = pct ? `${toFa(pct)}٪ تخفیف` : item.badge;
  const badgeBg = pct ? RED : item.badge === 'جدید' ? GREEN : ORANGE;
  return (
    <View style={[styles.pCard, { width: CARD_W }]}>
      <View style={[styles.pImage, { backgroundColor: item.color }]}>
        <Text style={styles.pEmoji}>{item.emoji}</Text>
        {label ? (
          <View style={[styles.badge, PRIGHT, { backgroundColor: badgeBg }]}>
            <Text style={styles.badgeText}>{label}</Text>
          </View>
        ) : null}
        <Pressable style={[styles.heart, PLEFT]} onPress={onFav}>
          <Text style={styles.heartText}>{fav ? '❤️' : '🤍'}</Text>
        </Pressable>
      </View>

      <Text style={styles.pName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.pDesc} numberOfLines={2}>{item.desc}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>⭐ {toFa(item.rating)} ({toFa(item.reviews)})</Text>
        <Text style={styles.meta}>⏱ {toFa(item.time)}′</Text>
      </View>

      <View style={styles.priceBox}>
        {item.oldPrice ? <Text style={styles.oldPrice}>{formatPrice(item.oldPrice)}</Text> : null}
        <Text style={styles.pPrice}>
          {formatPrice(item.price)} <Text style={styles.currency}>تومان</Text>
        </Text>
      </View>

      {qty ? (
        <View style={styles.wideStepper}>
          <Stepper qty={qty} onAdd={onAdd} onRemove={onRemove} />
        </View>
      ) : (
        <Pressable style={styles.addWide} onPress={onAdd}>
          <Text style={styles.addWideText}>افزودن به سبد +</Text>
        </Pressable>
      )}
    </View>
  );
}

function HomeScreen({ cart, favs, add, remove, toggleFav, goCart, cartCount, subtotal }) {
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('rec');
  const [query, setQuery] = useState('');

  let list = FOODS.filter(
    (f) =>
      (category === 'all' || (category === 'fav' ? favs[f.id] : f.category === category)) &&
      f.name.includes(query.trim())
  );
  if (sort === 'pop') list = [...list].sort((a, b) => b.reviews - a.reviews);
  if (sort === 'cheap') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'exp') list = [...list].sort((a, b) => b.price - a.price);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: cartCount > 0 ? 170 : 110 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>سلام! 👋 امروز چی میل داری؟</Text>
            <Text style={styles.brand}>لقمه</Text>
            <Text style={styles.location}>📍 ارسال به: تهران، ونک ▾</Text>
          </View>
          <Pressable style={styles.bell}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </Pressable>
        </View>

        <View style={styles.search}>
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="جستجوی غذا، نوشیدنی، دسر..."
            placeholderTextColor="#A9A3B0"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <Promo onPick={(c) => setCategory(c)} />

        <View style={styles.trustRow}>
          {[
            { e: '⚡', t: 'ارسال سریع', s: 'زیر ۳۰ دقیقه' },
            { e: '🛡️', t: 'تضمین کیفیت', s: 'مواد تازه' },
            { e: '🎁', t: 'ارسال رایگان', s: 'بالای ۵۰۰ هزار' },
          ].map((x) => (
            <View key={x.t} style={styles.trust}>
              <Text style={{ fontSize: 22 }}>{x.e}</Text>
              <Text style={styles.trustTitle}>{x.t}</Text>
              <Text style={styles.trustSub}>{x.s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>دسته‌بندی‌ها</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[styles.chip, category === c.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>
                {c.emoji} {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitleNoMargin}>منوی امروز</Text>
          <Text style={styles.countText2}>{toFa(list.length)} مورد</Text>
        </View>
        <View style={styles.sortRow}>
          {SORTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
            >
              <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {list.length === 0 ? (
          <View style={styles.noResult}>
            <Text style={{ fontSize: 56 }}>😕</Text>
            <Text style={styles.emptyText}>
              {category === 'fav' ? 'هنوز غذایی را به علاقه‌مندی‌ها اضافه نکرده‌اید' : 'غذایی با این مشخصات پیدا نشد'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {list.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                qty={cart[item.id]}
                fav={!!favs[item.id]}
                onAdd={() => add(item.id)}
                onRemove={() => remove(item.id)}
                onFav={() => toggleFav(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {cartCount > 0 && (
        <Pressable style={styles.floatBar} onPress={goCart}>
          <View style={styles.floatCount}>
            <Text style={styles.floatCountText}>{toFa(cartCount)}</Text>
          </View>
          <Text style={styles.floatText}>مشاهده سبد خرید</Text>
          <Text style={styles.floatPrice}>{formatPrice(subtotal)} تومان</Text>
        </Pressable>
      )}
    </View>
  );
}

// ============ صفحه سبد خرید ============
function CartScreen({ items, cart, subtotal, totals, checkout, setCheckout, onAdd, onRemove, goHome, onOrder }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  const applyCode = () => {
    const c = code.trim().toUpperCase();
    if (COUPONS[c]) {
      setCheckout({ ...checkout, coupon: c });
      setErr('');
      setCode('');
    } else {
      setErr('کد تخفیف معتبر نیست');
    }
  };

  const remaining = Math.max(0, FREE_SHIPPING_FROM - subtotal);
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_FROM) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>سبد خرید</Text>
        {items.length > 0 && <Text style={styles.headerSub}>{toFa(items.length)} نوع غذا</Text>}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={{ fontSize: 64 }}>🛒</Text>
          <Text style={styles.emptyTitle}>سبد خرید شما خالی است</Text>
          <Text style={styles.emptyText}>از منو چند غذای خوشمزه انتخاب کنید</Text>
          <Pressable style={[styles.primaryButton, { alignSelf: 'stretch' }]} onPress={goHome}>
            <Text style={styles.primaryButtonText}>مشاهده منو</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 14 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {items.map((item) => (
            <View key={item.id} style={styles.cartRow}>
              <View style={[styles.cartImage, { backgroundColor: item.color }]}>
                <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cartName}>{item.name}</Text>
                <Text style={styles.cartUnit}>{formatPrice(item.price * cart[item.id])} تومان</Text>
              </View>
              <Stepper qty={cart[item.id]} onAdd={() => onAdd(item.id)} onRemove={() => onRemove(item.id)} />
            </View>
          ))}

          {checkout.type === 'courier' && (
            <View style={styles.box}>
              <Text style={styles.boxText}>
                {remaining > 0
                  ? `با ${formatPrice(remaining)} تومان خرید بیشتر، ارسال رایگان می‌شود 🚀`
                  : '🎉 ارسال سفارش شما رایگان شد!'}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%` }]} />
              </View>
            </View>
          )}

          <View style={styles.box}>
            <Text style={styles.boxTitle}>نحوه دریافت</Text>
            <Segment
              value={checkout.type}
              onChange={(v) => setCheckout({ ...checkout, type: v })}
              options={[
                { key: 'courier', label: '🛵 ارسال با پیک' },
                { key: 'pickup', label: '🏪 تحویل حضوری' },
              ]}
            />
          </View>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>روش پرداخت</Text>
            <Segment
              value={checkout.pay}
              onChange={(v) => setCheckout({ ...checkout, pay: v })}
              options={[
                { key: 'online', label: '💳 پرداخت آنلاین' },
                { key: 'cash', label: '💵 پرداخت در محل' },
              ]}
            />
          </View>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>کد تخفیف 🎟️</Text>
            {checkout.coupon ? (
              <View style={styles.couponOk}>
                <Text style={styles.couponOkText}>
                  کد {checkout.coupon} فعال است ({toFa(Math.round(COUPONS[checkout.coupon] * 100))}٪ تخفیف)
                </Text>
                <Pressable onPress={() => setCheckout({ ...checkout, coupon: null })}>
                  <Text style={{ fontSize: 18, color: RED }}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.couponRow}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="مثلاً LOQME20"
                    placeholderTextColor="#A9A3B0"
                    autoCapitalize="characters"
                    value={code}
                    onChangeText={setCode}
                  />
                  <Pressable style={styles.couponBtn} onPress={applyCode}>
                    <Text style={styles.couponBtnText}>اعمال</Text>
                  </Pressable>
                </View>
                {err ? <Text style={styles.errText}>{err}</Text> : null}
              </>
            )}
          </View>

          <View style={styles.summary}>
            <SummaryRow label="جمع سفارش" value={`${formatPrice(subtotal)} تومان`} />
            {totals.discount > 0 && (
              <SummaryRow label="تخفیف" value={`− ${formatPrice(totals.discount)} تومان`} color={GREEN} />
            )}
            <SummaryRow
              label="هزینه ارسال"
              value={totals.fee === 0 ? 'رایگان' : `${formatPrice(totals.fee)} تومان`}
              color={totals.fee === 0 ? GREEN : undefined}
            />
            <View style={styles.divider} />
            <SummaryRow label="مبلغ قابل پرداخت" value={`${formatPrice(totals.total)} تومان`} bold />
            <Pressable style={styles.primaryButton} onPress={onOrder}>
              <Text style={styles.primaryButtonText}>
                {checkout.pay === 'online' ? 'پرداخت و ثبت سفارش' : 'ثبت سفارش'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ============ صفحه سفارش‌ها ============
function OrdersScreen({ orders, onReorder }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>سفارش‌های من</Text>
        <Text style={styles.headerSub}>{toFa(orders.length)} سفارش</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {orders.map((o) => (
          <View key={o.id} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <Text style={styles.orderId}>سفارش #{toFa(o.id)}</Text>
              <StatusPill status={o.status} />
            </View>
            <Text style={styles.orderTime}>{o.time} · {o.type === 'pickup' ? 'تحویل حضوری' : 'ارسال با پیک'}</Text>
            <Text style={styles.orderItems}>
              {o.items.map((i) => `${toFa(i.qty)}× ${byId[i.id].name}`).join('، ')}
            </Text>
            <View style={styles.orderBottom}>
              <Text style={styles.orderTotal}>{formatPrice(o.total)} تومان</Text>
              <Pressable style={styles.reorderBtn} onPress={() => onReorder(o)}>
                <Text style={styles.reorderText}>🔁 سفارش مجدد</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ============ پنل مدیریت ============
function AdminScreen({ orders, onAdvance }) {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const avg = orders.length ? Math.round(revenue / orders.length) : 0;

  const qtyMap = {};
  orders.forEach((o) => o.items.forEach((i) => (qtyMap[i.id] = (qtyMap[i.id] || 0) + i.qty)));
  const top = Object.keys(qtyMap)
    .map((id) => ({ id, qty: qtyMap[id] }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const maxQty = top.length ? top[0].qty : 1;

  const kpis = [
    { e: '💰', v: formatPrice(revenue), l: 'درآمد کل (تومان)', c: GREEN },
    { e: '🧾', v: toFa(orders.length), l: 'تعداد سفارش', c: ORANGE },
    { e: '📈', v: formatPrice(avg), l: 'میانگین سفارش', c: PURPLE },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>پنل مدیریت</Text>
        <Text style={styles.headerSub}>گزارش فروش 📊</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.kpiRow}>
          {kpis.map((k) => (
            <View key={k.l} style={styles.kpi}>
              <Text style={{ fontSize: 22 }}>{k.e}</Text>
              <Text style={[styles.kpiValue, { color: k.c }]} numberOfLines={1} adjustsFontSizeToFit>
                {k.v}
              </Text>
              <Text style={styles.kpiLabel} numberOfLines={1}>{k.l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>پرفروش‌ترین غذاها 🏆</Text>
          {top.map((t, idx) => (
            <View key={t.id} style={styles.barRow}>
              <Text style={styles.barRank}>{toFa(idx + 1)}</Text>
              <Text style={styles.barName} numberOfLines={1}>{byId[t.id].emoji} {byId[t.id].name}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.round((t.qty / maxQty) * 100)}%` }]} />
              </View>
              <Text style={styles.barQty}>{toFa(t.qty)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>مدیریت سفارش‌ها</Text>
          {orders.map((o) => (
            <View key={o.id} style={styles.adminRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.orderId}>#{toFa(o.id)} · {formatPrice(o.total)} تومان</Text>
                <StatusPill status={o.status} />
              </View>
              {o.status < 2 ? (
                <Pressable style={styles.advanceBtn} onPress={() => onAdvance(o.id)}>
                  <Text style={styles.advanceText}>مرحله بعد ›</Text>
                </Pressable>
              ) : (
                <Text style={{ fontSize: 22 }}>✅</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ============ صفحه موفقیت ============
function SuccessScreen({ order, onTrack, onDone }) {
  return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }]}>
      <View style={styles.successCircle}>
        <Text style={{ fontSize: 60 }}>✅</Text>
      </View>
      <Text style={styles.successTitle}>سفارش شما ثبت شد!</Text>
      <Text style={styles.successText}>شماره سفارش: {toFa(order.id)}</Text>
      <Text style={styles.successText}>
        {order.type === 'pickup' ? 'آماده تحویل تا ۲۰ دقیقه دیگر' : 'زمان تقریبی رسیدن: ۳۰ تا ۴۰ دقیقه'} ⏱
      </Text>
      <Text style={styles.successTotal}>{formatPrice(order.total)} تومان</Text>
      <Pressable style={[styles.primaryButton, { alignSelf: 'stretch', marginTop: 24 }]} onPress={onTrack}>
        <Text style={styles.primaryButtonText}>پیگیری سفارش</Text>
      </Pressable>
      <Pressable style={[styles.secondaryButton, { alignSelf: 'stretch' }]} onPress={onDone}>
        <Text style={styles.secondaryButtonText}>بازگشت به منو</Text>
      </Pressable>
    </View>
  );
}

// ============ برنامه اصلی ============
export default function App() {
  const [screen, setScreen] = useState('home');
  const [cart, setCart] = useState({});
  const [favs, setFavs] = useState({});
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [checkout, setCheckout] = useState({ type: 'courier', pay: 'online', coupon: null });
  const [lastOrder, setLastOrder] = useState(null);

  const add = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const remove = (id) =>
    setCart((c) => {
      const next = { ...c };
      if (next[id] > 1) next[id] -= 1;
      else delete next[id];
      return next;
    });
  const toggleFav = (id) => setFavs((f) => ({ ...f, [id]: !f[id] }));

  const cartItems = FOODS.filter((f) => cart[f.id]);
  const cartCount = cartItems.reduce((s, f) => s + cart[f.id], 0);
  const subtotal = cartItems.reduce((s, f) => s + f.price * cart[f.id], 0);

  const discount = checkout.coupon ? Math.round(subtotal * COUPONS[checkout.coupon]) : 0;
  const fee = deliveryFee(subtotal, checkout.type);
  const totals = { discount, fee, total: subtotal - discount + fee };

  const placeOrder = () => {
    const now = new Date();
    const order = {
      id: Math.max(...orders.map((o) => o.id)) + 1,
      time: `امروز ${toFa(pad2(now.getHours()))}:${toFa(pad2(now.getMinutes()))}`,
      items: cartItems.map((f) => ({ id: f.id, qty: cart[f.id] })),
      status: 0,
      type: checkout.type,
      total: totals.total,
    };
    setOrders((o) => [order, ...o]);
    setLastOrder(order);
    setCart({});
    setCheckout({ ...checkout, coupon: null });
    setScreen('success');
  };

  const advance = (id) =>
    setOrders((o) => o.map((x) => (x.id === id && x.status < 2 ? { ...x, status: x.status + 1 } : x)));

  const reorder = (order) => {
    setCart((c) => {
      const next = { ...c };
      order.items.forEach((i) => (next[i.id] = (next[i.id] || 0) + i.qty));
      return next;
    });
    setScreen('cart');
  };

  let content;
  if (screen === 'cart') {
    content = (
      <CartScreen
        items={cartItems}
        cart={cart}
        subtotal={subtotal}
        totals={totals}
        checkout={checkout}
        setCheckout={setCheckout}
        onAdd={add}
        onRemove={remove}
        goHome={() => setScreen('home')}
        onOrder={placeOrder}
      />
    );
  } else if (screen === 'orders') {
    content = <OrdersScreen orders={orders} onReorder={reorder} />;
  } else if (screen === 'admin') {
    content = <AdminScreen orders={orders} onAdvance={advance} />;
  } else if (screen === 'success' && lastOrder) {
    content = (
      <SuccessScreen order={lastOrder} onTrack={() => setScreen('orders')} onDone={() => setScreen('home')} />
    );
  } else {
    content = (
      <HomeScreen
        cart={cart}
        favs={favs}
        add={add}
        remove={remove}
        toggleFav={toggleFav}
        goCart={() => setScreen('cart')}
        cartCount={cartCount}
        subtotal={subtotal}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {content}
      {screen !== 'success' && <TabBar screen={screen} setScreen={setScreen} cartCount={cartCount} />}
    </View>
  );
}

// ============ استایل‌ها ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 0) + 16,
  },
  list: { paddingHorizontal: 20 },

  // هدر صفحات
  header: { paddingHorizontal: 20, marginBottom: 16, gap: 2 },
  headerTitle: { ...rtl, fontSize: 28, fontWeight: '800', color: DARK },
  headerSub: { ...rtl, fontSize: 13, color: GRAY },

  // صفحه خانه
  topRow: { flexDirection: ROW, alignItems: 'center', gap: 12, marginBottom: 16 },
  hello: { ...rtl, fontSize: 14, color: GRAY },
  brand: { ...rtl, fontSize: 32, fontWeight: '800', color: DARK },
  location: { ...rtl, fontSize: 12, color: ORANGE, fontWeight: '700', marginTop: 2 },
  bell: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3 },

  search: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 18,
    elevation: 2,
  },
  searchInput: { flex: 1, ...rtl, fontSize: 14, color: DARK },

  banner: { flexDirection: ROW, alignItems: 'center', gap: 8, borderRadius: 24, padding: 20 },
  bannerSmall: { ...rtl, color: '#FFFFFFCC', fontSize: 13 },
  bannerTitle: { ...rtl, color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4, marginBottom: 14, lineHeight: 28 },
  bannerButton: { alignSelf: 'flex-end', backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12 },
  bannerButtonText: { fontWeight: '800' },
  bannerEmoji: { fontSize: 70 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E6DCD3' },
  dotActive: { width: 20, backgroundColor: ORANGE },

  trustRow: { flexDirection: ROW, gap: 10, marginBottom: 22 },
  trust: { flex: 1, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 12, alignItems: 'center', gap: 2, elevation: 1 },
  trustTitle: { fontSize: 12, fontWeight: '800', color: DARK, textAlign: 'center' },
  trustSub: { fontSize: 10, color: GRAY, textAlign: 'center' },

  sectionTitle: { ...rtl, fontSize: 18, fontWeight: '800', color: DARK, marginBottom: 12 },
  sectionTitleNoMargin: { ...rtl, fontSize: 18, fontWeight: '800', color: DARK },
  sectionHead: { flexDirection: ROW, justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  countText2: { fontSize: 12, color: GRAY },

  chips: { flexDirection: ROW, flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: '#fff', elevation: 1 },
  chipActive: { backgroundColor: DARK },
  chipText: { color: '#6B6672', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#fff' },

  sortRow: { flexDirection: ROW, flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F3ECE5' },
  sortChipActive: { backgroundColor: '#FFE3D3' },
  sortText: { fontSize: 12, color: '#6B6672', fontWeight: '600' },
  sortTextActive: { color: ORANGE, fontWeight: '800' },

  grid: { flexDirection: ROW, flexWrap: 'wrap', gap: 12 },
  pCard: { backgroundColor: '#fff', borderRadius: 22, padding: 10, gap: 4, elevation: 3 },
  pImage: { height: 110, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  pEmoji: { fontSize: 56 },
  badge: { position: 'absolute', top: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  heart: { position: 'absolute', top: 6, width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFFCC', alignItems: 'center', justifyContent: 'center' },
  heartText: { fontSize: 15 },
  pName: { ...rtl, fontSize: 15, fontWeight: '800', color: DARK },
  pDesc: { ...rtl, fontSize: 11, color: GRAY, lineHeight: 16, minHeight: 32 },
  metaRow: { flexDirection: ROW, justifyContent: 'space-between' },
  meta: { fontSize: 11, color: '#6B6672' },
  priceBox: { marginTop: 4, minHeight: 38, justifyContent: 'flex-end' },
  oldPrice: { ...rtl, fontSize: 12, color: '#B5AFB9', textDecorationLine: 'line-through' },
  pPrice: { ...rtl, fontSize: 16, fontWeight: '800', color: ORANGE },
  currency: { fontSize: 10, fontWeight: '600', color: GRAY },
  addWide: { backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  addWideText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  wideStepper: { alignItems: 'center', marginTop: 6, paddingVertical: 2 },

  stepper: { flexDirection: ROW, alignItems: 'center', gap: 12 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  stepBtnLight: { backgroundColor: '#FFE8DC' },
  stepBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: -2 },
  stepQty: { fontSize: 16, fontWeight: '800', color: DARK, minWidth: 20, textAlign: 'center' },

  floatBar: {
    position: 'absolute',
    bottom: 92,
    left: 20,
    right: 20,
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
    backgroundColor: DARK,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 10,
  },
  floatCount: { width: 30, height: 30, borderRadius: 15, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  floatCountText: { color: '#fff', fontWeight: '800' },
  floatText: { flex: 1, ...rtl, color: '#fff', fontSize: 15, fontWeight: '800' },
  floatPrice: { color: '#FFD7C2', fontSize: 13, fontWeight: '800' },

  noResult: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10, paddingBottom: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: DARK, textAlign: 'center' },
  emptyText: { fontSize: 14, color: GRAY, textAlign: 'center' },

  // تب‌بار
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: ROW,
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    elevation: 20,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabIconBox: { width: 48, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tabIconBoxActive: { backgroundColor: '#FFE8DC' },
  tabEmoji: { fontSize: 20 },
  tabLabel: { fontSize: 11, color: GRAY, fontWeight: '600' },
  tabLabelActive: { color: ORANGE, fontWeight: '800' },
  tabBadge: { position: 'absolute', top: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, ...PRIGHT },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // سبد خرید
  cartRow: { flexDirection: ROW, alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 12, elevation: 2 },
  cartImage: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cartName: { ...rtl, fontSize: 15, fontWeight: '800', color: DARK },
  cartUnit: { ...rtl, fontSize: 13, color: ORANGE, fontWeight: '800' },

  box: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 12, elevation: 1 },
  boxTitle: { ...rtl, fontSize: 15, fontWeight: '800', color: DARK },
  boxText: { ...rtl, fontSize: 13, color: DARK, fontWeight: '600', lineHeight: 20 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#F1E9E2', flexDirection: ROW, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: GREEN },

  segment: { flexDirection: ROW, gap: 10 },
  segItem: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F6F0EA', alignItems: 'center' },
  segItemActive: { backgroundColor: DARK },
  segText: { fontSize: 13, fontWeight: '700', color: '#6B6672' },
  segTextActive: { color: '#fff' },

  couponRow: { flexDirection: ROW, gap: 10 },
  couponInput: { flex: 1, ...rtl, backgroundColor: '#F6F0EA', borderRadius: 12, paddingHorizontal: 14, height: 46, color: DARK },
  couponBtn: { backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  couponBtnText: { color: '#fff', fontWeight: '800' },
  couponOk: { flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5F7EE', borderRadius: 12, padding: 12 },
  couponOkText: { ...rtl, color: GREEN, fontWeight: '800', fontSize: 13, flex: 1 },
  errText: { ...rtl, color: RED, fontSize: 12, fontWeight: '600' },

  summary: { backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 12, elevation: 3 },
  summaryRow: { flexDirection: ROW, justifyContent: 'space-between' },
  summaryLabel: { ...rtl, color: '#6B6672', fontSize: 14 },
  summaryValue: { ...rtl, color: DARK, fontSize: 14, fontWeight: '700' },
  summaryBold: { fontSize: 17, fontWeight: '800', color: DARK },
  divider: { height: 1, backgroundColor: '#EEE8E2' },

  primaryButton: { backgroundColor: ORANGE, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryButton: { borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: ORANGE, fontSize: 15, fontWeight: '800' },

  // سفارش‌ها
  orderCard: { backgroundColor: '#fff', borderRadius: 22, padding: 16, gap: 8, elevation: 2 },
  orderTop: { flexDirection: ROW, justifyContent: 'space-between', alignItems: 'center' },
  orderId: { ...rtl, fontSize: 15, fontWeight: '800', color: DARK },
  orderTime: { ...rtl, fontSize: 12, color: GRAY },
  orderItems: { ...rtl, fontSize: 13, color: '#4A4550', lineHeight: 20 },
  orderBottom: { flexDirection: ROW, justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  orderTotal: { ...rtl, fontSize: 16, fontWeight: '800', color: ORANGE },
  reorderBtn: { backgroundColor: '#FFE8DC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  reorderText: { color: ORANGE, fontWeight: '800', fontSize: 12 },
  pill: { alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '800' },

  // مدیریت
  kpiRow: { flexDirection: ROW, gap: 10 },
  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 12, alignItems: 'center', gap: 4, elevation: 2 },
  kpiValue: { fontSize: 16, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: GRAY, textAlign: 'center' },
  barRow: { flexDirection: ROW, alignItems: 'center', gap: 8 },
  barRank: { width: 18, fontSize: 13, fontWeight: '800', color: GRAY, textAlign: 'center' },
  barName: { width: 96, ...rtl, fontSize: 12, color: DARK, fontWeight: '600' },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#F1E9E2', flexDirection: ROW, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: ORANGE },
  barQty: { width: 24, fontSize: 12, fontWeight: '800', color: DARK, textAlign: 'center' },
  adminRow: { flexDirection: ROW, alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F1E9E2' },
  advanceBtn: { backgroundColor: DARK, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  advanceText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  note: { ...rtl, fontSize: 12, color: GRAY, lineHeight: 20 },

  // موفقیت
  successCircle: { width: 130, height: 130, borderRadius: 65, backgroundColor: '#DDF3DD', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', color: DARK, marginBottom: 10, textAlign: 'center' },
  successText: { fontSize: 15, color: '#6B6672', marginTop: 4, textAlign: 'center' },
  successTotal: { fontSize: 22, fontWeight: '800', color: ORANGE, marginTop: 14 },
});