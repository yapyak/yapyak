---
"yapyak": patch
---

Report a currency code the platform cannot format as YAP0054 instead of failing the build. `{amount, number, currency BTC}` was an error, and the hint it carried told you to check your ICU syntax, which was never the problem. The code is now a warning of its own, the currency reaches the runtime, and the runtime does what it always could: format the number for the locale, append the code, and report YAP0035 once. Codes the standard does not carry, such as those used for crypto, now build. A typo like `EURO` still reports, so read the code before dismissing the warning.
