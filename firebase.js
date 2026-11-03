// اتصال به Firestore از طریق REST API (بدون نیاز به پکیج firebase)
const PROJECT_ID = 'loqme-aec3d';
const API_KEY = 'AIzaSyDtfUD-0SO9x8226uTPtEpld9U8RssPeIc';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// تبدیل داده جاوااسکریپت به فرمت Firestore
const toValue = (v) => {
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number')
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (v && typeof v === 'object') return { mapValue: { fields: toFields(v) } };
  return { nullValue: null };
};
const toFields = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]));

// تبدیل فرمت Firestore به داده جاوااسکریپت
const fromValue = (v) => {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
  if ('mapValue' in v) return fromFields(v.mapValue.fields || {});
  return null;
};
const fromFields = (f) =>
  Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fromValue(v)]));

const check = async (res) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore ${res.status}: ${text}`);
  }
  return res.json();
};

// افزودن یک سند جدید
export async function addDoc(collection, data) {
  const res = await fetch(`${BASE}/${collection}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  const doc = await check(res);
  return doc.name.split('/').pop();
}

// خواندن همه سندهای یک کالکشن
export async function listDocs(collection) {
  const res = await fetch(`${BASE}/${collection}?pageSize=300&key=${API_KEY}`);
  const json = await check(res);
  return (json.documents || []).map((d) => ({
    id: d.name.split('/').pop(),
    ...fromFields(d.fields || {}),
  }));
}

// تغییر چند فیلد از یک سند
export async function updateDoc(collection, id, data) {
  const mask = Object.keys(data)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&');
  const res = await fetch(`${BASE}/${collection}/${id}?${mask}&key=${API_KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  await check(res);
}