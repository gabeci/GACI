type ScreenPlaceholderProps = {
  title: string;
  description: string;
};

export function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="text-sm leading-relaxed text-gray-600">{description}</p>
    </section>
  );
}
