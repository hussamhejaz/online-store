export default function PrivacyPage() {
  return (
    <section dir="rtl" className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <div className="shop-section-card animate-fade-up rounded-3xl p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.22em] text-rose-500">TRENDWA</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 md:text-3xl">سياسة الخصوصية</h1>
        <div className="mt-4 space-y-4 text-sm leading-8 text-zinc-700 md:text-base">
          <p>
            نحن في TrendWa نحترم خصوصية عملائنا ونلتزم بحماية جميع البيانات والمعلومات الشخصية
            التي يتم جمعها أثناء استخدام الموقع.
          </p>
          <div>
            <p className="font-semibold text-zinc-800">قد نقوم بجمع بعض المعلومات مثل:</p>
            <ul className="mt-1 list-disc space-y-1 pr-5">
              <li>الاسم</li>
              <li>رقم الهاتف</li>
              <li>البريد الإلكتروني</li>
              <li>عنوان الشحن</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-zinc-800">وذلك بهدف:</p>
            <ul className="mt-1 list-disc space-y-1 pr-5">
              <li>معالجة الطلبات</li>
              <li>تحسين تجربة المستخدم</li>
              <li>التواصل مع العملاء بخصوص الطلبات والعروض</li>
            </ul>
          </div>
          <p>
            نحن لا نقوم ببيع أو مشاركة بيانات العملاء مع أي طرف خارجي إلا عند الضرورة المتعلقة
            بتنفيذ الطلب أو وفق ما يتطلبه القانون.
          </p>
          <p>باستخدامك للموقع فإنك توافق على سياسة الخصوصية الخاصة بنا.</p>
        </div>
      </div>
    </section>
  );
}
