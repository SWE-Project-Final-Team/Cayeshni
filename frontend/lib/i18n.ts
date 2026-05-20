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
    English: "English",
    Arabic: "Arabic",
    French: "French",
    German: "German",
    Spanish: "Spanish",
    "Select…": "Select…",
    "No options": "No options",
    Confirm: "Confirm",
    Cancel: "Cancel",
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
    "{from} invited you to split expenses in {group} on Cayeshni.\n\nOpen this link to join (log in or sign up first):\n{joinUrl}\n\nOr in Cayeshni go to Groups → Join with invite code and paste:\n{inviteToken}\n":
      "{from} invited you to split expenses in {group} on Cayeshni.\n\nOpen this link to join (log in or sign up first):\n{joinUrl}\n\nOr in Cayeshni go to Groups → Join with invite code and paste:\n{inviteToken}\n",
    "Invite sent to {name}. They will see it under Groups.":
      "Invite sent to {name}. They will see it under Groups.",
    "Could not copy - select the invite code from the group.":
      "Could not copy - select the invite code from the group.",
    "{from} invited you to {group} on Cayeshni.\n\n{joinUrl}\n\nInvite code: {inviteToken}":
      "{from} invited you to {group} on Cayeshni.\n\n{joinUrl}\n\nInvite code: {inviteToken}",
    "Invite friend": "Invite friend",
    "Invite a friend": "Invite a friend",
    "All groups": "All groups",
    "Confirm your email to view group details.":
      "Confirm your email to view group details.",
    "Pick an expense, inspect the split map, or open the whole-group balance view to see who should pay whom after every transaction and settlement.":
      "Pick an expense, inspect the split map, or open the whole-group balance view to see who should pay whom after every transaction and settlement.",
    "Group not found": "Group not found",
    "Overview & members": "Overview & members",
    "Invite people, track shares and settlements, and jump to the group balance map from a member card.":
      "Invite people, track shares and settlements, and jump to the group balance map from a member card.",
    member: "member",
    members: "members",
    expense: "expense",
    expenses: "expenses",
    settlement: "settlement",
    settlements: "settlements",
    "Created by": "Created by",
    "Invite code": "Invite code",
    Members: "Members",
    "No members listed.": "No members listed.",
    Creator: "Creator",
    "Joined {date}": "Joined {date}",
    "Net in group:": "Net in group:",
    Even: "Even",
    "owed to them": "owed to them",
    "they owe": "they owe",
    Left: "Left",
    "No expense splits recorded yet.": "No expense splits recorded yet.",
    "Accepting…": "Accepting…",
    "Accept request": "Accept request",
    "Request sent": "Request sent",
    "Add friend": "Add friend",
    "Expense hub": "Expense hub",
    "Group transactions hub": "Group transactions hub",
    "Member balances and transfer map": "Member balances and transfer map",
    "Filtered by {name}": "Filtered by {name}",
    "List · split map · receipt details": "List · split map · receipt details",
    "Use {label} to show the expense list and breakdown again.":
      "Use {label} to show the expense list and breakdown again.",
    "This expense": "This expense",
    "Whole group": "Whole group",
    "All expenses": "All expenses",
    "Clear person filter": "Clear person filter",
    "{shown} of {total} shown": "{shown} of {total} shown",
    "{count} item": "{count} item",
    "{count} items": "{count} items",
    "newest first": "newest first",
    "No expenses include this person as payer or participant.":
      "No expenses include this person as payer or participant.",
    "Clear filter": "Clear filter",
    "Transaction list": "Transaction list",
    "Center view": "Center view",
    "Net after all expenses and settlements (positive = owed to them).":
      "Net after all expenses and settlements (positive = owed to them).",
    "Settlements in this group": "Settlements in this group",
    "Payments already recorded between members, newest first.":
      "Payments already recorded between members, newest first.",
    "No settlements recorded yet.": "No settlements recorded yet.",
    "Select an expense for the per-receipt split map, or switch to {label}.":
      "Select an expense for the per-receipt split map, or switch to {label}.",
    "Select an expense from the list to see the full breakdown and settlements.":
      "Select an expense from the list to see the full breakdown and settlements.",
    Close: "Close",
    "— send an in-app invite to a Cayeshni friend, open email with the join link, or copy / share the link yourself.":
      "— send an in-app invite to a Cayeshni friend, open email with the join link, or copy / share the link yourself.",
    Copied: "Copied",
    "Copy join link": "Copy join link",
    "Share…": "Share…",
    "Your Cayeshni friends": "Your Cayeshni friends",
    "Everyone here is already in this group, or add more friends first.":
      "Everyone here is already in this group, or add more friends first.",
    "You don't have friends on Cayeshni yet. Add friends first, or use copy / share above.":
      "You don't have friends on Cayeshni yet. Add friends first, or use copy / share above.",
    "Go to Friends": "Go to Friends",
    "Sending…": "Sending…",
    "In-app invite": "In-app invite",
    You: "You",
    "Transaction details": "Transaction details",
    "Loading breakdown…": "Loading breakdown…",
    Description: "Description",
    "Paid by": "Paid by",
    Total: "Total",
    Category: "Category",
    When: "When",
    "Who owes what": "Who owes what",
    Share: "Share",
    Settled: "Settled",
    Remaining: "Remaining",
    "Settlements touching this expense": "Settlements touching this expense",
    "this bill": "this bill",
    "Split flow": "Split flow",
    "Expense split from payer to members":
      "Expense split from payer to members",
    "Net balances from every expense and settlement. Arrows point to who is owed. Press Esc to clear focus.":
      "Net balances from every expense and settlement. Arrows point to who is owed. Press Esc to clear focus.",
    "Everyone settled up": "Everyone settled up",
    "{count} transfer": "{count} transfer",
    "{count} transfers": "{count} transfers",
    "Group balance flow between members": "Group balance flow between members",
    "{from} owes {to} {amount} {currency}":
      "{from} owes {to} {amount} {currency}",
    "Member {name}": "Member {name}",
    "Opening the ledger…": "Opening the ledger…",
    "Clarity in shared finances.": "Clarity in shared finances.",
    "Your email is not verified yet. Open the link we sent you to unlock your account, or request a new message below.":
      "Your email is not verified yet. Open the link we sent you to unlock your account, or request a new message below.",
    "Resend verification link": "Resend verification link",
    "If your account is unconfirmed, check your inbox.":
      "If your account is unconfirmed, check your inbox.",
    "How should we call you?": "How should we call you?",
    "Your password was updated.": "Your password was updated.",
    "Choose a new password for your account.":
      "Choose a new password for your account.",
    "Invalid or incomplete reset link. Please request a new one.":
      "Invalid or incomplete reset link. Please request a new one.",
    "Request a new reset link": "Request a new reset link",
    Email: "Email",
    Password: "Password",
    "Show password": "Show password",
    "Hide password": "Hide password",
    "Forgot?": "Forgot?",
    "Sign In": "Sign In",
    "Create Account": "Create Account",
    Account: "Account",
    Profile: "Profile",
    "Display name": "Display name",
    "Default currency": "Default currency",
    "Preferred currency": "Preferred currency",
    "Select currency": "Select currency",
    Dashboard: "Dashboard",
    Expenses: "Expenses",
    Groups: "Groups",
    Friends: "Friends",
    Settlements: "Settlements",
    Settings: "Settings",
    "Reset password": "Reset password",
    "Send reset link": "Send reset link",
    "Back to sign in": "Back to sign in",
    "New password": "New password",
    "Update password": "Update password",
    "Confirm email": "Confirm email",
    Continue: "Continue",
    "Almost there…": "Almost there…",
    "Thanks — your email is confirmed.": "Thanks — your email is confirmed.",
    "We&apos;re confirming your email now. If needed, you can retry below.":
      "We&apos;re confirming your email now. If needed, you can retry below.",
    "This link is missing required information. Request a new confirmation email from the app banner.":
      "This link is missing required information. Request a new confirmation email from the app banner.",
    "Enter your email and we&apos;ll send a link when the account exists.":
      "Enter your email and we&apos;ll send a link when the account exists.",
    "If that email exists, a reset link has been sent.":
      "If that email exists, a reset link has been sent.",
    "Profile updated.": "Profile updated.",
    "Password updated.": "Password updated.",
    "Save profile": "Save profile",
    "Change password": "Change password",
    "Current password": "Current password",
    "Sign out everywhere on this device": "Sign out everywhere on this device",
    "Save changes": "Save changes",
    "Confirm your email to load balances and activity from the API.":
      "Confirm your email to load balances and activity from the API.",
    "Securing your session and balances…":
      "Securing your session and balances…",
    "Update your display name and currency, and change your password.":
      "Update your display name and currency, and change your password.",
    Someone: "Someone",
    paid: "paid",
    View: "View",
    "Balances per group and your latest expense activity.":
      "Balances per group and your latest expense activity.",
    "Active groups": "Active groups",
    "Manage groups": "Manage groups",
    "You are owed": "You are owed",
    "Totals by currency across groups": "Totals by currency across groups",
    "You owe": "You owe",
    "Settle up": "Settle up",
    "Per-group balances": "Per-group balances",
    "Join a group to see how much you owe and are owed.":
      "Join a group to see how much you owe and are owed.",
    Group: "Group",
    "Recent activity": "Recent activity",
    "Expenses and settlements, newest first":
      "Expenses and settlements, newest first",
    "All activity": "All activity",
    "No transactions or settlements yet in your groups.":
      "No transactions or settlements yet in your groups.",
    Expense: "Expense",
    Settlement: "Settlement",
    "Loading expenses…": "Loading expenses…",
    Transport: "Transport",
    Food: "Food",
    Accommodation: "Accommodation",
    Entertainment: "Entertainment",
    Utilities: "Utilities",
    Shopping: "Shopping",
    Other: "Other",
    "Category {id}": "Category {id}",
    you: "you",
    Member: "Member",
    "Enter an amount greater than zero.": "Enter an amount greater than zero.",
    "This group has no members to split with yet.":
      "This group has no members to split with yet.",
    "Splits must add up to {total} {currency}. Current: {current}.":
      "Splits must add up to {total} {currency}. Current: {current}.",
    "Confirm your email to load expenses from the API.":
      "Confirm your email to load expenses from the API.",
    "Add transactions for a group. Amounts use the group&apos;s default currency ({currency}). You are recorded as the person who paid.":
      "Add transactions for a group. Amounts use the group&apos;s default currency ({currency}). You are recorded as the person who paid.",
    "Choose a group": "Choose a group",
    "No groups yet — create one under Groups":
      "No groups yet — create one under Groups",
    Transactions: "Transactions",
    "No transactions in this group yet.": "No transactions in this group yet.",
    "Select a group to add an expense.": "Select a group to add an expense.",
    Currency: "Currency",
    "(must match the group — set when the group was created)":
      "(must match the group — set when the group was created)",
    "Amount ({currency})": "Amount ({currency})",
    "0.00": "0.00",
    "Description (optional)": "Description (optional)",
    "Dinner, rent, taxi…": "Dinner, rent, taxi…",
    "Pick a category": "Pick a category",
    "Split between members": "Split between members",
    "Equal split ({count} member)": "Equal split ({count} member)",
    "Custom amounts": "Custom amounts",
    "Add transaction": "Add transaction",
    "Default currency · {currency}": "Default currency · {currency}",
    "Confirm your email to create and list groups.":
      "Confirm your email to create and list groups.",
    "Shareable groups with invite tokens — matches the settlements and expense flows in the design reference.":
      "Shareable groups with invite tokens — matches the settlements and expense flows in the design reference.",
    "You opened an invite link — the code is filled in below. Tap":
      "You opened an invite link — the code is filled in below. Tap",
    "Join group": "Join group",
    "when you&apos;re ready.": "when you&apos;re ready.",
    "Loading invitations…": "Loading invitations…",
    "Pending group invitations": "Pending group invitations",
    "Group invitations": "Group invitations",
    "From {name}": "From {name}",
    Dismiss: "Dismiss",
    "New group name": "New group name",
    "Ski trip 2024": "Ski trip 2024",
    "Create group": "Create group",
    "Join with invite code": "Join with invite code",
    "Paste the invite code (or open a shared link). Group UUID is not used here — only the invite token from the owner.":
      "Paste the invite code (or open a shared link). Group UUID is not used here — only the invite token from the owner.",
    "Invite code from share link or group owner":
      "Invite code from share link or group owner",
    "Joining…": "Joining…",
    "Your groups": "Your groups",
    "No groups yet — create one above.": "No groups yet — create one above.",
    Invite: "Invite",
    "Open group": "Open group",
    "Share invite": "Share invite",
    'You\'re invited to join "{group}" on Cayeshni.\n\nOpen: {url}\n\nOr enter this invite code: {inviteToken}':
      'You\'re invited to join "{group}" on Cayeshni.\n\nOpen: {url}\n\nOr enter this invite code: {inviteToken}',
    'Join link copied for "{group}".': 'Join link copied for "{group}".',
    'Invite code copied for "{group}".': 'Invite code copied for "{group}".',
    "Could not copy automatically — copy the invite code from the list.":
      "Could not copy automatically — copy the invite code from the list.",
    "Loading friends…": "Loading friends…",
    "Could not copy to clipboard.": "Could not copy to clipboard.",
    "You cannot send a friend request to yourself.":
      "You cannot send a friend request to yourself.",
    "Friend request sent.": "Friend request sent.",
    "Enter a valid email address for your friend’s Cayeshni account.":
      "Enter a valid email address for your friend’s Cayeshni account.",
    "Search for someone by name and pick their profile, or use email.":
      "Search for someone by name and pick their profile, or use email.",
    "You are now friends.": "You are now friends.",
    "Friend removed.": "Friend removed.",
    "Confirm your email to use friends.": "Confirm your email to use friends.",
    "Search by display name, pick the right person from the list, or send by email. Accept incoming requests below.":
      "Search by display name, pick the right person from the list, or send by email. Accept incoming requests below.",
    "Your email": "Your email",
    "Others can send you a request with this address.":
      "Others can send you a request with this address.",
    Copy: "Copy",
    "Send a friend request": "Send a friend request",
    "Search by display name": "Search by display name",
    Change: "Change",
    "Send request": "Send request",
    "Type at least 2 characters…": "Type at least 2 characters…",
    "Searching…": "Searching…",
    "No matching profiles.": "No matching profiles.",
    "I have their email instead": "I have their email instead",
    "Their email": "Their email",
    "friend@example.com": "friend@example.com",
    "Search by name instead": "Search by name instead",
    "Incoming requests": "Incoming requests",
    "No pending requests.": "No pending requests.",
    Accept: "Accept",
    "Your friends ({count})": "Your friends ({count})",
    "No friends yet. Send a request or accept one above.":
      "No friends yet. Send a request or accept one above.",
    Remove: "Remove",
    "Remove {name} from your friends list?":
      "Remove {name} from your friends list?",
    "Choose another member as payee.": "Choose another member as payee.",
    "Enter a positive amount.": "Enter a positive amount.",
    "Amount cannot exceed what you still owe this member on shared expenses ({amount} {currency}).":
      "Amount cannot exceed what you still owe this member on shared expenses ({amount} {currency}).",
    "No matching expenses to apply this payment to. Pick a payee you owe through a shared expense they paid for.":
      "No matching expenses to apply this payment to. Pick a payee you owe through a shared expense they paid for.",
    "Confirm your email to load settlements.":
      "Confirm your email to load settlements.",
    "Loading your account…": "Loading your account…",
    "Record cash or external transfers against shared expenses. Allocations apply to the oldest matching expenses first.":
      "Record cash or external transfers against shared expenses. Allocations apply to the oldest matching expenses first.",
    "Join or create a group to use settlements.":
      "Join or create a group to use settlements.",
    Balances: "Balances",
    "No members or debt data.": "No members or debt data.",
    "Remaining owed": "Remaining owed",
    "Record payment": "Record payment",
    "You record a payment from you to someone you owe through expenses they paid for in this group.":
      "You record a payment from you to someone you owe through expenses they paid for in this group.",
    "Loading group…": "Loading group…",
    "Pay to": "Pay to",
    "Loading payees…": "Loading payees…",
    "No one you owe in this group": "No one you owe in this group",
    "Select member…": "Select member…",
    "No one you currently owe through shared expenses":
      "No one you currently owe through shared expenses",
    "Use max ({amount})": "Use max ({amount})",
    "Loading expense breakdown…": "Loading expense breakdown…",
    "Max toward {name}": "Max toward {name}",
    "Note (optional)": "Note (optional)",
    "e.g. Venmo, cash": "e.g. Venmo, cash",
    "Will apply to {count} expense(s)": "Will apply to {count} expense(s)",
    "{count} expense allocation": "{count} expense allocation",
    "{count} expense allocations": "{count} expense allocations",
    "Record settlement": "Record settlement",
    "Settlement history": "Settlement history",
    "No settlements recorded for this group.":
      "No settlements recorded for this group.",
    "Save note": "Save note",
    "Edit note": "Edit note",
    Delete: "Delete",
    "Remove this settlement?": "Remove this settlement?",
    "Balances on the linked expenses will update to reflect that this payment no longer happened.":
      "Balances on the linked expenses will update to reflect that this payment no longer happened.",
    "Remove settlement": "Remove settlement",
    "Keep it": "Keep it",
    "Confirm your email to view and edit your profile. After you use the link in your inbox, refresh this page.":
      "Confirm your email to view and edit your profile. After you use the link in your inbox, refresh this page.",
    "Manage your photo, display name, and default currency.":
      "Manage your photo, display name, and default currency.",
    "Password &amp; security →": "Password &amp; security →",
    "Member since": "Member since",
    "Change photo": "Change photo",
    "Remove photo": "Remove photo",
    "Edit details": "Edit details",
    "Photo updated.": "Photo updated.",
    "Photo removed.": "Photo removed.",
    "This route has no budget line": "This route has no budget line",
    "The server checked under the couch cushions. Still nothing.":
      "The server checked under the couch cushions. Still nothing.",
    "Meme: Drake format about 404 pages": "Meme: Drake format about 404 pages",
    "Admitting you typed the URL wrong": "Admitting you typed the URL wrong",
    "Blaming inflation for a missing page (same energy)":
      "Blaming inflation for a missing page (same energy)",
    "Not routes 📉": "Not routes 📉",
    '"We underwrote this URL. The risk model said no."':
      '"We underwrote this URL. The risk model said no."',
    "- your browser's CFO (probably)": "- your browser's CFO (probably)",
    Home: "Home",
  },
  ar: {
    English: "الإنجليزية",
    Arabic: "العربية",
    French: "الفرنسية",
    German: "الألمانية",
    Spanish: "الإسبانية",
    "Select…": "اختر…",
    "No options": "لا توجد خيارات",
    Confirm: "تأكيد",
    Cancel: "إلغاء",
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
    You: "أنت",
    "Select an expense from the list to see the full breakdown and settlements.":
      "اختر مصروفًا من القائمة لرؤية التفاصيل الكاملة والتسويات.",
    Copied: "تم النسخ",
    Dashboard: "لوحة التحكم",
    Expenses: "المصروفات",
    Groups: "المجموعات",
    Friends: "الأصدقاء",
    Settlements: "التسويات",
    Settings: "الإعدادات",
    Email: "البريد الإلكتروني",
    Password: "كلمة المرور",
    "Sign In": "تسجيل الدخول",
    "Create Account": "إنشاء حساب",
    "Reset password": "إعادة تعيين كلمة المرور",
    "Send reset link": "إرسال رابط إعادة التعيين",
    "Back to sign in": "العودة لتسجيل الدخول",
    "Confirm email": "تأكيد البريد الإلكتروني",
    Continue: "متابعة",
    "Almost there…": "اقتربنا…",
    "Thanks — your email is confirmed.": "شكرًا — تم تأكيد بريدك الإلكتروني.",
    "We&apos;re confirming your email now. If needed, you can retry below.":
      "نؤكد بريدك الإلكتروني الآن. عند الحاجة، يمكنك إعادة المحاولة أدناه.",
    "This link is missing required information. Request a new confirmation email from the app banner.":
      "ينقص هذا الرابط معلومات مطلوبة. اطلب رسالة تأكيد جديدة من شريط التطبيق.",
    "Enter your email and we&apos;ll send a link when the account exists.":
      "أدخل بريدك الإلكتروني وسنرسل رابطًا إذا كان الحساب موجودًا.",
    "If that email exists, a reset link has been sent.":
      "إذا كان هذا البريد الإلكتروني موجودًا، فقد أُرسل رابط إعادة التعيين.",
    "Securing your session and balances…": "جارٍ تأمين جلستك وأرصدتك…",
    "Update your display name and currency, and change your password.":
      "حدّث اسم العرض والعملة، وغيّر كلمة المرور.",
    Someone: "شخص ما",
    paid: "دفع",
    View: "عرض",
    "Balances per group and your latest expense activity.":
      "الأرصدة لكل مجموعة وآخر نشاط مصروفاتك.",
    "Active groups": "المجموعات النشطة",
    "Manage groups": "إدارة المجموعات",
    "You are owed": "لك مستحقات",
    "Totals by currency across groups": "الإجماليات حسب العملة عبر المجموعات",
    "You owe": "عليك",
    "Settle up": "سوِّ الحساب",
    "Per-group balances": "أرصدة حسب المجموعة",
    "Join a group to see how much you owe and are owed.":
      "انضم إلى مجموعة لرؤية ما عليك وما لك.",
    Group: "مجموعة",
    "Recent activity": "النشاط الأخير",
    "Expenses and settlements, newest first":
      "المصروفات والتسويات، الأحدث أولاً",
    "All activity": "كل النشاط",
    "No transactions or settlements yet in your groups.":
      "لا توجد معاملات أو تسويات بعد في مجموعاتك.",
    Expense: "مصروف",
    Settlement: "تسوية",
    "Loading expenses…": "جارٍ تحميل المصروفات…",
    Transport: "النقل",
    Food: "الطعام",
    Accommodation: "الإقامة",
    Entertainment: "الترفيه",
    Utilities: "المرافق",
    Shopping: "التسوق",
    Other: "أخرى",
    "Category {id}": "فئة {id}",
    you: "أنت",
    Member: "عضو",
    "Enter an amount greater than zero.": "أدخل مبلغًا أكبر من صفر.",
    "This group has no members to split with yet.":
      "لا يوجد أعضاء بعد لتقسيم المصروف معهم.",
    "Splits must add up to {total} {currency}. Current: {current}.":
      "يجب أن يساوي التقسيم {total} {currency}. الحالي: {current}.",
    "Confirm your email to load expenses from the API.":
      "أكد بريدك الإلكتروني لتحميل المصروفات من الواجهة البرمجية.",
    "Add transactions for a group. Amounts use the group&apos;s default currency ({currency}). You are recorded as the person who paid.":
      "أضف معاملات لمجموعة. المبالغ تستخدم عملة المجموعة الافتراضية ({currency}). سيتم تسجيلك كالدافع.",
    "Choose a group": "اختر مجموعة",
    "No groups yet — create one under Groups":
      "لا توجد مجموعات بعد — أنشئ واحدة ضمن المجموعات",
    Transactions: "المعاملات",
    "No transactions in this group yet.":
      "لا توجد معاملات في هذه المجموعة بعد.",
    "Select a group to add an expense.": "اختر مجموعة لإضافة مصروف.",
    Currency: "العملة",
    "(must match the group — set when the group was created)":
      "(يجب أن تطابق المجموعة — تم تعيينها عند إنشاء المجموعة)",
    "Amount ({currency})": "المبلغ ({currency})",
    "0.00": "0.00",
    "Description (optional)": "الوصف (اختياري)",
    "Dinner, rent, taxi…": "عشاء، إيجار، تاكسي…",
    "Pick a category": "اختر فئة",
    "Split between members": "قسّم بين الأعضاء",
    "Equal split ({count} member)": "تقسيم متساوٍ ({count} عضو)",
    "Custom amounts": "مبالغ مخصصة",
    "Add transaction": "إضافة معاملة",
    "Default currency · {currency}": "العملة الافتراضية · {currency}",
    "Confirm your email to create and list groups.":
      "أكد بريدك الإلكتروني لإنشاء المجموعات وعرضها.",
    "Shareable groups with invite tokens — matches the settlements and expense flows in the design reference.":
      "مجموعات قابلة للمشاركة مع رموز دعوة — تطابق تدفقات التسويات والمصروفات في المرجع التصميمي.",
    "You opened an invite link — the code is filled in below. Tap":
      "فتحت رابط دعوة — تم تعبئة الرمز أدناه. اضغط",
    "Join group": "انضم للمجموعة",
    "when you&apos;re ready.": "عندما تكون جاهزًا.",
    "Loading invitations…": "جارٍ تحميل الدعوات…",
    "Pending group invitations": "دعوات مجموعات معلقة",
    "Group invitations": "دعوات المجموعات",
    "From {name}": "من {name}",
    Dismiss: "تجاهل",
    "New group name": "اسم مجموعة جديد",
    "Ski trip 2024": "رحلة تزلج 2024",
    "Create group": "إنشاء مجموعة",
    "Join with invite code": "الانضمام برمز دعوة",
    "Paste the invite code (or open a shared link). Group UUID is not used here — only the invite token from the owner.":
      "الصق رمز الدعوة (أو افتح رابطًا مشتركًا). معرّف المجموعة UUID غير مستخدم هنا — فقط رمز الدعوة من المالك.",
    "Invite code from share link or group owner":
      "رمز الدعوة من رابط المشاركة أو مالك المجموعة",
    "Joining…": "جارٍ الانضمام…",
    "Your groups": "مجموعاتك",
    "No groups yet — create one above.":
      "لا توجد مجموعات بعد — أنشئ واحدة أعلاه.",
    Invite: "دعوة",
    "Open group": "فتح المجموعة",
    "Share invite": "مشاركة الدعوة",
    'You\'re invited to join "{group}" on Cayeshni.\n\nOpen: {url}\n\nOr enter this invite code: {inviteToken}':
      'أنت مدعو للانضمام إلى "{group}" على Cayeshni.\n\nافتح: {url}\n\nأو أدخل رمز الدعوة هذا: {inviteToken}',
    'Join link copied for "{group}".': 'تم نسخ رابط الانضمام لـ "{group}".',
    'Invite code copied for "{group}".': 'تم نسخ رمز الدعوة لـ "{group}".',
    "Could not copy automatically — copy the invite code from the list.":
      "تعذر النسخ تلقائيًا — انسخ رمز الدعوة من القائمة.",
    "Loading friends…": "جارٍ تحميل الأصدقاء…",
    "Could not copy to clipboard.": "تعذر النسخ إلى الحافظة.",
    "You cannot send a friend request to yourself.":
      "لا يمكنك إرسال طلب صداقة لنفسك.",
    "Friend request sent.": "تم إرسال طلب الصداقة.",
    "Enter a valid email address for your friend’s Cayeshni account.":
      "أدخل بريدًا إلكترونيًا صالحًا لحساب صديقك في Cayeshni.",
    "Search for someone by name and pick their profile, or use email.":
      "ابحث عن شخص بالاسم واختر ملفه الشخصي، أو استخدم البريد الإلكتروني.",
    "You are now friends.": "أصبحتم أصدقاء الآن.",
    "Friend removed.": "تمت إزالة الصديق.",
    "Confirm your email to use friends.":
      "أكد بريدك الإلكتروني لاستخدام الأصدقاء.",
    "Search by display name, pick the right person from the list, or send by email. Accept incoming requests below.":
      "ابحث باسم العرض، اختر الشخص المناسب من القائمة، أو أرسل بالبريد الإلكتروني. اقبل الطلبات الواردة أدناه.",
    "Your email": "بريدك الإلكتروني",
    "Others can send you a request with this address.":
      "يمكن للآخرين إرسال طلب إليك باستخدام هذا العنوان.",
    Copy: "نسخ",
    "Send a friend request": "إرسال طلب صداقة",
    "Search by display name": "ابحث باسم العرض",
    Change: "تغيير",
    "Send request": "إرسال الطلب",
    "Type at least 2 characters…": "اكتب حرفين على الأقل…",
    "Searching…": "جارٍ البحث…",
    "No matching profiles.": "لا توجد ملفات مطابقة.",
    "I have their email instead": "لدي بريدهم الإلكتروني بدلاً من ذلك",
    "Their email": "بريدهم الإلكتروني",
    "friend@example.com": "friend@example.com",
    "Search by name instead": "ابحث بالاسم بدلاً من ذلك",
    "Incoming requests": "الطلبات الواردة",
    "No pending requests.": "لا توجد طلبات معلقة.",
    Accept: "قبول",
    "Your friends ({count})": "أصدقاؤك ({count})",
    "No friends yet. Send a request or accept one above.":
      "لا أصدقاء بعد. أرسل طلبًا أو اقبل طلبًا أعلاه.",
    Remove: "إزالة",
    "Remove {name} from your friends list?":
      "هل تريد إزالة {name} من قائمة أصدقائك؟",
    "Choose another member as payee.": "اختر عضوًا آخر كمتسلّم.",
    "Enter a positive amount.": "أدخل مبلغًا موجبًا.",
    "Amount cannot exceed what you still owe this member on shared expenses ({amount} {currency}).":
      "لا يمكن أن يتجاوز المبلغ ما عليك لهذا العضو في المصروفات المشتركة ({amount} {currency}).",
    "No matching expenses to apply this payment to. Pick a payee you owe through a shared expense they paid for.":
      "لا توجد مصروفات مطابقة لتطبيق هذا الدفع عليها. اختر متسلّمًا تدين له عبر مصروف مشترك دفعه.",
    "Confirm your email to load settlements.":
      "أكد بريدك الإلكتروني لتحميل التسويات.",
    "Loading your account…": "جارٍ تحميل حسابك…",
    "Record cash or external transfers against shared expenses. Allocations apply to the oldest matching expenses first.":
      "سجّل الدفع النقدي أو التحويلات الخارجية مقابل المصروفات المشتركة. تُطبّق التخصيصات على أقدم المصروفات المطابقة أولاً.",
    "Join or create a group to use settlements.":
      "انضم إلى مجموعة أو أنشئ واحدة لاستخدام التسويات.",
    Balances: "الأرصدة",
    "No members or debt data.": "لا يوجد أعضاء أو بيانات ديون.",
    "Remaining owed": "المتبقي المستحق",
    "Record payment": "تسجيل دفع",
    "You record a payment from you to someone you owe through expenses they paid for in this group.":
      "تسجل دفعة منك إلى شخص تدين له عبر مصروفات دفعها في هذه المجموعة.",
    "Loading group…": "جارٍ تحميل المجموعة…",
    "Pay to": "ادفع إلى",
    "Loading payees…": "جارٍ تحميل المستلمين…",
    "No one you owe in this group": "لا يوجد من تدين له في هذه المجموعة",
    "Select member…": "اختر عضوًا…",
    "No one you currently owe through shared expenses":
      "لا يوجد من تدين له حاليًا عبر المصروفات المشتركة",
    "Use max ({amount})": "استخدم الحد الأقصى ({amount})",
    "Loading expense breakdown…": "جارٍ تحميل تفصيل المصروف…",
    "Max toward {name}": "الحد الأقصى تجاه {name}",
    "Note (optional)": "ملاحظة (اختياري)",
    "e.g. Venmo, cash": "مثل: فينمو، نقدًا",
    "Will apply to {count} expense(s)": "سيُطبّق على {count} مصروف(ات)",
    "{count} expense allocation": "تخصيص مصروف واحد ({count})",
    "{count} expense allocations": "{count} تخصيصات مصروف",
    "Record settlement": "تسجيل تسوية",
    "Settlement history": "سجل التسويات",
    "No settlements recorded for this group.":
      "لا توجد تسويات مسجلة لهذه المجموعة.",
    "Save note": "حفظ الملاحظة",
    "Edit note": "تعديل الملاحظة",
    Delete: "حذف",
    "Remove this settlement?": "إزالة هذه التسوية؟",
    "Balances on the linked expenses will update to reflect that this payment no longer happened.":
      "سيتم تحديث الأرصدة على المصروفات المرتبطة لتعكس أن هذا الدفع لم يعد قائمًا.",
    "Remove settlement": "إزالة التسوية",
    "Keep it": "الإبقاء عليها",
    "Confirm your email to view and edit your profile. After you use the link in your inbox, refresh this page.":
      "أكد بريدك الإلكتروني لعرض وتعديل ملفك الشخصي. بعد استخدام الرابط في بريدك، حدّث الصفحة.",
    "Manage your photo, display name, and default currency.":
      "أدر صورتك واسم العرض والعملة الافتراضية.",
    "Password &amp; security →": "كلمة المرور والأمان →",
    "Member since": "عضو منذ",
    "Change photo": "تغيير الصورة",
    "Remove photo": "إزالة الصورة",
    "Edit details": "تعديل التفاصيل",
    "Photo updated.": "تم تحديث الصورة.",
    "Photo removed.": "تمت إزالة الصورة.",
    "Invite friend": "دعوة صديق",
    "Invite a friend": "ادعُ صديقًا",
    "All groups": "كل المجموعات",
    "Confirm your email to view group details.":
      "أكد بريدك الإلكتروني لعرض تفاصيل المجموعة.",
    "Pick an expense, inspect the split map, or open the whole-group balance view to see who should pay whom after every transaction and settlement.":
      "اختر مصروفًا، وافحص خريطة التقسيم، أو افتح عرض رصيد المجموعة بالكامل لمعرفة من يجب أن يدفع لمن بعد كل معاملة وتسوية.",
    "Group not found": "المجموعة غير موجودة",
    "Overview & members": "نظرة عامة والأعضاء",
    "Invite people, track shares and settlements, and jump to the group balance map from a member card.":
      "ادعُ الأشخاص، وتتبع الحصص والتسويات، وانتقل إلى خريطة رصيد المجموعة من بطاقة العضو.",
    member: "عضو",
    members: "أعضاء",
    expense: "مصروف",
    expenses: "مصروفات",
    settlement: "تسوية",
    settlements: "تسويات",
    "Default currency": "العملة الافتراضية",
    "Created by": "أنشأها",
    "Invite code": "رمز الدعوة",
    Members: "الأعضاء",
    "No members listed.": "لا يوجد أعضاء مسجلون.",
    Creator: "المنشئ",
    "Joined {date}": "انضم في {date}",
    "Net in group:": "الصافي في المجموعة:",
    Even: "متساوٍ",
    "owed to them": "مستحق لهم",
    "they owe": "عليهم",
    Left: "المتبقي",
    "No expense splits recorded yet.": "لا توجد تقسيمات مصروفات مسجلة بعد.",
    "Accepting…": "جارٍ القبول…",
    "Accept request": "قبول الطلب",
    "Request sent": "تم إرسال الطلب",
    "Add friend": "إضافة صديق",
    "Expense hub": "مركز المصروفات",
    "Group transactions hub": "مركز معاملات المجموعة",
    "Member balances and transfer map": "أرصدة الأعضاء وخريطة التحويل",
    "Filtered by {name}": "مُصفّى حسب {name}",
    "List · split map · receipt details":
      "قائمة · خريطة التقسيم · تفاصيل الإيصال",
    "Use {label} to show the expense list and breakdown again.":
      "استخدم {label} لعرض قائمة المصروفات والتفاصيل مرة أخرى.",
    "This expense": "هذا المصروف",
    "Whole group": "المجموعة بالكامل",
    "All expenses": "كل المصروفات",
    "Clear person filter": "مسح تصفية الشخص",
    "{shown} of {total} shown": "المعروض {shown} من {total}",
    "{count} item": "{count} عنصر",
    "{count} items": "{count} عناصر",
    "newest first": "الأحدث أولاً",
    "No expenses include this person as payer or participant.":
      "لا توجد مصروفات تتضمن هذا الشخص كدافع أو مشارك.",
    "Clear filter": "مسح التصفية",
    "Transaction list": "قائمة المعاملات",
    "Center view": "عرض الوسط",
    "Net balances from every expense and settlement. Arrows point to who is owed. Press Esc to clear focus.":
      "الأرصدة الصافية من كل مصروف وتسوية. تشير الأسهم إلى من له مستحقات. اضغط Esc لمسح التركيز.",
    "Everyone settled up": "تمت التسوية للجميع",
    "Net after all expenses and settlements (positive = owed to them).":
      "الصافي بعد جميع المصروفات والتسويات (الموجب = مستحق لهم).",
    "Settlements in this group": "التسويات في هذه المجموعة",
    "Payments already recorded between members, newest first.":
      "المدفوعات المسجلة بين الأعضاء، الأحدث أولاً.",
    "No settlements recorded yet.": "لا توجد تسويات مسجلة بعد.",
    "Select an expense for the per-receipt split map, or switch to {label}.":
      "اختر مصروفًا لخريطة التقسيم حسب الإيصال، أو بدّل إلى {label}.",
    Profile: "الملف الشخصي",
    "Display name": "اسم العرض",
    "Preferred currency": "العملة المفضلة",
    "Select currency": "اختر العملة",
    "Save profile": "حفظ الملف الشخصي",
    "Change password": "تغيير كلمة المرور",
    "Current password": "كلمة المرور الحالية",
    "New password": "كلمة المرور الجديدة",
    "Update password": "تحديث كلمة المرور",
    "Profile updated.": "تم تحديث الملف الشخصي.",
    "Password updated.": "تم تحديث كلمة المرور.",
    "Sign out everywhere on this device":
      "تسجيل الخروج من هذا الجهاز في كل مكان",
    "This route has no budget line": "هذا المسار بلا بند في الميزانية",
    "The server checked under the couch cushions. Still nothing.":
      "تحقق الخادم تحت وسائد الأريكة. لا شيء بعد.",
    "Meme: Drake format about 404 pages": "ميم: صيغة دريك عن صفحات 404",
    "Admitting you typed the URL wrong": "الاعتراف بأنك كتبت الرابط خطأ",
    "Blaming inflation for a missing page (same energy)":
      "إلقاء اللوم على التضخم لصفحة مفقودة (نفس الطاقة)",
    "Not routes 📉": "ليس مسارات 📉",
    '"We underwrote this URL. The risk model said no."':
      '"لقد اكتتبنا هذا الرابط. نموذج المخاطر قال لا."',
    "- your browser's CFO (probably)": "- المدير المالي لمتصفحك (غالبًا)",
    Home: "الصفحة الرئيسية",
  },
  fr: {
    English: "Anglais",
    Arabic: "Arabe",
    French: "Français",
    German: "Allemand",
    Spanish: "Espagnol",
    "Select…": "Sélectionner…",
    "No options": "Aucune option",
    Confirm: "Confirmer",
    Cancel: "Annuler",
    You: "Vous",
    Copied: "Copié",
    Dashboard: "Tableau de bord",
    Expenses: "Dépenses",
    Groups: "Groupes",
    Friends: "Amis",
    Settlements: "Règlements",
    Settings: "Paramètres",
    Email: "E-mail",
    Password: "Mot de passe",
    "Sign In": "Se connecter",
    "Create Account": "Créer un compte",
    "Light mode": "Mode clair",
    "Dark mode": "Mode sombre",
    "Switch to light mode": "Passer en mode clair",
    "Switch to dark mode": "Passer en mode sombre",
    "Add expense": "Ajouter une dépense",
    "Sign out": "Se déconnecter",
    "Invite friend": "Inviter un ami",
    "Invite a friend": "Inviter un ami",
    "All groups": "Tous les groupes",
    "Confirm your email to view group details.":
      "Confirmez votre e-mail pour voir les détails du groupe.",
    "Pick an expense, inspect the split map, or open the whole-group balance view to see who should pay whom after every transaction and settlement.":
      "Choisissez une dépense, inspectez la carte de répartition ou ouvrez la vue du solde global pour voir qui doit payer qui après chaque transaction et règlement.",
    "Group not found": "Groupe introuvable",
    "Overview & members": "Aperçu et membres",
    "Invite people, track shares and settlements, and jump to the group balance map from a member card.":
      "Invitez des personnes, suivez les parts et les règlements, et ouvrez la carte des soldes du groupe depuis une fiche membre.",
    member: "membre",
    members: "membres",
    expense: "dépense",
    expenses: "dépenses",
    settlement: "règlement",
    settlements: "règlements",
    "Default currency": "Devise par défaut",
    "Created by": "Créé par",
    "Invite code": "Code d’invitation",
    Members: "Membres",
    "No members listed.": "Aucun membre répertorié.",
    Creator: "Créateur",
    "Joined {date}": "A rejoint le {date}",
    "Net in group:": "Net dans le groupe :",
    Even: "Équilibré",
    "owed to them": "dû pour eux",
    "they owe": "ils doivent",
    Left: "Reste",
    "No expense splits recorded yet.":
      "Aucune répartition de dépense enregistrée.",
    "Accepting…": "Acceptation…",
    "Accept request": "Accepter la demande",
    "Request sent": "Demande envoyée",
    "Add friend": "Ajouter un ami",
    "Expense hub": "Centre des dépenses",
    "Group transactions hub": "Hub des transactions du groupe",
    "Member balances and transfer map":
      "Soldes des membres et carte des transferts",
    "Filtered by {name}": "Filtré par {name}",
    "List · split map · receipt details":
      "Liste · carte de répartition · détails du reçu",
    "Use {label} to show the expense list and breakdown again.":
      "Utilisez {label} pour afficher à nouveau la liste et le détail des dépenses.",
    "This expense": "Cette dépense",
    "Whole group": "Groupe entier",
    "All expenses": "Toutes les dépenses",
    "Clear person filter": "Effacer le filtre de personne",
    "{shown} of {total} shown": "{shown} sur {total} affichés",
    "{count} item": "{count} élément",
    "{count} items": "{count} éléments",
    "newest first": "les plus récents d’abord",
    "No expenses include this person as payer or participant.":
      "Aucune dépense n’inclut cette personne comme payeur ou participant.",
    "Clear filter": "Effacer le filtre",
    "Transaction list": "Liste des transactions",
    "Center view": "Vue centrale",
    "Net balances from every expense and settlement. Arrows point to who is owed. Press Esc to clear focus.":
      "Soldes nets de chaque dépense et règlement. Les flèches indiquent à qui l’on doit. Appuyez sur Échap pour effacer le focus.",
    "Everyone settled up": "Tout le monde est à jour",
    "Net after all expenses and settlements (positive = owed to them).":
      "Net après toutes les dépenses et les règlements (positif = dû pour eux).",
    "Settlements in this group": "Règlements dans ce groupe",
    "Payments already recorded between members, newest first.":
      "Paiements déjà enregistrés entre les membres, les plus récents d’abord.",
    "No settlements recorded yet.": "Aucun règlement enregistré.",
    "Select an expense for the per-receipt split map, or switch to {label}.":
      "Sélectionnez une dépense pour la carte de répartition par reçu, ou passez à {label}.",
    "Select an expense from the list to see the full breakdown and settlements.":
      "Sélectionnez une dépense dans la liste pour voir le détail complet et les règlements.",
    Profile: "Profil",
    "Display name": "Nom d’affichage",
    "Preferred currency": "Devise préférée",
    "Select currency": "Choisir la devise",
    "Save profile": "Enregistrer le profil",
    "Change password": "Changer le mot de passe",
    "Current password": "Mot de passe actuel",
    "New password": "Nouveau mot de passe",
    "Update password": "Mettre à jour le mot de passe",
    "Profile updated.": "Profil mis à jour.",
    "Password updated.": "Mot de passe mis à jour.",
    "Sign out everywhere on this device":
      "Se déconnecter partout sur cet appareil",
    "Reset password": "Réinitialiser le mot de passe",
    "Send reset link": "Envoyer le lien de réinitialisation",
    "Back to sign in": "Retour à la connexion",
    "Confirm email": "Confirmer l’e-mail",
    "Confirming…": "Confirmation…",
    Continue: "Continuer",
    "Almost there…": "Presque terminé…",
    "Thanks — your email is confirmed.": "Merci — votre e-mail est confirmé.",
    "We&apos;re confirming your email now. If needed, you can retry below.":
      "Nous confirmons votre e-mail maintenant. Si besoin, vous pouvez réessayer ci-dessous.",
    "This link is missing required information. Request a new confirmation email from the app banner.":
      "Ce lien ne contient pas toutes les informations requises. Demandez un nouvel e-mail de confirmation depuis la bannière de l’app.",
    "Enter your email and we&apos;ll send a link when the account exists.":
      "Saisissez votre e-mail et nous enverrons un lien si le compte existe.",
    "If that email exists, a reset link has been sent.":
      "Si cet e-mail existe, un lien de réinitialisation a été envoyé.",
    "Securing your session and balances…":
      "Sécurisation de votre session et de vos soldes…",
    "Update your display name and currency, and change your password.":
      "Mettez à jour votre nom d’affichage et votre devise, et changez votre mot de passe.",
    Someone: "Quelqu’un",
    paid: "a payé",
    View: "Voir",
    "Balances per group and your latest expense activity.":
      "Soldes par groupe et dernière activité de dépenses.",
    "Active groups": "Groupes actifs",
    "Manage groups": "Gérer les groupes",
    "You are owed": "On vous doit",
    "Totals by currency across groups": "Totaux par devise dans les groupes",
    "You owe": "Vous devez",
    "Settle up": "Régler",
    "Per-group balances": "Soldes par groupe",
    "Join a group to see how much you owe and are owed.":
      "Rejoignez un groupe pour voir ce que vous devez et ce qu’on vous doit.",
    Group: "Groupe",
    "Recent activity": "Activité récente",
    "Expenses and settlements, newest first":
      "Dépenses et règlements, les plus récents d’abord",
    "All activity": "Toute l’activité",
    "No transactions or settlements yet in your groups.":
      "Aucune transaction ni règlement pour l’instant dans vos groupes.",
    Expense: "Dépense",
    Settlement: "Règlement",
    "Loading expenses…": "Chargement des dépenses…",
    Transport: "Transport",
    Food: "Nourriture",
    Accommodation: "Hébergement",
    Entertainment: "Divertissement",
    Utilities: "Charges",
    Shopping: "Achats",
    Other: "Autre",
    "Category {id}": "Catégorie {id}",
    you: "vous",
    Member: "Membre",
    "Enter an amount greater than zero.":
      "Saisissez un montant supérieur à zéro.",
    "This group has no members to split with yet.":
      "Ce groupe n’a pas encore de membres pour partager.",
    "Splits must add up to {total} {currency}. Current: {current}.":
      "Les parts doivent totaliser {total} {currency}. Actuel : {current}.",
    "Confirm your email to load expenses from the API.":
      "Confirmez votre e-mail pour charger les dépenses depuis l’API.",
    "Add transactions for a group. Amounts use the group&apos;s default currency ({currency}). You are recorded as the person who paid.":
      "Ajoutez des transactions pour un groupe. Les montants utilisent la devise par défaut du groupe ({currency}). Vous êtes enregistré comme la personne qui a payé.",
    "Choose a group": "Choisir un groupe",
    "No groups yet — create one under Groups":
      "Aucun groupe — créez-en un dans Groupes",
    Transactions: "Transactions",
    "No transactions in this group yet.":
      "Aucune transaction dans ce groupe pour l’instant.",
    "Select a group to add an expense.":
      "Sélectionnez un groupe pour ajouter une dépense.",
    Currency: "Devise",
    "(must match the group — set when the group was created)":
      "(doit correspondre au groupe — défini lors de sa création)",
    "Amount ({currency})": "Montant ({currency})",
    "0.00": "0,00",
    "Description (optional)": "Description (facultatif)",
    "Dinner, rent, taxi…": "Dîner, loyer, taxi…",
    "Pick a category": "Choisir une catégorie",
    "Split between members": "Répartir entre les membres",
    "Equal split ({count} member)": "Répartition égale ({count} membre)",
    "Custom amounts": "Montants personnalisés",
    "Add transaction": "Ajouter une transaction",
    "Default currency · {currency}": "Devise par défaut · {currency}",
    "Confirm your email to create and list groups.":
      "Confirmez votre e-mail pour créer et lister les groupes.",
    "Shareable groups with invite tokens — matches the settlements and expense flows in the design reference.":
      "Groupes partageables avec jetons d’invitation — correspond aux flux de règlements et de dépenses du design de référence.",
    "You opened an invite link — the code is filled in below. Tap":
      "Vous avez ouvert un lien d’invitation — le code est rempli ci-dessous. Appuyez",
    "Join group": "Rejoindre le groupe",
    "when you&apos;re ready.": "quand vous êtes prêt.",
    "Loading invitations…": "Chargement des invitations…",
    "Pending group invitations": "Invitations de groupe en attente",
    "Group invitations": "Invitations de groupe",
    "From {name}": "De {name}",
    Dismiss: "Ignorer",
    "New group name": "Nom du nouveau groupe",
    "Ski trip 2024": "Voyage de ski 2024",
    "Create group": "Créer un groupe",
    "Join with invite code": "Rejoindre avec un code d’invitation",
    "Paste the invite code (or open a shared link). Group UUID is not used here — only the invite token from the owner.":
      "Collez le code d’invitation (ou ouvrez un lien partagé). L’UUID du groupe n’est pas utilisé ici — seulement le jeton d’invitation du propriétaire.",
    "Invite code from share link or group owner":
      "Code d’invitation depuis le lien partagé ou le propriétaire",
    "Joining…": "Connexion…",
    "Your groups": "Vos groupes",
    "No groups yet — create one above.":
      "Aucun groupe — créez-en un ci-dessus.",
    Invite: "Invitation",
    "Open group": "Ouvrir le groupe",
    "Share invite": "Partager l’invitation",
    'You\'re invited to join "{group}" on Cayeshni.\n\nOpen: {url}\n\nOr enter this invite code: {inviteToken}':
      'Vous êtes invité à rejoindre "{group}" sur Cayeshni.\n\nOuvrez : {url}\n\nOu entrez ce code d’invitation : {inviteToken}',
    'Join link copied for "{group}".':
      'Lien de participation copié pour "{group}".',
    'Invite code copied for "{group}".':
      'Code d’invitation copié pour "{group}".',
    "Could not copy automatically — copy the invite code from the list.":
      "Impossible de copier automatiquement — copiez le code d’invitation depuis la liste.",
    "Loading friends…": "Chargement des amis…",
    "Could not copy to clipboard.":
      "Impossible de copier dans le presse-papiers.",
    "You cannot send a friend request to yourself.":
      "Vous ne pouvez pas vous envoyer une demande d’ami.",
    "Friend request sent.": "Demande d’ami envoyée.",
    "Enter a valid email address for your friend’s Cayeshni account.":
      "Saisissez une adresse e-mail valide pour le compte Cayeshni de votre ami.",
    "Search for someone by name and pick their profile, or use email.":
      "Recherchez quelqu’un par nom et choisissez son profil, ou utilisez l’e-mail.",
    "You are now friends.": "Vous êtes maintenant amis.",
    "Friend removed.": "Ami supprimé.",
    "Confirm your email to use friends.":
      "Confirmez votre e-mail pour utiliser les amis.",
    "Search by display name, pick the right person from the list, or send by email. Accept incoming requests below.":
      "Recherchez par nom d’affichage, choisissez la bonne personne dans la liste, ou envoyez par e-mail. Acceptez les demandes ci-dessous.",
    "Your email": "Votre e-mail",
    "Others can send you a request with this address.":
      "Les autres peuvent vous envoyer une demande avec cette adresse.",
    Copy: "Copier",
    "Send a friend request": "Envoyer une demande d’ami",
    "Search by display name": "Rechercher par nom d’affichage",
    Change: "Changer",
    "Send request": "Envoyer la demande",
    "Type at least 2 characters…": "Tapez au moins 2 caractères…",
    "Searching…": "Recherche…",
    "No matching profiles.": "Aucun profil correspondant.",
    "I have their email instead": "J’ai leur e-mail à la place",
    "Their email": "Leur e-mail",
    "friend@example.com": "ami@exemple.com",
    "Search by name instead": "Rechercher par nom à la place",
    "Incoming requests": "Demandes entrantes",
    "No pending requests.": "Aucune demande en attente.",
    Accept: "Accepter",
    "Your friends ({count})": "Vos amis ({count})",
    "No friends yet. Send a request or accept one above.":
      "Pas encore d’amis. Envoyez une demande ou acceptez-en une ci-dessus.",
    Remove: "Retirer",
    "Remove {name} from your friends list?":
      "Retirer {name} de votre liste d’amis ?",
    "Choose another member as payee.":
      "Choisissez un autre membre comme bénéficiaire.",
    "Enter a positive amount.": "Saisissez un montant positif.",
    "Amount cannot exceed what you still owe this member on shared expenses ({amount} {currency}).":
      "Le montant ne peut pas dépasser ce que vous devez encore à ce membre pour les dépenses partagées ({amount} {currency}).",
    "No matching expenses to apply this payment to. Pick a payee you owe through a shared expense they paid for.":
      "Aucune dépense correspondante pour appliquer ce paiement. Choisissez un bénéficiaire auquel vous devez via une dépense partagée qu’il a payée.",
    "Confirm your email to load settlements.":
      "Confirmez votre e-mail pour charger les règlements.",
    "Loading your account…": "Chargement de votre compte…",
    "Record cash or external transfers against shared expenses. Allocations apply to the oldest matching expenses first.":
      "Enregistrez des paiements en espèces ou des transferts externes contre des dépenses partagées. Les allocations s’appliquent d’abord aux dépenses correspondantes les plus anciennes.",
    "Join or create a group to use settlements.":
      "Rejoignez ou créez un groupe pour utiliser les règlements.",
    Balances: "Soldes",
    "No members or debt data.": "Aucun membre ni données de dette.",
    "Remaining owed": "Restant dû",
    "Record payment": "Enregistrer un paiement",
    "You record a payment from you to someone you owe through expenses they paid for in this group.":
      "Vous enregistrez un paiement de votre part à quelqu’un à qui vous devez via des dépenses qu’il a payées dans ce groupe.",
    "Loading group…": "Chargement du groupe…",
    "Pay to": "Payer à",
    "Loading payees…": "Chargement des bénéficiaires…",
    "No one you owe in this group": "Personne à qui vous devez dans ce groupe",
    "Select member…": "Sélectionner un membre…",
    "No one you currently owe through shared expenses":
      "Personne à qui vous devez actuellement via des dépenses partagées",
    "Use max ({amount})": "Utiliser le max ({amount})",
    "Loading expense breakdown…": "Chargement du détail des dépenses…",
    "Max toward {name}": "Max vers {name}",
    "Note (optional)": "Note (facultatif)",
    "e.g. Venmo, cash": "ex. Venmo, espèces",
    "Will apply to {count} expense(s)": "S’appliquera à {count} dépense(s)",
    "{count} expense allocation": "{count} affectation de dépense",
    "{count} expense allocations": "{count} affectations de dépenses",
    "Record settlement": "Enregistrer le règlement",
    "Settlement history": "Historique des règlements",
    "No settlements recorded for this group.":
      "Aucun règlement enregistré pour ce groupe.",
    "Save note": "Enregistrer la note",
    "Edit note": "Modifier la note",
    Delete: "Supprimer",
    "Remove this settlement?": "Supprimer ce règlement ?",
    "Balances on the linked expenses will update to reflect that this payment no longer happened.":
      "Les soldes des dépenses liées seront mis à jour pour refléter que ce paiement n’a plus eu lieu.",
    "Remove settlement": "Supprimer le règlement",
    "Keep it": "Le garder",
    "Confirm your email to view and edit your profile. After you use the link in your inbox, refresh this page.":
      "Confirmez votre e-mail pour voir et modifier votre profil. Après avoir utilisé le lien dans votre boîte de réception, actualisez la page.",
    "Manage your photo, display name, and default currency.":
      "Gérez votre photo, votre nom d’affichage et la devise par défaut.",
    "Password &amp; security →": "Mot de passe &amp; sécurité →",
    "Member since": "Membre depuis",
    "Change photo": "Changer la photo",
    "Remove photo": "Supprimer la photo",
    "Edit details": "Modifier les détails",
    "Photo updated.": "Photo mise à jour.",
    "Photo removed.": "Photo supprimée.",
    "This route has no budget line": "Cette route n’a pas de ligne budgétaire",
    "The server checked under the couch cushions. Still nothing.":
      "Le serveur a regardé sous les coussins du canapé. Toujours rien.",
    "Meme: Drake format about 404 pages":
      "Mème : format Drake sur les pages 404",
    "Admitting you typed the URL wrong":
      "Admettre que vous avez mal tapé l’URL",
    "Blaming inflation for a missing page (same energy)":
      "Blâmer l’inflation pour une page manquante (même énergie)",
    "Not routes 📉": "Pas des routes 📉",
    '"We underwrote this URL. The risk model said no."':
      '"Nous avons souscrit cette URL. Le modèle de risque a dit non."',
    "- your browser's CFO (probably)":
      "- le CFO de votre navigateur (probablement)",
    Home: "Accueil",
  },
  de: {
    English: "Englisch",
    Arabic: "Arabisch",
    French: "Französisch",
    German: "Deutsch",
    Spanish: "Spanisch",
    "Select…": "Auswählen…",
    "No options": "Keine Optionen",
    Confirm: "Bestätigen",
    Cancel: "Abbrechen",
    You: "Du",
    Copied: "Kopiert",
    Dashboard: "Dashboard",
    Expenses: "Ausgaben",
    Groups: "Gruppen",
    Friends: "Freunde",
    Settlements: "Abrechnungen",
    Settings: "Einstellungen",
    Email: "E-Mail",
    Password: "Passwort",
    "Sign In": "Anmelden",
    "Create Account": "Konto erstellen",
    "Light mode": "Heller Modus",
    "Dark mode": "Dunkler Modus",
    "Switch to light mode": "Zum hellen Modus wechseln",
    "Switch to dark mode": "Zum dunklen Modus wechseln",
    "Add expense": "Ausgabe hinzufügen",
    "Sign out": "Abmelden",
    "Invite friend": "Freund einladen",
    "Invite a friend": "Einen Freund einladen",
    "All groups": "Alle Gruppen",
    "Confirm your email to view group details.":
      "Bestätige deine E-Mail, um Gruppendetails zu sehen.",
    "Pick an expense, inspect the split map, or open the whole-group balance view to see who should pay whom after every transaction and settlement.":
      "Wähle eine Ausgabe, sieh dir die Aufteilungskarte an oder öffne die Gesamtgruppenansicht, um zu sehen, wer nach jeder Transaktion und Abrechnung wem etwas schuldet.",
    "Group not found": "Gruppe nicht gefunden",
    "Overview & members": "Übersicht & Mitglieder",
    "Invite people, track shares and settlements, and jump to the group balance map from a member card.":
      "Lade Personen ein, verfolge Anteile und Abrechnungen und öffne die Gruppensalden-Karte aus einer Mitgliederkarte.",
    member: "Mitglied",
    members: "Mitglieder",
    expense: "Ausgabe",
    expenses: "Ausgaben",
    settlement: "Abrechnung",
    settlements: "Abrechnungen",
    "Default currency": "Standardwährung",
    "Created by": "Erstellt von",
    "Invite code": "Einladungscode",
    Members: "Mitglieder",
    "No members listed.": "Keine Mitglieder aufgeführt.",
    Creator: "Ersteller",
    "Joined {date}": "Beigetreten am {date}",
    "Net in group:": "Netto in der Gruppe:",
    Even: "Ausgeglichen",
    "owed to them": "ihnen geschuldet",
    "they owe": "sie schulden",
    Left: "Übrig",
    "No expense splits recorded yet.":
      "Noch keine Ausgabenaufteilungen erfasst.",
    "Accepting…": "Wird akzeptiert…",
    "Accept request": "Anfrage annehmen",
    "Request sent": "Anfrage gesendet",
    "Add friend": "Freund hinzufügen",
    "Expense hub": "Ausgaben-Hub",
    "Group transactions hub": "Transaktions-Hub der Gruppe",
    "Member balances and transfer map": "Mitgliedersalden und Transferkarte",
    "Filtered by {name}": "Gefiltert nach {name}",
    "List · split map · receipt details":
      "Liste · Aufteilungskarte · Belegdaten",
    "Use {label} to show the expense list and breakdown again.":
      "Nutze {label}, um die Ausgabenliste und Details wieder anzuzeigen.",
    "This expense": "Diese Ausgabe",
    "Whole group": "Gesamte Gruppe",
    "All expenses": "Alle Ausgaben",
    "Clear person filter": "Personenfilter löschen",
    "{shown} of {total} shown": "{shown} von {total} angezeigt",
    "{count} item": "{count} Eintrag",
    "{count} items": "{count} Einträge",
    "newest first": "neueste zuerst",
    "No expenses include this person as payer or participant.":
      "Keine Ausgaben enthalten diese Person als Zahler oder Teilnehmer.",
    "Clear filter": "Filter löschen",
    "Transaction list": "Transaktionsliste",
    "Center view": "Zentransicht",
    "Net balances from every expense and settlement. Arrows point to who is owed. Press Esc to clear focus.":
      "Netto-Salden aus jeder Ausgabe und Abrechnung. Pfeile zeigen, wem etwas geschuldet wird. Drücke Esc, um den Fokus zu löschen.",
    "Everyone settled up": "Alle sind ausgeglichen",
    "Net after all expenses and settlements (positive = owed to them).":
      "Netto nach allen Ausgaben und Abrechnungen (positiv = ihnen geschuldet).",
    "Settlements in this group": "Abrechnungen in dieser Gruppe",
    "Payments already recorded between members, newest first.":
      "Bereits erfasste Zahlungen zwischen Mitgliedern, neueste zuerst.",
    "No settlements recorded yet.": "Noch keine Abrechnungen erfasst.",
    "Select an expense for the per-receipt split map, or switch to {label}.":
      "Wähle eine Ausgabe für die Beleg-Aufteilungskarte oder wechsle zu {label}.",
    "Select an expense from the list to see the full breakdown and settlements.":
      "Wähle eine Ausgabe aus der Liste, um die vollständige Aufschlüsselung und Abrechnungen zu sehen.",
    Profile: "Profil",
    "Display name": "Anzeigename",
    "Preferred currency": "Bevorzugte Währung",
    "Select currency": "Währung auswählen",
    "Save profile": "Profil speichern",
    "Change password": "Passwort ändern",
    "Current password": "Aktuelles Passwort",
    "New password": "Neues Passwort",
    "Update password": "Passwort aktualisieren",
    "Profile updated.": "Profil aktualisiert.",
    "Password updated.": "Passwort aktualisiert.",
    "Sign out everywhere on this device": "Überall auf diesem Gerät abmelden",
    "Reset password": "Passwort zurücksetzen",
    "Send reset link": "Zurücksetzungslink senden",
    "Back to sign in": "Zurück zur Anmeldung",
    "Confirm email": "E-Mail bestätigen",
    "Confirming…": "Bestätigen…",
    Continue: "Weiter",
    "Almost there…": "Gleich geschafft…",
    "Thanks — your email is confirmed.": "Danke — deine E-Mail ist bestätigt.",
    "We&apos;re confirming your email now. If needed, you can retry below.":
      "Wir bestätigen deine E-Mail jetzt. Falls nötig, kannst du unten erneut versuchen.",
    "This link is missing required information. Request a new confirmation email from the app banner.":
      "Dieser Link enthält nicht alle erforderlichen Informationen. Fordere eine neue Bestätigungs-E-Mail über das App-Banner an.",
    "Enter your email and we&apos;ll send a link when the account exists.":
      "Gib deine E-Mail ein, und wir senden einen Link, wenn das Konto existiert.",
    "If that email exists, a reset link has been sent.":
      "Wenn diese E-Mail existiert, wurde ein Zurücksetzungslink gesendet.",
    "Securing your session and balances…":
      "Sitzung und Salden werden gesichert…",
    "Update your display name and currency, and change your password.":
      "Aktualisiere deinen Anzeigenamen und die Währung und ändere dein Passwort.",
    Someone: "Jemand",
    paid: "zahlte",
    View: "Ansehen",
    "Balances per group and your latest expense activity.":
      "Salden pro Gruppe und deine letzte Ausgabenaktivität.",
    "Active groups": "Aktive Gruppen",
    "Manage groups": "Gruppen verwalten",
    "You are owed": "Dir wird geschuldet",
    "Totals by currency across groups": "Summen nach Währung über Gruppen",
    "You owe": "Du schuldest",
    "Settle up": "Ausgleichen",
    "Per-group balances": "Salden pro Gruppe",
    "Join a group to see how much you owe and are owed.":
      "Tritt einer Gruppe bei, um zu sehen, was du schuldest und was dir geschuldet wird.",
    Group: "Gruppe",
    "Recent activity": "Letzte Aktivität",
    "Expenses and settlements, newest first":
      "Ausgaben und Abrechnungen, neueste zuerst",
    "All activity": "Alle Aktivitäten",
    "No transactions or settlements yet in your groups.":
      "Noch keine Transaktionen oder Abrechnungen in deinen Gruppen.",
    Expense: "Ausgabe",
    Settlement: "Abrechnung",
    "Loading expenses…": "Ausgaben werden geladen…",
    Transport: "Transport",
    Food: "Essen",
    Accommodation: "Unterkunft",
    Entertainment: "Unterhaltung",
    Utilities: "Nebenkosten",
    Shopping: "Einkaufen",
    Other: "Sonstiges",
    "Category {id}": "Kategorie {id}",
    you: "du",
    Member: "Mitglied",
    "Enter an amount greater than zero.":
      "Gib einen Betrag größer als null ein.",
    "This group has no members to split with yet.":
      "Diese Gruppe hat noch keine Mitglieder zum Aufteilen.",
    "Splits must add up to {total} {currency}. Current: {current}.":
      "Die Anteile müssen {total} {currency} ergeben. Aktuell: {current}.",
    "Confirm your email to load expenses from the API.":
      "Bestätige deine E-Mail, um Ausgaben aus der API zu laden.",
    "Add transactions for a group. Amounts use the group&apos;s default currency ({currency}). You are recorded as the person who paid.":
      "Füge Transaktionen für eine Gruppe hinzu. Beträge verwenden die Standardwährung der Gruppe ({currency}). Du wirst als Zahler erfasst.",
    "Choose a group": "Gruppe auswählen",
    "No groups yet — create one under Groups":
      "Noch keine Gruppen — erstelle eine unter Gruppen",
    Transactions: "Transaktionen",
    "No transactions in this group yet.":
      "Noch keine Transaktionen in dieser Gruppe.",
    "Select a group to add an expense.":
      "Wähle eine Gruppe, um eine Ausgabe hinzuzufügen.",
    Currency: "Währung",
    "(must match the group — set when the group was created)":
      "(muss zur Gruppe passen — bei der Erstellung festgelegt)",
    "Amount ({currency})": "Betrag ({currency})",
    "0.00": "0,00",
    "Description (optional)": "Beschreibung (optional)",
    "Dinner, rent, taxi…": "Abendessen, Miete, Taxi…",
    "Pick a category": "Kategorie wählen",
    "Split between members": "Zwischen Mitgliedern aufteilen",
    "Equal split ({count} member)":
      "Gleichmäßige Aufteilung ({count} Mitglied)",
    "Custom amounts": "Benutzerdefinierte Beträge",
    "Add transaction": "Transaktion hinzufügen",
    "Default currency · {currency}": "Standardwährung · {currency}",
    "Confirm your email to create and list groups.":
      "Bestätige deine E-Mail, um Gruppen zu erstellen und anzuzeigen.",
    "Shareable groups with invite tokens — matches the settlements and expense flows in the design reference.":
      "Teilbare Gruppen mit Einladungstoken — entspricht den Abrechnungs- und Ausgabenflüssen im Design-Referenz.",
    "You opened an invite link — the code is filled in below. Tap":
      "Du hast einen Einladungslink geöffnet — der Code ist unten ausgefüllt. Tippe",
    "Join group": "Gruppe beitreten",
    "when you&apos;re ready.": "wenn du bereit bist.",
    "Loading invitations…": "Einladungen werden geladen…",
    "Pending group invitations": "Ausstehende Gruppeneinladungen",
    "Group invitations": "Gruppeneinladungen",
    "From {name}": "Von {name}",
    Dismiss: "Verwerfen",
    "New group name": "Neuer Gruppenname",
    "Ski trip 2024": "Skireise 2024",
    "Create group": "Gruppe erstellen",
    "Join with invite code": "Mit Einladungscode beitreten",
    "Paste the invite code (or open a shared link). Group UUID is not used here — only the invite token from the owner.":
      "Füge den Einladungscode ein (oder öffne einen geteilten Link). Die Gruppen-UUID wird hier nicht verwendet — nur der Einladungstoken des Besitzers.",
    "Invite code from share link or group owner":
      "Einladungscode aus dem geteilten Link oder vom Gruppenbesitzer",
    "Joining…": "Beitritt…",
    "Your groups": "Deine Gruppen",
    "No groups yet — create one above.":
      "Noch keine Gruppen — erstelle eine oben.",
    Invite: "Einladung",
    "Open group": "Gruppe öffnen",
    "Share invite": "Einladung teilen",
    'You\'re invited to join "{group}" on Cayeshni.\n\nOpen: {url}\n\nOr enter this invite code: {inviteToken}':
      'Du bist eingeladen, "{group}" auf Cayeshni beizutreten.\n\nÖffnen: {url}\n\nOder diesen Einladungscode eingeben: {inviteToken}',
    'Join link copied for "{group}".': 'Beitrittslink für "{group}" kopiert.',
    'Invite code copied for "{group}".':
      'Einladungscode für "{group}" kopiert.',
    "Could not copy automatically — copy the invite code from the list.":
      "Automatisches Kopieren fehlgeschlagen — kopiere den Einladungscode aus der Liste.",
    "Loading friends…": "Freunde werden geladen…",
    "Could not copy to clipboard.":
      "Kopieren in die Zwischenablage nicht möglich.",
    "You cannot send a friend request to yourself.":
      "Du kannst dir selbst keine Freundschaftsanfrage senden.",
    "Friend request sent.": "Freundschaftsanfrage gesendet.",
    "Enter a valid email address for your friend’s Cayeshni account.":
      "Gib eine gültige E-Mail-Adresse für das Cayeshni-Konto deines Freundes ein.",
    "Search for someone by name and pick their profile, or use email.":
      "Suche nach jemandem nach Namen und wähle das Profil, oder nutze die E-Mail.",
    "You are now friends.": "Ihr seid jetzt Freunde.",
    "Friend removed.": "Freund entfernt.",
    "Confirm your email to use friends.":
      "Bestätige deine E-Mail, um Freunde zu nutzen.",
    "Search by display name, pick the right person from the list, or send by email. Accept incoming requests below.":
      "Suche nach Anzeigenamen, wähle die richtige Person aus der Liste oder sende per E-Mail. Akzeptiere eingehende Anfragen unten.",
    "Your email": "Deine E-Mail",
    "Others can send you a request with this address.":
      "Andere können dir mit dieser Adresse eine Anfrage senden.",
    Copy: "Kopieren",
    "Send a friend request": "Freundschaftsanfrage senden",
    "Search by display name": "Nach Anzeigenamen suchen",
    Change: "Ändern",
    "Send request": "Anfrage senden",
    "Type at least 2 characters…": "Gib mindestens 2 Zeichen ein…",
    "Searching…": "Suche…",
    "No matching profiles.": "Keine passenden Profile.",
    "I have their email instead": "Ich habe stattdessen ihre E-Mail",
    "Their email": "Ihre E-Mail",
    "friend@example.com": "freund@beispiel.de",
    "Search by name instead": "Stattdessen nach Namen suchen",
    "Incoming requests": "Eingehende Anfragen",
    "No pending requests.": "Keine ausstehenden Anfragen.",
    Accept: "Akzeptieren",
    "Your friends ({count})": "Deine Freunde ({count})",
    "No friends yet. Send a request or accept one above.":
      "Noch keine Freunde. Sende eine Anfrage oder akzeptiere oben eine.",
    Remove: "Entfernen",
    "Remove {name} from your friends list?":
      "{name} aus deiner Freundesliste entfernen?",
    "Choose another member as payee.":
      "Wähle ein anderes Mitglied als Empfänger.",
    "Enter a positive amount.": "Gib einen positiven Betrag ein.",
    "Amount cannot exceed what you still owe this member on shared expenses ({amount} {currency}).":
      "Der Betrag darf nicht höher sein als das, was du diesem Mitglied noch für gemeinsame Ausgaben schuldest ({amount} {currency}).",
    "No matching expenses to apply this payment to. Pick a payee you owe through a shared expense they paid for.":
      "Keine passenden Ausgaben für diese Zahlung. Wähle einen Empfänger, dem du aufgrund einer von ihm bezahlten gemeinsamen Ausgabe etwas schuldest.",
    "Confirm your email to load settlements.":
      "Bestätige deine E-Mail, um Abrechnungen zu laden.",
    "Loading your account…": "Dein Konto wird geladen…",
    "Record cash or external transfers against shared expenses. Allocations apply to the oldest matching expenses first.":
      "Erfasse Barzahlungen oder externe Überweisungen gegen gemeinsame Ausgaben. Zuweisungen werden zuerst auf die ältesten passenden Ausgaben angewandt.",
    "Join or create a group to use settlements.":
      "Tritt einer Gruppe bei oder erstelle eine, um Abrechnungen zu nutzen.",
    Balances: "Salden",
    "No members or debt data.": "Keine Mitglieder oder Schuldendaten.",
    "Remaining owed": "Noch geschuldet",
    "Record payment": "Zahlung erfassen",
    "You record a payment from you to someone you owe through expenses they paid for in this group.":
      "Du erfasst eine Zahlung von dir an jemanden, dem du aufgrund von Ausgaben schuldest, die er in dieser Gruppe bezahlt hat.",
    "Loading group…": "Gruppe wird geladen…",
    "Pay to": "Zahlen an",
    "Loading payees…": "Empfänger werden geladen…",
    "No one you owe in this group":
      "Niemand, dem du in dieser Gruppe etwas schuldest",
    "Select member…": "Mitglied auswählen…",
    "No one you currently owe through shared expenses":
      "Niemand, dem du derzeit durch gemeinsame Ausgaben etwas schuldest",
    "Use max ({amount})": "Max nutzen ({amount})",
    "Loading expense breakdown…": "Ausgabenaufschlüsselung wird geladen…",
    "Max toward {name}": "Maximal zu {name}",
    "Note (optional)": "Notiz (optional)",
    "e.g. Venmo, cash": "z. B. Venmo, Bargeld",
    "Will apply to {count} expense(s)":
      "Wird auf {count} Ausgabe(n) angewendet",
    "{count} expense allocation": "{count} Ausgaben-Zuordnung",
    "{count} expense allocations": "{count} Ausgaben-Zuordnungen",
    "Record settlement": "Abrechnung erfassen",
    "Settlement history": "Abrechnungsverlauf",
    "No settlements recorded for this group.":
      "Keine Abrechnungen für diese Gruppe aufgezeichnet.",
    "Save note": "Notiz speichern",
    "Edit note": "Notiz bearbeiten",
    Delete: "Löschen",
    "Remove this settlement?": "Diese Abrechnung entfernen?",
    "Balances on the linked expenses will update to reflect that this payment no longer happened.":
      "Die Salden der verknüpften Ausgaben werden aktualisiert, um widerzuspiegeln, dass diese Zahlung nicht mehr stattgefunden hat.",
    "Remove settlement": "Abrechnung entfernen",
    "Keep it": "Behalten",
    "Confirm your email to view and edit your profile. After you use the link in your inbox, refresh this page.":
      "Bestätige deine E-Mail, um dein Profil anzusehen und zu bearbeiten. Aktualisiere die Seite, nachdem du den Link in deinem Posteingang genutzt hast.",
    "Manage your photo, display name, and default currency.":
      "Verwalte dein Foto, deinen Anzeigenamen und die Standardwährung.",
    "Password &amp; security →": "Passwort &amp; Sicherheit →",
    "Member since": "Mitglied seit",
    "Change photo": "Foto ändern",
    "Remove photo": "Foto entfernen",
    "Edit details": "Details bearbeiten",
    "Photo updated.": "Foto aktualisiert.",
    "Photo removed.": "Foto entfernt.",
    "This route has no budget line": "Diese Route hat keine Budgetzeile",
    "The server checked under the couch cushions. Still nothing.":
      "Der Server hat unter den Sofakissen gesucht. Immer noch nichts.",
    "Meme: Drake format about 404 pages": "Meme: Drake-Format zu 404-Seiten",
    "Admitting you typed the URL wrong":
      "Zugeben, dass du die URL falsch getippt hast",
    "Blaming inflation for a missing page (same energy)":
      "Inflation für eine fehlende Seite verantwortlich machen (gleiche Energie)",
    "Not routes 📉": "Keine Routen 📉",
    '"We underwrote this URL. The risk model said no."':
      '"Wir haben diese URL unterzeichnet. Das Risikomodell sagte nein."',
    "- your browser's CFO (probably)":
      "- der CFO deines Browsers (wahrscheinlich)",
    Home: "Startseite",
  },
  es: {
    English: "Inglés",
    Arabic: "Árabe",
    French: "Francés",
    German: "Alemán",
    Spanish: "Español",
    "Select…": "Seleccionar…",
    "No options": "Sin opciones",
    Confirm: "Confirmar",
    Cancel: "Cancelar",
    You: "Tú",
    Copied: "Copiado",
    Dashboard: "Panel",
    Expenses: "Gastos",
    Groups: "Grupos",
    Friends: "Amigos",
    Settlements: "Liquidaciones",
    Settings: "Configuración",
    Email: "Correo electrónico",
    Password: "Contraseña",
    "Sign In": "Iniciar sesión",
    "Create Account": "Crear cuenta",
    "Light mode": "Modo claro",
    "Dark mode": "Modo oscuro",
    "Switch to light mode": "Cambiar a modo claro",
    "Switch to dark mode": "Cambiar a modo oscuro",
    "Add expense": "Agregar gasto",
    "Sign out": "Cerrar sesión",
    "Invite friend": "Invitar amigo",
    "Invite a friend": "Invitar a un amigo",
    "All groups": "Todos los grupos",
    "Confirm your email to view group details.":
      "Confirma tu correo para ver los detalles del grupo.",
    "Pick an expense, inspect the split map, or open the whole-group balance view to see who should pay whom after every transaction and settlement.":
      "Elige un gasto, revisa el mapa de reparto o abre la vista de saldo del grupo para ver quién debe pagar a quién después de cada transacción y liquidación.",
    "Group not found": "Grupo no encontrado",
    "Overview & members": "Resumen y miembros",
    "Invite people, track shares and settlements, and jump to the group balance map from a member card.":
      "Invita a personas, sigue las participaciones y liquidaciones, y abre el mapa de saldo del grupo desde una tarjeta de miembro.",
    member: "miembro",
    members: "miembros",
    expense: "gasto",
    expenses: "gastos",
    settlement: "liquidación",
    settlements: "liquidaciones",
    "Default currency": "Moneda predeterminada",
    "Created by": "Creado por",
    "Invite code": "Código de invitación",
    Members: "Miembros",
    "No members listed.": "No hay miembros listados.",
    Creator: "Creador",
    "Joined {date}": "Se unió el {date}",
    "Net in group:": "Neto en el grupo:",
    Even: "Equilibrado",
    "owed to them": "se les debe",
    "they owe": "deben",
    Left: "Restante",
    "No expense splits recorded yet.":
      "Aún no hay repartos de gastos registrados.",
    "Accepting…": "Aceptando…",
    "Accept request": "Aceptar solicitud",
    "Request sent": "Solicitud enviada",
    "Add friend": "Agregar amigo",
    "Expense hub": "Centro de gastos",
    "Group transactions hub": "Centro de transacciones del grupo",
    "Member balances and transfer map":
      "Saldos de miembros y mapa de transferencias",
    "Filtered by {name}": "Filtrado por {name}",
    "List · split map · receipt details":
      "Lista · mapa de reparto · detalles del recibo",
    "Use {label} to show the expense list and breakdown again.":
      "Usa {label} para mostrar de nuevo la lista de gastos y el detalle.",
    "This expense": "Este gasto",
    "Whole group": "Grupo completo",
    "All expenses": "Todos los gastos",
    "Clear person filter": "Borrar filtro de persona",
    "{shown} of {total} shown": "{shown} de {total} mostrados",
    "{count} item": "{count} elemento",
    "{count} items": "{count} elementos",
    "newest first": "más recientes primero",
    "No expenses include this person as payer or participant.":
      "Ningún gasto incluye a esta persona como pagador o participante.",
    "Clear filter": "Borrar filtro",
    "Transaction list": "Lista de transacciones",
    "Center view": "Vista central",
    "Net balances from every expense and settlement. Arrows point to who is owed. Press Esc to clear focus.":
      "Saldos netos de cada gasto y liquidación. Las flechas indican a quién se le debe. Presiona Esc para limpiar el foco.",
    "Everyone settled up": "Todos están al día",
    "Net after all expenses and settlements (positive = owed to them).":
      "Neto después de todos los gastos y liquidaciones (positivo = se les debe).",
    "Settlements in this group": "Liquidaciones en este grupo",
    "Payments already recorded between members, newest first.":
      "Pagos ya registrados entre miembros, los más recientes primero.",
    "No settlements recorded yet.": "Aún no hay liquidaciones registradas.",
    "Select an expense for the per-receipt split map, or switch to {label}.":
      "Selecciona un gasto para el mapa de reparto por recibo, o cambia a {label}.",
    "Select an expense from the list to see the full breakdown and settlements.":
      "Selecciona un gasto de la lista para ver el desglose completo y las liquidaciones.",
    Profile: "Perfil",
    "Display name": "Nombre visible",
    "Preferred currency": "Moneda preferida",
    "Select currency": "Seleccionar moneda",
    "Save profile": "Guardar perfil",
    "Change password": "Cambiar contraseña",
    "Current password": "Contraseña actual",
    "New password": "Nueva contraseña",
    "Update password": "Actualizar contraseña",
    "Profile updated.": "Perfil actualizado.",
    "Password updated.": "Contraseña actualizada.",
    "Sign out everywhere on this device":
      "Cerrar sesión en este dispositivo en todas partes",
    "Reset password": "Restablecer contraseña",
    "Send reset link": "Enviar enlace de restablecimiento",
    "Back to sign in": "Volver a iniciar sesión",
    "Confirm email": "Confirmar correo",
    "Confirming…": "Confirmando…",
    Continue: "Continuar",
    "Almost there…": "Casi listo…",
    "Thanks — your email is confirmed.": "Gracias — tu correo está confirmado.",
    "We&apos;re confirming your email now. If needed, you can retry below.":
      "Estamos confirmando tu correo ahora. Si es necesario, puedes reintentar abajo.",
    "This link is missing required information. Request a new confirmation email from the app banner.":
      "A este enlace le falta información necesaria. Solicita un nuevo correo de confirmación desde el banner de la app.",
    "Enter your email and we&apos;ll send a link when the account exists.":
      "Ingresa tu correo y enviaremos un enlace si la cuenta existe.",
    "If that email exists, a reset link has been sent.":
      "Si ese correo existe, se ha enviado un enlace de restablecimiento.",
    "Securing your session and balances…": "Asegurando tu sesión y saldos…",
    "Update your display name and currency, and change your password.":
      "Actualiza tu nombre visible y moneda, y cambia tu contraseña.",
    Someone: "Alguien",
    paid: "pagó",
    View: "Ver",
    "Balances per group and your latest expense activity.":
      "Saldos por grupo y tu actividad de gastos más reciente.",
    "Active groups": "Grupos activos",
    "Manage groups": "Gestionar grupos",
    "You are owed": "Te deben",
    "Totals by currency across groups": "Totales por moneda entre grupos",
    "You owe": "Debes",
    "Settle up": "Saldar",
    "Per-group balances": "Saldos por grupo",
    "Join a group to see how much you owe and are owed.":
      "Únete a un grupo para ver cuánto debes y cuánto te deben.",
    Group: "Grupo",
    "Recent activity": "Actividad reciente",
    "Expenses and settlements, newest first":
      "Gastos y liquidaciones, los más recientes primero",
    "All activity": "Toda la actividad",
    "No transactions or settlements yet in your groups.":
      "Aún no hay transacciones ni liquidaciones en tus grupos.",
    Expense: "Gasto",
    Settlement: "Liquidación",
    "Loading expenses…": "Cargando gastos…",
    Transport: "Transporte",
    Food: "Comida",
    Accommodation: "Alojamiento",
    Entertainment: "Entretenimiento",
    Utilities: "Servicios",
    Shopping: "Compras",
    Other: "Otros",
    "Category {id}": "Categoría {id}",
    you: "tú",
    Member: "Miembro",
    "Enter an amount greater than zero.": "Ingresa un monto mayor que cero.",
    "This group has no members to split with yet.":
      "Este grupo aún no tiene miembros para dividir.",
    "Splits must add up to {total} {currency}. Current: {current}.":
      "Los repartos deben sumar {total} {currency}. Actual: {current}.",
    "Confirm your email to load expenses from the API.":
      "Confirma tu correo para cargar gastos desde la API.",
    "Add transactions for a group. Amounts use the group&apos;s default currency ({currency}). You are recorded as the person who paid.":
      "Agrega transacciones para un grupo. Los montos usan la moneda predeterminada del grupo ({currency}). Se te registra como quien pagó.",
    "Choose a group": "Elige un grupo",
    "No groups yet — create one under Groups":
      "Aún no hay grupos — crea uno en Grupos",
    Transactions: "Transacciones",
    "No transactions in this group yet.":
      "Aún no hay transacciones en este grupo.",
    "Select a group to add an expense.":
      "Selecciona un grupo para agregar un gasto.",
    Currency: "Moneda",
    "(must match the group — set when the group was created)":
      "(debe coincidir con el grupo — se define al crear el grupo)",
    "Amount ({currency})": "Monto ({currency})",
    "0.00": "0,00",
    "Description (optional)": "Descripción (opcional)",
    "Dinner, rent, taxi…": "Cena, renta, taxi…",
    "Pick a category": "Elige una categoría",
    "Split between members": "Dividir entre miembros",
    "Equal split ({count} member)": "División equitativa ({count} miembro)",
    "Custom amounts": "Montos personalizados",
    "Add transaction": "Agregar transacción",
    "Default currency · {currency}": "Moneda predeterminada · {currency}",
    "Confirm your email to create and list groups.":
      "Confirma tu correo para crear y listar grupos.",
    "Shareable groups with invite tokens — matches the settlements and expense flows in the design reference.":
      "Grupos compartibles con tokens de invitación — coincide con los flujos de liquidaciones y gastos del diseño de referencia.",
    "You opened an invite link — the code is filled in below. Tap":
      "Abriste un enlace de invitación — el código se completó abajo. Toca",
    "Join group": "Unirse al grupo",
    "when you&apos;re ready.": "cuando estés listo.",
    "Loading invitations…": "Cargando invitaciones…",
    "Pending group invitations": "Invitaciones de grupo pendientes",
    "Group invitations": "Invitaciones de grupo",
    "From {name}": "De {name}",
    Dismiss: "Descartar",
    "New group name": "Nombre del nuevo grupo",
    "Ski trip 2024": "Viaje de ski 2024",
    "Create group": "Crear grupo",
    "Join with invite code": "Unirse con código de invitación",
    "Paste the invite code (or open a shared link). Group UUID is not used here — only the invite token from the owner.":
      "Pega el código de invitación (o abre un enlace compartido). El UUID del grupo no se usa aquí — solo el token de invitación del propietario.",
    "Invite code from share link or group owner":
      "Código de invitación del enlace compartido o del propietario del grupo",
    "Joining…": "Uniéndose…",
    "Your groups": "Tus grupos",
    "No groups yet — create one above.": "Aún no hay grupos — crea uno arriba.",
    Invite: "Invitar",
    "Open group": "Abrir grupo",
    "Share invite": "Compartir invitación",
    'You\'re invited to join "{group}" on Cayeshni.\n\nOpen: {url}\n\nOr enter this invite code: {inviteToken}':
      'Estás invitado a unirte a "{group}" en Cayeshni.\n\nAbrir: {url}\n\nO ingresa este código de invitación: {inviteToken}',
    'Join link copied for "{group}".':
      'Enlace de unión copiado para "{group}".',
    'Invite code copied for "{group}".':
      'Código de invitación copiado para "{group}".',
    "Could not copy automatically — copy the invite code from the list.":
      "No se pudo copiar automáticamente — copia el código de invitación de la lista.",
    "Loading friends…": "Cargando amigos…",
    "Could not copy to clipboard.": "No se pudo copiar al portapapeles.",
    "You cannot send a friend request to yourself.":
      "No puedes enviarte una solicitud de amistad a ti mismo.",
    "Friend request sent.": "Solicitud de amistad enviada.",
    "Enter a valid email address for your friend’s Cayeshni account.":
      "Ingresa un correo válido para la cuenta Cayeshni de tu amigo.",
    "Search for someone by name and pick their profile, or use email.":
      "Busca a alguien por nombre y elige su perfil, o usa el correo.",
    "You are now friends.": "Ahora son amigos.",
    "Friend removed.": "Amigo eliminado.",
    "Confirm your email to use friends.":
      "Confirma tu correo para usar amigos.",
    "Search by display name, pick the right person from the list, or send by email. Accept incoming requests below.":
      "Busca por nombre visible, elige a la persona correcta de la lista o envía por correo. Acepta solicitudes entrantes abajo.",
    "Your email": "Tu correo",
    "Others can send you a request with this address.":
      "Otros pueden enviarte una solicitud con esta dirección.",
    Copy: "Copiar",
    "Send a friend request": "Enviar solicitud de amistad",
    "Search by display name": "Buscar por nombre visible",
    Change: "Cambiar",
    "Send request": "Enviar solicitud",
    "Type at least 2 characters…": "Escribe al menos 2 caracteres…",
    "Searching…": "Buscando…",
    "No matching profiles.": "No hay perfiles coincidentes.",
    "I have their email instead": "Tengo su correo en su lugar",
    "Their email": "Su correo",
    "friend@example.com": "amigo@ejemplo.com",
    "Search by name instead": "Buscar por nombre en su lugar",
    "Incoming requests": "Solicitudes entrantes",
    "No pending requests.": "No hay solicitudes pendientes.",
    Accept: "Aceptar",
    "Your friends ({count})": "Tus amigos ({count})",
    "No friends yet. Send a request or accept one above.":
      "Aún no tienes amigos. Envía una solicitud o acepta una arriba.",
    Remove: "Eliminar",
    "Remove {name} from your friends list?":
      "¿Eliminar a {name} de tu lista de amigos?",
    "Choose another member as payee.": "Elige otro miembro como beneficiario.",
    "Enter a positive amount.": "Ingresa un monto positivo.",
    "Amount cannot exceed what you still owe this member on shared expenses ({amount} {currency}).":
      "El monto no puede exceder lo que aún debes a este miembro por gastos compartidos ({amount} {currency}).",
    "No matching expenses to apply this payment to. Pick a payee you owe through a shared expense they paid for.":
      "No hay gastos coincidentes para aplicar este pago. Elige un beneficiario al que debas por un gasto compartido que haya pagado.",
    "Confirm your email to load settlements.":
      "Confirma tu correo para cargar liquidaciones.",
    "Loading your account…": "Cargando tu cuenta…",
    "Record cash or external transfers against shared expenses. Allocations apply to the oldest matching expenses first.":
      "Registra pagos en efectivo o transferencias externas contra gastos compartidos. Las asignaciones se aplican primero a los gastos coincidentes más antiguos.",
    "Join or create a group to use settlements.":
      "Únete o crea un grupo para usar liquidaciones.",
    Balances: "Saldos",
    "No members or debt data.": "Sin miembros ni datos de deuda.",
    "Remaining owed": "Pendiente de pago",
    "Record payment": "Registrar pago",
    "You record a payment from you to someone you owe through expenses they paid for in this group.":
      "Registras un pago de ti a alguien a quien debes por gastos que pagó en este grupo.",
    "Loading group…": "Cargando grupo…",
    "Pay to": "Pagar a",
    "Loading payees…": "Cargando beneficiarios…",
    "No one you owe in this group": "No le debes a nadie en este grupo",
    "Select member…": "Seleccionar miembro…",
    "No one you currently owe through shared expenses":
      "No le debes a nadie actualmente por gastos compartidos",
    "Use max ({amount})": "Usar máximo ({amount})",
    "Loading expense breakdown…": "Cargando desglose de gastos…",
    "Max toward {name}": "Máximo hacia {name}",
    "Note (optional)": "Nota (opcional)",
    "e.g. Venmo, cash": "p. ej., Venmo, efectivo",
    "Will apply to {count} expense(s)": "Se aplicará a {count} gasto(s)",
    "{count} expense allocation": "{count} asignación de gasto",
    "{count} expense allocations": "{count} asignaciones de gasto",
    "Record settlement": "Registrar liquidación",
    "Settlement history": "Historial de liquidaciones",
    "No settlements recorded for this group.":
      "No hay liquidaciones registradas para este grupo.",
    "Save note": "Guardar nota",
    "Edit note": "Editar nota",
    Delete: "Eliminar",
    "Remove this settlement?": "¿Eliminar esta liquidación?",
    "Balances on the linked expenses will update to reflect that this payment no longer happened.":
      "Los saldos de los gastos vinculados se actualizarán para reflejar que este pago ya no ocurrió.",
    "Remove settlement": "Eliminar liquidación",
    "Keep it": "Conservar",
    "Confirm your email to view and edit your profile. After you use the link in your inbox, refresh this page.":
      "Confirma tu correo para ver y editar tu perfil. Después de usar el enlace en tu bandeja de entrada, actualiza esta página.",
    "Manage your photo, display name, and default currency.":
      "Gestiona tu foto, tu nombre visible y la moneda predeterminada.",
    "Password &amp; security →": "Contraseña y seguridad →",
    "Member since": "Miembro desde",
    "Change photo": "Cambiar foto",
    "Remove photo": "Eliminar foto",
    "Edit details": "Editar detalles",
    "Photo updated.": "Foto actualizada.",
    "Photo removed.": "Foto eliminada.",
    "This route has no budget line": "Esta ruta no tiene línea de presupuesto",
    "The server checked under the couch cushions. Still nothing.":
      "El servidor revisó debajo de los cojines del sofá. Nada todavía.",
    "Meme: Drake format about 404 pages":
      "Meme: formato Drake sobre páginas 404",
    "Admitting you typed the URL wrong": "Admitir que escribiste la URL mal",
    "Blaming inflation for a missing page (same energy)":
      "Culpar a la inflación por una página faltante (misma energía)",
    "Not routes 📉": "No son rutas 📉",
    '"We underwrote this URL. The risk model said no."':
      '"Aseguramos esta URL. El modelo de riesgo dijo no."',
    "- your browser's CFO (probably)":
      "- el CFO de tu navegador (probablemente)",
    Home: "Inicio",
  },
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function interpolate(
  message: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return message;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    message,
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
    const preferred =
      stored ?? normalizeLocale(navigator.language) ?? DEFAULT_LOCALE;
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
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: RTL_LOCALES.has(locale) ? "rtl" : "ltr",
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export const LANGUAGE_OPTIONS: {
  value: Locale;
  label: string;
  description: string;
}[] = [
  { value: "en", label: "English", description: "English" },
  { value: "ar", label: "Arabic", description: "العربية" },
  { value: "fr", label: "French", description: "Français" },
  { value: "de", label: "German", description: "Deutsch" },
  { value: "es", label: "Spanish", description: "Español" },
];
