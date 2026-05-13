"use client";

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Locale = "en" | "ar" | "fr" | "de" | "es";

type Messages = Record<string, string>;

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const STORAGE_KEY = "cayeshni_locale";
const DEFAULT_LOCALE: Locale = "en";
const RTL_LOCALES = new Set<Locale>(["ar"]);

const MESSAGES: Record<Locale, Messages> = {
  en: {
    "Language": "Language",
    "English": "English",
    "Arabic": "Arabic",
    "French": "French",
    "German": "German",
    "Spanish": "Spanish",
    "Select…": "Select…",
    "No options": "No options",
    "Confirm": "Confirm",
    "Cancel": "Cancel",
    "Please wait…": "Please wait…",
    "Light mode": "Light mode",
    "Dark mode": "Dark mode",
    "Switch to light mode": "Switch to light mode",
    "Switch to dark mode": "Switch to dark mode",
    "Close menu": "Close menu",
    "Open menu": "Open menu",
    "Dismiss menu": "Dismiss menu",
    "Add expense": "Add expense",
    "Sign out": "Sign out",
    "Sign in": "Sign in",
    "Create account": "Create account",
    "Counting the coins…": "Counting the coins…",
    "Loading…": "Loading…",
    "Saving…": "Saving…",
    "Confirming…": "Confirming…",
    "A friend": "A friend",
    "Join {group} on Cayeshni": "Join {group} on Cayeshni",
    "{from} invited you to split expenses in {group} on Cayeshni.\n\nOpen this link to join (log in or sign up first):\n{joinUrl}\n\nOr in Cayeshni go to Groups → Join with invite code and paste:\n{inviteToken}\n": "{from} invited you to split expenses in {group} on Cayeshni.\n\nOpen this link to join (log in or sign up first):\n{joinUrl}\n\nOr in Cayeshni go to Groups → Join with invite code and paste:\n{inviteToken}\n",
    "Invite sent to {name}. They will see it under Groups.": "Invite sent to {name}. They will see it under Groups.",
    "Could not copy - select the invite code from the group.": "Could not copy - select the invite code from the group.",
    "{from} invited you to {group} on Cayeshni.\n\n{joinUrl}\n\nInvite code: {inviteToken}": "{from} invited you to {group} on Cayeshni.\n\n{joinUrl}\n\nInvite code: {inviteToken}",
    "Invite friend": "Invite friend",
    "Invite a friend": "Invite a friend",
    "Close": "Close",
    "— send an in-app invite to a Cayeshni friend, open email with the join link, or copy / share the link yourself.": "— send an in-app invite to a Cayeshni friend, open email with the join link, or copy / share the link yourself.",
    "Copied": "Copied",
    "Copy join link": "Copy join link",
    "Share…": "Share…",
    "Your Cayeshni friends": "Your Cayeshni friends",
    "Everyone here is already in this group, or add more friends first.": "Everyone here is already in this group, or add more friends first.",
    "You don't have friends on Cayeshni yet. Add friends first, or use copy / share above.": "You don't have friends on Cayeshni yet. Add friends first, or use copy / share above.",
    "Go to Friends": "Go to Friends",
    "Sending…": "Sending…",
    "In-app invite": "In-app invite",
    "You": "You",
    "Select an expense from the list to see the full breakdown and settlements.": "Select an expense from the list to see the full breakdown and settlements.",
    "Transaction details": "Transaction details",
    "Loading breakdown…": "Loading breakdown…",
    "Description": "Description",
    "Paid by": "Paid by",
    "Total": "Total",
    "Category": "Category",
    "When": "When",
    "Who owes what": "Who owes what",
    "Share": "Share",
    "Settled": "Settled",
    "Remaining": "Remaining",
    "Settlements touching this expense": "Settlements touching this expense",
    "this bill": "this bill",
    "Split flow": "Split flow",
    "Expense split from payer to members": "Expense split from payer to members",
    "Whole group": "Whole group",
    "Net balances from every expense and settlement. Arrows point to who is owed. Press Esc to clear focus.": "Net balances from every expense and settlement. Arrows point to who is owed. Press Esc to clear focus.",
    "Everyone settled up": "Everyone settled up",
    "{count} transfer": "{count} transfer",
    "{count} transfers": "{count} transfers",
    "Group balance flow between members": "Group balance flow between members",
    "{from} owes {to} {amount} {currency}": "{from} owes {to} {amount} {currency}",
    "Member {name}": "Member {name}",
    "Opening the ledger…": "Opening the ledger…",
    "Clarity in shared finances.": "Clarity in shared finances.",
    "Your email is not verified yet. Open the link we sent you to unlock your account, or request a new message below.": "Your email is not verified yet. Open the link we sent you to unlock your account, or request a new message below.",
    "Resend verification link": "Resend verification link",
    "If your account is unconfirmed, check your inbox.": "If your account is unconfirmed, check your inbox.",
    "How should we call you?": "How should we call you?",
    "Your password was updated.": "Your password was updated.",
    "Choose a new password for your account.": "Choose a new password for your account.",
    "Invalid or incomplete reset link. Please request a new one.": "Invalid or incomplete reset link. Please request a new one.",
    "Request a new reset link": "Request a new reset link",
    "Email": "Email",
    "Password": "Password",
    "Show password": "Show password",
    "Hide password": "Hide password",
    "Forgot?": "Forgot?",
    "Sign In": "Sign In",
    "Create Account": "Create Account",
    "Account": "Account",
    "Profile": "Profile",
    "Display name": "Display name",
    "Default currency": "Default currency",
    "Preferred currency": "Preferred currency",
    "Select currency": "Select currency",
    "Dashboard": "Dashboard",
    "Expenses": "Expenses",
    "Groups": "Groups",
    "Friends": "Friends",
    "Settlements": "Settlements",
    "Settings": "Settings",
    "Reset password": "Reset password",
    "Send reset link": "Send reset link",
    "Back to sign in": "Back to sign in",
    "New password": "New password",
    "Update password": "Update password",
    "Confirm email": "Confirm email",
    "Continue": "Continue",
    "Profile updated.": "Profile updated.",
    "Password updated.": "Password updated.",
    "Save profile": "Save profile",
    "Change password": "Change password",
    "Current password": "Current password",
    "Sign out everywhere on this device": "Sign out everywhere on this device",
    "Save changes": "Save changes",
    "Confirm your email to load balances and activity from the API.": "Confirm your email to load balances and activity from the API.",
  },
  ar: {
    "Language": "اللغة",
    "English": "الإنجليزية",
    "Arabic": "العربية",
    "French": "الفرنسية",
    "German": "الألمانية",
    "Spanish": "الإسبانية",
    "Select…": "اختر…",
    "No options": "لا توجد خيارات",
    "Confirm": "تأكيد",
    "Cancel": "إلغاء",
    "Please wait…": "يرجى الانتظار…",
    "Light mode": "الوضع الفاتح",
    "Dark mode": "الوضع الداكن",
    "Switch to light mode": "التبديل إلى الوضع الفاتح",
    "Switch to dark mode": "التبديل إلى الوضع الداكن",
    "Close menu": "إغلاق القائمة",
    "Open menu": "فتح القائمة",
    "Dismiss menu": "إغلاق القائمة",
    "Add expense": "إضافة مصروف",
    "Sign out": "تسجيل الخروج",
    "Sign in": "تسجيل الدخول",
    "Create account": "إنشاء حساب",
    "Counting the coins…": "جارٍ عدّ العملات…",
    "Loading…": "جارٍ التحميل…",
    "Saving…": "جارٍ الحفظ…",
    "Confirming…": "جارٍ التأكيد…",
    "A friend": "صديق",
    "Join {group} on Cayeshni": "انضم إلى {group} على Cayeshni",
    "You": "أنت",
    "Copied": "تم النسخ",
    "Dashboard": "لوحة التحكم",
    "Expenses": "المصروفات",
    "Groups": "المجموعات",
    "Friends": "الأصدقاء",
    "Settlements": "التسويات",
    "Settings": "الإعدادات",
    "Email": "البريد الإلكتروني",
    "Password": "كلمة المرور",
    "Sign In": "تسجيل الدخول",
    "Create Account": "إنشاء حساب",
  },
  fr: {
    "Language": "Langue",
    "English": "Anglais",
    "Arabic": "Arabe",
    "French": "Français",
    "German": "Allemand",
    "Spanish": "Espagnol",
    "Select…": "Sélectionner…",
    "No options": "Aucune option",
    "Confirm": "Confirmer",
    "Cancel": "Annuler",
    "You": "Vous",
    "Copied": "Copié",
    "Dashboard": "Tableau de bord",
    "Expenses": "Dépenses",
    "Groups": "Groupes",
    "Friends": "Amis",
    "Settlements": "Règlements",
    "Settings": "Paramètres",
    "Email": "E-mail",
    "Password": "Mot de passe",
    "Sign In": "Se connecter",
    "Create Account": "Créer un compte",
  },
  de: {
    "Language": "Sprache",
    "English": "Englisch",
    "Arabic": "Arabisch",
    "French": "Französisch",
    "German": "Deutsch",
    "Spanish": "Spanisch",
    "Select…": "Auswählen…",
    "No options": "Keine Optionen",
    "Confirm": "Bestätigen",
    "Cancel": "Abbrechen",
    "You": "Du",
    "Copied": "Kopiert",
    "Dashboard": "Dashboard",
    "Expenses": "Ausgaben",
    "Groups": "Gruppen",
    "Friends": "Freunde",
    "Settlements": "Abrechnungen",
    "Settings": "Einstellungen",
    "Email": "E-Mail",
    "Password": "Passwort",
    "Sign In": "Anmelden",
    "Create Account": "Konto erstellen",
  },
  es: {
    "Language": "Idioma",
    "English": "Inglés",
    "Arabic": "Árabe",
    "French": "Francés",
    "German": "Alemán",
    "Spanish": "Español",
    "Select…": "Seleccionar…",
    "No options": "Sin opciones",
    "Confirm": "Confirmar",
    "Cancel": "Cancelar",
    "You": "Tú",
    "Copied": "Copiado",
    "Dashboard": "Panel",
    "Expenses": "Gastos",
    "Groups": "Grupos",
    "Friends": "Amigos",
    "Settlements": "Liquidaciones",
    "Settings": "Configuración",
    "Email": "Correo electrónico",
    "Password": "Contraseña",
    "Sign In": "Iniciar sesión",
    "Create Account": "Crear cuenta",
  },
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function interpolate(message: string, vars?: Record<string, string | number>): string {
  if (!vars) return message;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    message
  );
}

function normalizeLocale(input: string | null): Locale | null {
  if (!input) return null;
  const lower = input.toLowerCase();
  if (lower.startsWith("ar")) return "ar";
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("de")) return "de";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("en")) return "en";
  return null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = normalizeLocale(localStorage.getItem(STORAGE_KEY));
    const preferred = stored ?? normalizeLocale(navigator.language) ?? DEFAULT_LOCALE;
    setLocaleState(preferred);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const msg = MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key;
      return interpolate(msg, vars);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: RTL_LOCALES.has(locale) ? "rtl" : "ltr",
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export const LANGUAGE_OPTIONS: { value: Locale; label: string; description: string }[] = [
  { value: "en", label: "English", description: "English" },
  { value: "ar", label: "Arabic", description: "العربية" },
  { value: "fr", label: "French", description: "Français" },
  { value: "de", label: "German", description: "Deutsch" },
  { value: "es", label: "Spanish", description: "Español" },
];
