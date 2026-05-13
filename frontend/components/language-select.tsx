"use client";

import { ListboxSelect } from "@/components/listbox-select";
import { LANGUAGE_OPTIONS, useI18n } from "@/lib/i18n";

export function LanguageSelect({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  const options = LANGUAGE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.label),
    description: opt.description,
  }));

  return (
    <div className={`space-y-xs ${className}`}>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {t("Language")}
      </p>
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
