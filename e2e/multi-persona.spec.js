const { test, expect } = require("@playwright/test");
const { generatePersonas, scenarios } = require("./utils/persona-sim");

const seed = Number(process.env.PERSONA_SEED || "42");
const personaN = Number(process.env.PERSONA_N || "12");

test("multi-persona core loop simulation", async ({ page }) => {
  const personas = generatePersonas(seed, personaN);

  await page.goto("/chatbot");
  await page.evaluate(() => window.localStorage.clear());

  for (const persona of personas) {
    for (const scenario of scenarios) {
      const input = scenario.message(persona);

      await page.goto("/chatbot");
      await page.getByTestId("chat-input").fill(input);
      await page.getByTestId("chat-send").click();

      const reply = page.getByTestId("assistant-reply").last();
      await expect(reply).toBeVisible();
      await expect(reply).toContainText("Meaning:");
      await expect(reply).toContainText("Alignment Action:");
      await expect(reply).toContainText("Why:");

      await expect(page.getByTestId("save-panel")).toBeVisible();
      if (scenario.promoteToStar) {
        await page.getByTestId("save-promote-star").click();
      } else {
        await page.getByTestId("save-spark").click();
      }

      await page.goto("/journal");
      const journalList = page.getByTestId("journal-list");
      await expect(journalList).toBeVisible();
      await expect(journalList).toContainText(persona.id);
      await expect(journalList).toContainText(persona.name);

      await page.goto("/constellation");
      await expect(page.getByTestId("constellation-view")).toBeVisible();
      await expect(page.getByTestId("node-spark").first()).toBeVisible();
      if (scenario.promoteToStar) {
        await expect(page.getByTestId("node-star").first()).toBeVisible();
      }

      const validation = await page.evaluate(({ expectedEventType }) => {
        const entries = JSON.parse(window.localStorage.getItem("gaci-journal-entries") || "[]");
        const fromChatbot = entries.filter((entry) => entry.source === "chatbot");
        const latest = fromChatbot[0];
        return {
          hasChatbotEntry: fromChatbot.length > 0,
          eventTypeMatches: typeof latest?.eventType === "string" ? latest.eventType === expectedEventType : true
        };
      }, { expectedEventType: scenario.expectedEventType });

      expect(validation.hasChatbotEntry).toBeTruthy();
      expect(validation.eventTypeMatches).toBeTruthy();
    }
  }
});
