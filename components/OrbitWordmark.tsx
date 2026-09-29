export default function OrbitWordmark({ suffix }: { suffix?: string }) {
  return (
    <p className="text-sm font-semibold tracking-[0.18em] text-blue-700">
      ORBIT{suffix ? ` ${suffix}` : ''}
    </p>
  );
}
