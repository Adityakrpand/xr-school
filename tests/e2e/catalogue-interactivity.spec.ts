import { expect, test } from "@playwright/test";

test("pollination requires a hands-on observation before advancing", async ({
  page,
}) => {
  await page.goto("/simulations/pollination");
  await page.getByRole("button", { name: /View in Browser/ }).click();

  const next = page.getByRole("button", { name: "Next Stage →" });
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "Inspect the flower parts" }).click();
  await expect(page.getByText(/Observation complete:/)).toBeVisible();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(
    page.getByRole("button", { name: "Release pollen from the anthers" }),
  ).toBeVisible();
});

test("circuit actions provide feedback and drive stage progression", async ({
  page,
}) => {
  await page.goto("/simulations/circuit");
  await page.getByRole("button", { name: /View in Browser/ }).click();

  await page.getByRole("button", { name: /OFF/ }).click();
  await expect(page.getByText(/Circuit closed: electrons flow/)).toBeVisible();
  await expect(page.getByText(/Stage 2 \/ 4/)).toBeVisible();

  await page.getByRole("button", { name: "50 Ω" }).click();
  await expect(page.getByText(/Resistance changed to 50 ohms/)).toBeVisible();
  await expect(page.getByText(/Stage 3 \/ 4/)).toBeVisible();
});

test("synthetic fibres unlocks manufacturing after active scanning", async ({
  page,
}) => {
  await page.goto("/simulations/synthetic-fibres-types");
  await page
    .getByRole("button", { name: "Enter the futuristic fibre laboratory" })
    .click();

  for (const material of [/Cotton cloth/, /Woollen cloth/, /Silk fabric/]) {
    await page.getByRole("button", { name: material }).click();
  }
  const next = page.getByRole("button", {
    name: "Enter the manufacturing chamber →",
  });
  await expect(next).toBeEnabled();
  await next.click();
  await expect(
    page.getByRole("button", { name: /Start: soften polymer/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Replay narration" }),
  ).toBeVisible();
});

test("solubility predictions are selectable and narrated", async ({ page }) => {
  await page.goto("/simulations/soluble-insoluble-substances");
  await page
    .getByRole("button", { name: "Enter Professor Aqua's laboratory" })
    .click();

  const dissolve = page.getByRole("button", {
    name: "Sugar: will dissolve",
  });
  await dissolve.click();
  await expect(dissolve).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/Sugar: prediction recorded/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Replay narration" }),
  ).toBeVisible();
});

test("traffic safety completes the full Smart Road mission", async ({
  page,
}) => {
  await page.goto("/simulations/traffic-signs-road-safety");
  await page.getByRole("button", { name: "Enter Smart City" }).click();
  await page.getByRole("button", { name: /At a zebra crossing/ }).click();
  await page.getByRole("button", { name: /Begin the safety mission/ }).click();

  for (const sign of ["STOP", "NO ENTRY", "SPEED LIMIT 40", "SCHOOL AHEAD"]) {
    await page
      .getByRole("button", { name: new RegExp(`Restore ${sign}`) })
      .click();
  }
  await page
    .getByRole("button", { name: /Continue to the traffic lights/ })
    .click();

  await page.getByRole("button", { name: /RED$/ }).click();
  await page.getByRole("button", { name: /YELLOW$/ }).click();
  await page.getByRole("button", { name: /GREEN$/ }).click();
  await page
    .getByRole("button", { name: /Continue to the zebra crossing/ })
    .click();

  await page.getByRole("button", { name: /Use the zebra crossing/ }).click();
  for (const step of [
    "Stop at the footpath edge",
    "Look right",
    "Look left",
    "Look right again",
    "Listen for vehicles",
    "Check that vehicles have stopped",
    "Walk straight across—do not run",
  ]) {
    await page.getByRole("button", { name: `→ ${step}`, exact: true }).click();
  }
  await page
    .getByRole("button", { name: /Take Robo's final safety test/ })
    .click();

  for (const answer of [
    "Stop completely",
    "Vehicles cannot enter",
    "Stop",
    "At a zebra crossing",
    "Slow down and watch",
  ]) {
    await page.getByRole("button", { name: new RegExp(answer) }).click();
  }

  await expect(
    page.getByRole("heading", { name: "Traffic Safety Hero!" }),
  ).toBeVisible();
  await expect(page.getByText(/Follow signs · Obey signals/)).toBeVisible();
});
