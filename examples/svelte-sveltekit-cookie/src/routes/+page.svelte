<script lang="ts">
  import { format, locales, t } from "yapyak";
  import { locale, RichText } from "@yapyak/svelte";
  import { localeForm } from "./locale.remote";

  const date = new Date("2024-01-01T08:30:00Z");
</script>

<main style="font-family: system-ui; padding: 2rem; max-width: 720px;">
  <h1>{t("Hello there")}</h1>
  <p>{t("This is the {name} example.", { name: "yapyak" })}</p>

  <h2>{t("Plurals")}</h2>
  <p>
    {t("You have {count, plural, one {# message} other {# messages}}", {
      count: 3,
    })}
  </p>
  <p>
    {t("You have {count, plural, one {# message} other {# messages}}", {
      count: 1,
    })}
  </p>

  <h2>{t("Numbers")}</h2>
  <p>{t("Total: {amount, number, percent}", { amount: 0.42 })}</p>
  <p>{t("Price: {amount, number, currency EUR}", { amount: 99.5 })}</p>
  <p>{t("Count: {amount, number, integer}", { amount: 42.7 })}</p>

  <h2>{t("Dates and times")}</h2>
  <p>{t("Updated: {when, date, long}", { when: date })}</p>
  <p>{t("Updated: {when, date, short}", { when: date })}</p>
  <p>{t("At: {when, time, short}", { when: date })}</p>

  <h2>{t("Select")}</h2>
  <p>
    {t("{role, select, admin {Administrator} editor {Editor} other {Viewer}}", {
      role: "editor",
    })}
  </p>

  <h2>{t("Lists")}</h2>
  <p>{format.list(["apple", "pear", "banana"])}</p>

  <h2>{t("Relative time")}</h2>
  <p>{format.relativeTime(-2, "day")}</p>
  <p>{format.relativeTime(3, "hour")}</p>

  <h2>{t("Rich text")}</h2>
  <p>
    <RichText value={t("Translate <b>everything</b> with <link>yapyak</link>")}>
      {#snippet b(children)}
        <strong>{@render children()}</strong>
      {/snippet}
      {#snippet link(children)}
        <a href="https://yapyak.dev">{@render children()}</a>
      {/snippet}
    </RichText>
  </p>

  <h2>{t("Switch language")}</h2>

  <p>{t("From the client")}</p>
  <div style="display: flex; gap: 0.5rem;">
    {#each locales as value (value)}
      <button
        type="button"
        disabled={value === locale.current}
        onclick={() => (locale.current = value)}
      >
        {value === "sv" ? t("Swedish") : t("English")}
      </button>
    {/each}
  </div>

  <p>{t("From the server")}</p>
  <form {...localeForm} style="display: flex; gap: 0.5rem;">
    {#each locales as value (value)}
      <button name="locale" {value} disabled={value === locale.current}>
        {value === "sv" ? t("Swedish") : t("English")}
      </button>
    {/each}
  </form>
</main>
