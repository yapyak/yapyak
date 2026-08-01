<script lang="ts">
  import { format, t, locales } from "yapyak";
  import { locale, RichText } from "@yapyak/svelte";

  const date = new Date("2024-01-01T08:30:00Z");
</script>

<main style="font-family: system-ui; max-width: 720px; padding: 32px;">
  <h1>{t("Hello there")}</h1>
  <p>{t("This is the {name} example.", { name: "yapyak" })}</p>

  <h2>{t("Switch language")}</h2>
  <div style="display: flex; gap: 8px;">
    {#each locales as value}
      <a
        href={`/${value}`}
        aria-current={value === locale.current ? "page" : undefined}
      >
        {value === "sv" ? t("Swedish") : t("English")}
      </a>
    {/each}
  </div>

  <h2>{t("Homonyms")}</h2>
  <div><button type="button">{t.as("button", "Open")}</button></div>
  <div><span>{t.as("badge", "Open")}</span></div>

  <h2>{t("Language preview")}</h2>
  <p>{t.in("en", "Hello there")}</p>
  <p>{t.in("sv", "Hello there")}</p>

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
  <p>{format.list([t("apple"), t("pear"), t("banana")])}</p>

  <h2>{t("Relative time")}</h2>
  <p>{format.relativeTime(-2, "day")}</p>
  <p>{format.relativeTime(3, "hour")}</p>

  <h2>{t("Rich text")}</h2>
  <p>
    <RichText
      value={t(
        "Translate <b>everything</b> with <link>yapyak</link>.<br/>Even with <b>line breaks</b>.",
      )}
    >
      {#snippet b(children)}
        <strong>{@render children()}</strong>
      {/snippet}
      {#snippet br()}
        <br />
      {/snippet}
      {#snippet link(children)}
        <a href="https://yapyak.dev">{@render children()}</a>
      {/snippet}
    </RichText>
  </p>
</main>
