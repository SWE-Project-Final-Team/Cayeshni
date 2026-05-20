"use client";

import { ListboxSelect } from "@/components/listbox-select";
import { LANGUAGE_OPTIONS, useI18n } from "@/lib/i18n";

export function LanguageSelect({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  const options = LANGUAGE_OPTIONS.map((opt) => {
    const label = t(opt.label);
    const description = opt.description && opt.description !== label ? opt.description : undefined;
    return {
      value: opt.value,
      label,
      description,
    };
  });

  return (
    <div className={className}>
      <ListboxSelect
        value={locale}
        onChange={(value) => setLocale(value as typeof locale)}
        options={options}
        leadingIcon="language"
        className="w-full"
        align="start"
      />
    </div>
  );
}
