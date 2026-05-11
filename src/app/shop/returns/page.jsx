export default function ReturnsPage() {
  return (
    <section dir="rtl" className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <div className="shop-section-card animate-fade-up rounded-3xl p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.22em] text-rose-500">TRENDWA</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 md:text-3xl">الإرجاع والاستبدال</h1>
        <div className="mt-4 space-y-4 text-sm leading-8 text-zinc-700 md:text-base">
          <p>نحرص في TrendWa على رضا العملاء وتقديم أفضل تجربة تسوق ممكنة.</p>
          <div>
            <p className="font-semibold text-zinc-800">يمكن طلب الإرجاع أو الاستبدال وفق الشروط التالية:</p>
            <ul className="mt-1 list-disc space-y-1 pr-5">
              <li>يمكن استبدال أو إرجاع المنتج خلال مدة محددة من تاريخ الاستلام.</li>
              <li>يجب أن يكون المنتج بحالته الأصلية وغير مستخدم.</li>
              <li>لا يمكن إرجاع المنتجات المتضررة بسبب سوء الاستخدام.</li>
              <li>يتحمل العميل تكاليف الشحن في حالات الاستبدال أو الإرجاع ما لم يكن الخطأ من المتجر.</li>
            </ul>
          </div>
          <p>
            في حال وجود مشكلة في الطلب أو المنتج يرجى التواصل مع خدمة العملاء وسيتم التعامل مع
            الطلب بأسرع وقت ممكن.
          </p>
        </div>
      </div>
    </section>
  );
}
